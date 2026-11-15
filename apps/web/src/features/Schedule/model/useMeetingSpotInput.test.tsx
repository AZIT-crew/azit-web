import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { useMeetingSpotInput } from './useMeetingSpotInput';

function Field() {
  const props = useMeetingSpotInput();
  return <input {...props} />;
}

let container: HTMLDivElement;
let root: Root;
let input: HTMLInputElement;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});
afterAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: false });
});
beforeEach(async () => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<Field />);
  });
  input = container.querySelector('input')!;
});
afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
});

async function enter(value: string, composing = false) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )!.set!.call(input, value);
    input.setSelectionRange(value.length, value.length);
    input.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        inputType: composing ? 'insertCompositionText' : 'insertText',
        isComposing: composing,
      })
    );
  });
  expect(input.value.length).toBeLessThanOrEqual(15);
}

async function composition(
  type: 'compositionstart' | 'compositionend',
  data = ''
) {
  await act(async () => {
    input.dispatchEvent(new CompositionEvent(type, { bubbles: true, data }));
  });
}

async function paste(text: string) {
  await act(async () => {
    const event = new Event('paste', { bubbles: true, cancelable: true });
    Object.assign(event, { clipboardData: { getData: () => text } });
    input.dispatchEvent(event);
  });
  expect(input.value.length).toBeLessThanOrEqual(15);
}

describe('집합 장소명 입력', () => {
  it('선행 공백은 입력되지 않고 중간 띄어쓰기는 유지된다', async () => {
    await enter('   ');
    expect(input.value).toBe('');
    await enter('  반포 한강 공원');
    expect(input.value).toBe('반포 한강 공원');
  });

  it('긴 입력과 붙여넣기를 최대 15자로 제한한다', async () => {
    await enter('1234567890123456');
    expect(input.value).toBe('123456789012345');
    await act(async () => {
      input.dispatchEvent(new Event('paste', { bubbles: true }));
    });
    await enter('  가나다라마바사아자차카타파하가나');
    expect(input.value).toBe('가나다라마바사아자차카타파하가');
  });

  it('앞 공백이 있는 긴 문자열을 붙여넣어도 공백을 제외하고 15자까지 입력한다', async () => {
    await paste('  1234567890123456');
    expect(input.value).toBe('123456789012345');
  });

  it('중간에 붙여넣으면 선택 영역과 남은 길이만 사용하고 뒤의 글자는 보존한다', async () => {
    await enter('123456789012345');
    input.setSelectionRange(2, 5);
    await paste('가나다라마');
    expect(input.value).toBe('12가나다6789012345');
    input.setSelectionRange(2, 2);
    await paste('새 글자');
    expect(input.value).toBe('12가나다6789012345');
  });

  it('15번째 한글의 초성·중성·종성 조합이 끝까지 갱신된다', async () => {
    const prefix = '가'.repeat(14);
    await enter(prefix);
    await composition('compositionstart');
    for (const syllable of ['ㄱ', '가', '각']) {
      await enter(prefix + syllable, true);
      expect(input.value).toBe(prefix + syllable);
    }
    await composition('compositionend', '각');
    expect(input.value).toBe(prefix + '각');
  });

  it('한도를 넘기는 조합이 앞 음절의 받침을 없애지 않는다', async () => {
    const prefix = '가'.repeat(14);
    await enter(prefix);
    await composition('compositionstart');
    await enter(prefix + '각', true);
    await enter(prefix + '가가', true);
    expect(input.value).toBe(prefix + '각');
    await composition('compositionend', '가가');
    // 일부 브라우저는 조합 종료 후 최종 input을 다시 전달한다.
    await enter(prefix + '가나');
    expect(input.value).toBe(prefix + '각');
    await enter(prefix + '가나');
    expect(input.value).toBe(prefix + '각');
  });

  it('이미 15자인 값 뒤의 추가 한글 조합은 원래 값을 보존한다', async () => {
    const full = '한'.repeat(15);
    await enter(full);
    await composition('compositionstart');
    for (const draft of ['ㄱ', '가', '각']) {
      await enter(full + draft, true);
      expect(input.value).toBe(full);
    }
    await composition('compositionend', '각');
    await enter(full + '각');
    expect(input.value).toBe(full);
  });

  it('15자에서 기존 글자를 선택해 한글로 대체할 수 있다', async () => {
    const prefix = '가'.repeat(14);
    await enter(prefix + '나');
    input.setSelectionRange(14, 15);
    await composition('compositionstart');
    await enter(prefix + 'ㄱ', true);
    await enter(prefix + '각', true);
    await composition('compositionend', '각');
    expect(input.value).toBe(prefix + '각');
  });

  it('초과 조합을 거절한 뒤 새로운 붙여넣기와 삭제가 가능하다', async () => {
    await enter('가'.repeat(15));
    await composition('compositionstart');
    await enter('가'.repeat(16), true);
    await composition('compositionend', '가');
    await act(async () => {
      input.dispatchEvent(new Event('paste', { bubbles: true }));
    });
    await enter('가'.repeat(16));
    expect(input.value).toBe('가'.repeat(15));
    await enter('');
    expect(input.value).toBe('');
  });

  it('조합 취소 시 취소 전의 문자열로 돌아간다', async () => {
    const prefix = '가'.repeat(14);
    await enter(prefix);
    await composition('compositionstart');
    await enter(prefix + 'ㄱ', true);
    await enter(prefix, true);
    await composition('compositionend');
    expect(input.value).toBe(prefix);
  });
});
