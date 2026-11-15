import { useEffect, useRef, useState } from 'react';

import { loadKakaoPostcodeScript } from '@/shared/lib/kakaoPostcode';

import { resolvePostcodeAddress } from './postcode';

export interface KakaoPostcodeResult {
  zonecode: string;
  baseAddress: string;
  extraAddress: string;
}
export interface UseKakaoPostcodeOptions {
  onComplete: (data: KakaoPostcodeResult) => void;
}
export function useKakaoPostcode({ onComplete }: UseKakaoPostcodeOptions) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const completeRef = useRef(onComplete);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);
  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setError(false);
    loadKakaoPostcodeScript()
      .then(() => {
        if (!cancelled) setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);
  useEffect(() => {
    if (!loaded || !wrapRef.current) return;
    const element = wrapRef.current;
    const Postcode = window.kakao?.Postcode;
    if (!Postcode) {
      setError(true);
      return;
    }
    try {
      new Postcode({
        // iframe 검색 결과를 방문기록에 추가하면 Stackflow pop의 URL 동기화가 깨진다.
        // https://postcode.map.kakao.com/guide#attributes 의 submitMode 옵션.
        submitMode: false,
        oncomplete(data) {
          completeRef.current({
            zonecode: data.zonecode,
            ...resolvePostcodeAddress(data),
          });
        },
        onresize(size) {
          element.style.height = `${size.height}px`;
        },
        width: '100%',
        height: '100%',
      }).embed(element);
    } catch {
      setError(true);
    }
    return () => {
      element.replaceChildren();
    };
  }, [loaded, attempt]);
  return {
    wrapRef,
    isLoading: !loaded && !error,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
}
