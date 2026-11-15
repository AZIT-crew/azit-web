import { act, useRef, type RefObject } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';

import { useInfiniteScroll } from './useInfiniteScroll';

it('부모의 스크롤 ref가 커밋된 뒤 올바른 요소에 관찰자를 연결한다', async () => {
  const observe = vi.fn();
  const disconnect = vi.fn();
  const roots: (Element | Document | null)[] = [];
  class Observer {
    constructor(
      _callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit
    ) {
      roots.push(options?.root ?? null);
    }
    observe = observe;
    disconnect = disconnect;
  }
  vi.stubGlobal('IntersectionObserver', Observer);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  function Child({
    scrollRef,
  }: {
    scrollRef: RefObject<HTMLDivElement | null>;
  }) {
    const { bottomSentinelRef } = useInfiniteScroll({
      scrollRef,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    });
    return <div data-testid="sentinel" ref={bottomSentinelRef} />;
  }
  function Parent() {
    const scrollRef = useRef<HTMLDivElement>(null);
    return (
      <div data-testid="scroll" ref={scrollRef}>
        <Child scrollRef={scrollRef} />
      </div>
    );
  }
  try {
    await act(async () => {
      root.render(<Parent />);
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(roots).toEqual([container.querySelector('[data-testid="scroll"]')]);
    expect(observe).toHaveBeenCalledWith(
      container.querySelector('[data-testid="sentinel"]')
    );
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  }
  expect(disconnect).toHaveBeenCalledTimes(1);
});
