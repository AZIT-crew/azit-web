import {
  useKakaoPostcode,
  type KakaoPostcodeResult,
} from '@/features/Address/model/useKakaoPostcode';
import * as styles from '@/features/Address/styles/KakaoPostcode.css';

import { QueryErrorFallback } from '@/shared/ui/error';

export interface KakaoPostcodeProps {
  onComplete: (data: KakaoPostcodeResult) => void;
}

export function KakaoPostcode({ onComplete }: KakaoPostcodeProps) {
  const { wrapRef, isLoading, error, retry } = useKakaoPostcode({ onComplete });

  return (
    <div className={styles.container}>
      {isLoading ? <p role="status">주소 검색을 불러오는 중이에요</p> : null}
      {error ? (
        <QueryErrorFallback
          message="주소 검색을 불러오지 못했어요"
          onRetry={retry}
          isRetrying={false}
        />
      ) : null}
      <div ref={wrapRef} className={styles.wrap} />
    </div>
  );
}
