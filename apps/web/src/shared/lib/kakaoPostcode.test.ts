import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
let original: Window['kakao'];
beforeEach(() => {
  original = window.kakao;
  window.kakao = undefined;
  vi.resetModules();
  document.getElementById('kakao-postcode-script')?.remove();
});
afterEach(() => {
  window.kakao = original;
  document.getElementById('kakao-postcode-script')?.remove();
});
describe('주소 검색 SDK 로드', () => {
  it('동시 로드는 스크립트를 공유하고 실패 후 다시 시도할 수 있다', async () => {
    const { loadKakaoPostcodeScript } = await import('./kakaoPostcode');
    const first = loadKakaoPostcodeScript();
    const second = loadKakaoPostcodeScript();
    expect(first).toBe(second);
    expect(document.querySelectorAll('#kakao-postcode-script')).toHaveLength(1);
    const failed =
      expect(first).rejects.toThrow('주소 검색을 불러오지 못했어요');
    document
      .getElementById('kakao-postcode-script')!
      .dispatchEvent(new Event('error'));
    await failed;
    expect(document.getElementById('kakao-postcode-script')).toBeNull();
    const retry = loadKakaoPostcodeScript();
    window.kakao = {
      Postcode: vi.fn().mockImplementation(() => ({ embed: vi.fn() })),
    };
    document
      .getElementById('kakao-postcode-script')!
      .dispatchEvent(new Event('load'));
    await expect(retry).resolves.toBeUndefined();
  });
  it('이미 로드된 SDK는 재삽입하지 않는다', async () => {
    window.kakao = {
      Postcode: vi.fn().mockImplementation(() => ({ embed: vi.fn() })),
    };
    const { loadKakaoPostcodeScript } = await import('./kakaoPostcode');
    await loadKakaoPostcodeScript();
    expect(document.getElementById('kakao-postcode-script')).toBeNull();
  });
});
