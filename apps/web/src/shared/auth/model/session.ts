import { BusinessError, ServerError } from '@/shared/api/apiHandler';
import { postReissueToken } from '@/shared/api/handlers/postReissueToken';
import type { ReissueTokenResult } from '@/shared/api/models/auth';
import { useAuthStore } from '@/shared/store/auth';

export class SessionChangedError extends Error {}
export function isAuthenticationError(error: unknown) {
  return (
    error instanceof BusinessError &&
    (error.status === 401 || error.status === 403)
  );
}
let refreshPromise: Promise<ReissueTokenResult> | null = null;
// 초기화(StrictMode 포함)와 동시 401이 RTR 쿠키를 중복 교환하지 않게 공유한다.
export function refreshSession(): Promise<ReissueTokenResult> {
  if (refreshPromise) return refreshPromise;
  const generation = useAuthStore.getState().generation;
  refreshPromise = postReissueToken()
    .then(({ result }) => {
      if (useAuthStore.getState().generation !== generation)
        throw new SessionChangedError('인증 상태가 변경되었어요');
      if (
        !result?.accessToken ||
        !['ACTIVE', 'PENDING_TERMS', 'WITHDRAWN', 'DELETED'].includes(
          result.status
        )
      )
        throw new ServerError('인증 응답을 확인할 수 없어요', 500);
      useAuthStore.getState().setSession(result);
      return result;
    })
    .catch((error: unknown) => {
      if (
        isAuthenticationError(error) &&
        useAuthStore.getState().generation === generation
      )
        useAuthStore.getState().clearSession();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}
