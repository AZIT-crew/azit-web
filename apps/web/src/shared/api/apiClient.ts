import ky, { type NormalizedOptions } from 'ky';

import { createHttpMethods } from '@/shared/api/httpMethods';
import {
  isAuthenticationError,
  refreshSession,
  SessionChangedError,
} from '@/shared/auth/model/session';
import { BASE_API_URL } from '@/shared/constants/url';
import { networkLog } from '@/shared/lib/networkLog';
import { useAuthStore } from '@/shared/store/auth';

// Ky의 retryCount는 네트워크 재시도도 센다. 인증 재요청 여부는 요청별로 추적한다.
const authReplayedRequests = new WeakSet<object>();

export const baseApi = ky.create({
  prefixUrl: BASE_API_URL,
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  retry: 2,
  hooks: {
    // patchFetch는 body stream 소비 문제로 body를 읽을 수 없으므로
    // options.json(파싱된 객체)을 여기서 미리 저장해둔다.
    beforeRequest: [
      (request: Request, options: NormalizedOptions) => {
        networkLog.storeKyBody(request, (options as { json?: unknown }).json);
      },
    ],
  },
});

export const authApi = baseApi.extend({
  // Interceptor Hooks
  hooks: {
    beforeRequest: [
      (request) => {
        const { accessToken } = useAuthStore.getState();

        if (accessToken) {
          request.headers.set('Authorization', `Bearer ${accessToken}`);
        }
      },
    ],
    afterResponse: [
      // 401 발생 시 쿠키 기반 재발급을 공유하고 원 요청을 재시도한다.
      async (request, _options, response, state) => {
        const requestScope = _options.signal ?? _options.context;
        if (response.status === 401) {
          const current = useAuthStore.getState();
          if (
            current.status === 'ACTIVE' &&
            current.accessToken &&
            request.headers.get('Authorization') !==
              `Bearer ${current.accessToken}`
          ) {
            authReplayedRequests.add(requestScope);
            return ky.retry({
              request: new Request(request),
              code: 'TOKEN_ALREADY_REFRESHED',
            });
          }
          if (authReplayedRequests.has(requestScope)) {
            useAuthStore.getState().clearSession();
            return response;
          }
          try {
            const session = await refreshSession();
            if (session.status !== 'ACTIVE') return response;
            authReplayedRequests.add(requestScope);
            return ky.retry({
              request: new Request(request),
              code: 'TOKEN_REFRESHED',
            });
          } catch (error) {
            if (
              !isAuthenticationError(error) &&
              !(error instanceof SessionChangedError)
            )
              throw error;
            return response;
          }
        }

        if (response.status === 403 && state.retryCount === 0) {
          try {
            const body = (await response.clone().json()) as { code?: string };
            if (body.code === 'INVALID_MEMBER_STATUS') {
              // 회원 상태와 크루 방출은 별도 계약이다. 재조회한 회원 상태로 이동한다.
              await refreshSession();
            }
            // eslint-disable-next-line no-empty
          } catch (_error) {}

          return response;
        }

        return response;
      },
    ],
  },
});

export const base = createHttpMethods(baseApi);
export const auth = createHttpMethods(authApi);
