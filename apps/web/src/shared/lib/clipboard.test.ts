import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toastError, toastSuccess } from '@/shared/ui/toast';

import { copyToClipboard } from './clipboard';

vi.mock('@/shared/ui/toast', () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));
const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
let writeText: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.clearAllMocks();
  writeText = vi.fn();
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
});
afterEach(() => {
  if (original) Object.defineProperty(navigator, 'clipboard', original);
  else Reflect.deleteProperty(navigator, 'clipboard');
});

describe('클립보드 복사 결과 안내', () => {
  it('복사가 완료된 뒤에만 성공을 안내한다', async () => {
    let finish!: () => void;
    writeText.mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      })
    );
    const pending = copyToClipboard('HAN001', '초대 코드');
    expect(writeText).toHaveBeenCalledWith('HAN001');
    expect(toastSuccess).not.toHaveBeenCalled();
    finish();
    await pending;
    expect(toastSuccess).toHaveBeenCalledWith('초대 코드가 복사되었습니다.');
  });
  it('복사 거부 시 성공 안내 없이 재시도 메시지를 표시한다', async () => {
    writeText.mockRejectedValue(new Error('권한 없음'));
    await copyToClipboard('HAN001', '초대 코드');
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith(
      '초대 코드를 복사하지 못했어요. 다시 시도해주세요.'
    );
  });
  it('클립보드를 사용할 수 없는 브라우저에서도 오류를 안내한다', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
    await copyToClipboard('HAN001', '초대 코드');
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledTimes(1);
  });
});
