import { useStack } from '@stackflow/react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { getAuthRedirect } from '@/app/routes/authPolicy';
import { routes } from '@/app/routes/config';
import { useFlow } from '@/app/routes/stackflow';
import type { ActivityName } from '@/app/routes/types';

import {
  isAuthenticationError,
  refreshSession,
  SessionChangedError,
} from '@/shared/auth/model/session';
import { KAKAO_LINK_ACCOUNT_STATE } from '@/shared/constants/auth';
import { getQueryParam } from '@/shared/lib/url';
import { useAuthStore } from '@/shared/store/auth';
import { QueryErrorFallback } from '@/shared/ui/error';
import { PageLoader } from '@/shared/ui/loading/PageLoader';

export function AuthInitializer({ children }: { children: ReactNode }) {
  const { replace } = useFlow();
  const stack = useStack();
  const queryClient = useQueryClient();
  const { isInitialized, accessToken, status, destination } = useAuthStore();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const redirectRef = useRef<ActivityName | null>(null);
  const currentActivity = (stack.activities.find(
    (activity) => activity.isTop && !activity.exitedBy
  )?.name ??
    stack.activities.filter((activity) => !activity.exitedBy).at(-1)?.name ??
    'HomePage') as ActivityName;
  const loginCallback =
    currentActivity === 'LoginRedirectPage' &&
    Boolean(getQueryParam('code')) &&
    getQueryParam('state') !== KAKAO_LINK_ACCOUNT_STATE;
  const accountLinkCallback =
    currentActivity === 'AppleLinkRedirectPage' ||
    (currentActivity === 'LoginRedirectPage' &&
      getQueryParam('state') === KAKAO_LINK_ACCOUNT_STATE);

  useEffect(
    () =>
      useAuthStore.subscribe((state, previous) => {
        if (
          previous.accessToken &&
          (!state.accessToken ||
            (previous.status === 'ACTIVE' && state.status !== 'ACTIVE'))
        )
          queryClient.clear();
      }),
    [queryClient]
  );

  useEffect(() => {
    if (isInitialized) {
      setError(false);
      return;
    }
    if (loginCallback) {
      // 로그인 인가 코드 교환은 콜백 화면이 담당한다. refresh와 경쟁하지 않는다.
      useAuthStore.getState().setIsInitialized(true);
      return;
    }
    let cancelled = false;
    setError(false);
    refreshSession().catch((failure: unknown) => {
      if (
        !cancelled &&
        !isAuthenticationError(failure) &&
        !(failure instanceof SessionChangedError)
      )
        setError(true);
    });
    return () => {
      cancelled = true;
    };
  }, [isInitialized, loginCallback, attempt]);

  const redirect = isInitialized
    ? destination && destination !== currentActivity
      ? destination
      : getAuthRedirect({
          currentActivity,
          requiresAuth:
            accountLinkCallback ||
            (routes.find((route) => route.name === currentActivity)?.withAuth ??
              true),
          accountLinkCallback,
          accessToken,
          status,
        })
    : null;
  useEffect(() => {
    if (destination === currentActivity)
      useAuthStore.getState().acknowledgeDestination();
  }, [destination, currentActivity]);
  useEffect(() => {
    if (!redirect) {
      redirectRef.current = null;
      return;
    }
    if (redirectRef.current !== redirect) {
      redirectRef.current = redirect;
      replace(redirect, {}, { animate: false });
    }
  }, [redirect, replace]);

  // 정적 공개 문서는 인증 서버의 응답과 관계없이 읽을 수 있다.
  if (
    !isInitialized &&
    (currentActivity === 'SettingsTermDetailPage' ||
      currentActivity === 'NotFoundPage')
  )
    return <>{children}</>;
  if (!isInitialized)
    return error ? (
      <QueryErrorFallback
        message="로그인 상태를 확인하지 못했어요"
        onRetry={() => setAttempt((value) => value + 1)}
        isRetrying={false}
      />
    ) : (
      <PageLoader />
    );
  if (redirect) return <PageLoader />;
  return <>{children}</>;
}
