import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';

import { useLimitedTextInput } from './useLimitedTextInput';

it('초기 닉네임·지우기와 10번째 한글 조합을 보존하고 초과 조합을 거절한다', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  function Field() {
    const { reset, ...input } = useLimitedTextInput({
      maxLength: 10,
      initialValue: '테스터',
    });
    return (
      <>
        <input {...input} />
        <button onClick={() => reset()}>지우기</button>
      </>
    );
  }
  try {
    await act(async () => root.render(<Field />));
    const input = container.querySelector('input')!;
    expect(input.value).toBe('테스터');
    const enter = async (value: string, composing = false) =>
      act(async () => {
        Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value'
        )!.set!.call(input, value);
        input.dispatchEvent(
          new InputEvent('input', { bubbles: true, isComposing: composing })
        );
      });
    await act(async () => container.querySelector('button')!.click());
    expect(input.value).toBe('');
    await enter('한'.repeat(9));
    await act(async () =>
      input.dispatchEvent(
        new CompositionEvent('compositionstart', { bubbles: true })
      )
    );
    for (const syllable of ['ㄱ', '가', '각']) {
      await enter('한'.repeat(9) + syllable, true);
      expect(input.value).toBe('한'.repeat(9) + syllable);
    }
    await enter('한'.repeat(9) + '가가', true);
    expect(input.value).toBe('한'.repeat(9) + '각');
    await act(async () =>
      input.dispatchEvent(
        new CompositionEvent('compositionend', { bubbles: true })
      )
    );
    await enter('한'.repeat(9) + '가가');
    expect(input.value).toBe('한'.repeat(9) + '각');
    await act(async () => container.querySelector('button')!.click());
    await enter(' QA');
    expect(input.value).toBe(' QA');
  } finally {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});
