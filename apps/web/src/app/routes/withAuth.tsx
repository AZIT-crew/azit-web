import type { ComponentType } from 'react';

import { useAuthStore } from '@/shared/store/auth';
import { PageLoader } from '@/shared/ui/loading/PageLoader';

// 이동은 최상위 AuthInitializer가 한 번 처리한다. 배경 화면은 요청·내용을 숨긴다.
export function withAuth<T extends object>(
  Component: ComponentType<T>,
  allowPendingTerms = false
) {
  return function AuthenticatedComponent(props: T) {
    const { accessToken, status, isInitialized } = useAuthStore();
    if (!isInitialized) return <PageLoader />;
    if (
      !accessToken ||
      (status !== 'ACTIVE' &&
        !(allowPendingTerms && status === 'PENDING_TERMS'))
    )
      return null;
    return <Component {...props} />;
  };
}
