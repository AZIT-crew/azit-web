import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';

import { useFunnel } from './useFunnel';

it('부모의 요청 상태가 바뀌어도 현재 단계의 입력값과 DOM을 보존한다', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const flow = { first: 'second', second: null } as const;
  let setPending: (value: boolean) => void;
  function Field() {
    const [value, setValue] = useState('');
    return (
      <input value={value} onChange={(event) => setValue(event.target.value)} />
    );
  }
  function Page() {
    const { Funnel } = useFunnel('first', flow);
    const [pending, updatePending] = useState(false);
    setPending = updatePending;
    return (
      <Funnel>
        <Funnel.Step
          name="first"
          render={({ onNext }) => (
            <>
              <Field />
              <button disabled={pending} onClick={() => onNext()}>
                다음
              </button>
            </>
          )}
        />
        <Funnel.Step
          name="second"
          render={({ onPrev }) => <button onClick={onPrev}>이전</button>}
        />
      </Funnel>
    );
  }
  try {
    await act(async () => root.render(<Page />));
    const input = container.querySelector('input')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!.call(input, 'NOON03');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      setPending(true);
    });
    expect(container.querySelector('input')).toBe(input);
    expect(input.value).toBe('NOON03');
    expect(container.querySelector('button')!.disabled).toBe(true);
    await act(async () => setPending(false));
    expect(input.value).toBe('NOON03');
    await act(async () => container.querySelector('button')!.click());
    expect(container.textContent).toBe('이전');
    await act(async () => container.querySelector('button')!.click());
    expect(container.querySelector('input')).not.toBeNull();
  } finally {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});
