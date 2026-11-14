export type BridgeRequest = {
  type: 'request';
  method: string;
  args: unknown[];
  id: string;
};

export type BridgeResponse =
  | { type: 'response'; id: string; result: unknown }
  | { type: 'response'; id: string; error: string };

export type BridgeEvent = {
  type: 'event';
  event: string;
  payload: unknown;
};

export type BridgeMessage = BridgeRequest | BridgeResponse | BridgeEvent;
