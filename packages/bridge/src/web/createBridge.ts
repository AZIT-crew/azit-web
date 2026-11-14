import type {
  BridgeEvent,
  BridgeRequest,
  BridgeResponse,
} from '../shared/types/protocol';

type AnyBridgeFn = (...args: unknown[]) => Promise<unknown>;

type BridgeInstance<T extends Record<string, AnyBridgeFn>> = T & {
  isNativeMethodAvailable(method: keyof T | string): boolean;
  on<K extends string>(
    event: K,
    handler: (payload: unknown) => void
  ): () => void;
};

type CreateBridgeOptions = {
  timeout?: number;
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sendToNative(message: BridgeRequest): void {
  const json = JSON.stringify(message);
  // iOS WKWebView 채널
  if (
    typeof window !== 'undefined' &&
    (
      window as unknown as {
        webkit?: {
          messageHandlers?: { bridge?: { postMessage: (msg: string) => void } };
        };
      }
    ).webkit?.messageHandlers?.bridge
  ) {
    (
      window as unknown as {
        webkit: {
          messageHandlers: { bridge: { postMessage: (msg: string) => void } };
        };
      }
    ).webkit.messageHandlers.bridge.postMessage(json);
    return;
  }
  // Android / React Native WebView 채널
  if (
    typeof window !== 'undefined' &&
    (
      window as unknown as {
        ReactNativeWebView?: { postMessage: (msg: string) => void };
      }
    ).ReactNativeWebView
  ) {
    (
      window as unknown as {
        ReactNativeWebView: { postMessage: (msg: string) => void };
      }
    ).ReactNativeWebView.postMessage(json);
    return;
  }
}

function isWebViewEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const w = window as unknown as {
    webkit?: { messageHandlers?: { bridge?: unknown } };
    ReactNativeWebView?: unknown;
  };
  return !!(w.webkit?.messageHandlers?.bridge ?? w.ReactNativeWebView);
}

export function createBridge<T extends Record<string, AnyBridgeFn>>(
  options: CreateBridgeOptions = {}
): BridgeInstance<T> {
  const timeout = options.timeout ?? 20000;
  const pendingRequests = new Map<
    string,
    { resolve: (value: unknown) => void; reject: (reason: unknown) => void }
  >();
  const eventHandlers = new Map<string, Set<(payload: unknown) => void>>();

  function handleMessage(event: MessageEvent) {
    let message: unknown;
    try {
      message =
        typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    } catch {
      return;
    }

    if (typeof message !== 'object' || message === null) {
      return;
    }

    const msg = message as {
      type?: string;
      id?: string;
      result?: unknown;
      error?: string;
      event?: string;
      payload?: unknown;
    };

    if (msg.type === 'response' && typeof msg.id === 'string') {
      const pending = pendingRequests.get(msg.id);
      if (!pending) {
        return;
      }
      pendingRequests.delete(msg.id);
      if ('error' in msg && typeof msg.error === 'string') {
        pending.reject(new Error(msg.error));
      } else {
        pending.resolve(msg.result);
      }
      return;
    }

    if (msg.type === 'event' && typeof msg.event === 'string') {
      const handlers = eventHandlers.get(msg.event);
      if (!handlers) {
        return;
      }
      for (const handler of handlers) {
        handler(msg.payload);
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('message', handleMessage);
  }

  const bridge = {
    isNativeMethodAvailable(_method: keyof T | string): boolean {
      return isWebViewEnvironment();
    },
    on<K extends string>(
      event: K,
      handler: (payload: unknown) => void
    ): () => void {
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, new Set());
      }
      eventHandlers.get(event)!.add(handler);
      return () => {
        eventHandlers.get(event)?.delete(handler);
      };
    },
  } as BridgeInstance<T>;

  return new Proxy(bridge, {
    get(target, prop: string) {
      if (prop in target) {
        return (target as Record<string, unknown>)[prop];
      }

      return (...args: unknown[]): Promise<unknown> => {
        return new Promise((resolve, reject) => {
          const id = generateId();
          const request: BridgeRequest = {
            type: 'request',
            method: prop,
            args,
            id,
          };

          const timer = setTimeout(() => {
            pendingRequests.delete(id);
            reject(
              new Error(
                `Bridge timeout: method '${prop}' did not respond within ${timeout}ms`
              )
            );
          }, timeout);

          pendingRequests.set(id, {
            resolve: (value) => {
              clearTimeout(timer);
              resolve(value);
            },
            reject: (reason) => {
              clearTimeout(timer);
              reject(reason);
            },
          });

          sendToNative(request);
        });
      };
    },
  });
}
