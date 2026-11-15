const KAKAO_POSTCODE_SRC =
  'https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
const SCRIPT_ID = 'kakao-postcode-script';
let loadPromise: Promise<void> | null = null;

export function loadKakaoPostcodeScript(): Promise<void> {
  if (typeof window === 'undefined')
    return Promise.reject(new Error('window is not defined'));
  if (window.kakao?.Postcode) return Promise.resolve();
  if (loadPromise) return loadPromise;
  document.getElementById(SCRIPT_ID)?.remove();
  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = KAKAO_POSTCODE_SRC;
    script.async = true;
    script.onload = () =>
      window.kakao?.Postcode
        ? resolve()
        : reject(new Error('주소 검색을 시작할 수 없어요'));
    script.onerror = () => reject(new Error('주소 검색을 불러오지 못했어요'));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    loadPromise = null;
    document.getElementById(SCRIPT_ID)?.remove();
    throw error;
  });
  return loadPromise;
}
