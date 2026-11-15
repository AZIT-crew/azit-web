import { useCallback } from 'react';

import { postLinkSocialAccount } from '@/shared/auth/api/postLinkSocialAccount';
import { postSocialLogin } from '@/shared/auth/api/postSocialLogin';
import { getAuthDestination } from '@/shared/auth/lib/navigateByAuthStatus';
import { KAKAO_LINK_ACCOUNT_STATE } from '@/shared/constants/auth';
import { KAKAO_AUTHORIZE_URL } from '@/shared/constants/url';
import { bridge } from '@/shared/lib/bridge';
import { useAuthStore } from '@/shared/store/auth';

interface KakaoLoginOptions {
  redirectUri?: string;
  state?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface KakaoLoginReturn {
  handleKakaoLogin: () => void;
}

export const useKakaoLogin = (
  options: KakaoLoginOptions = {}
): KakaoLoginReturn => {
  const {
    redirectUri = KAKAO_AUTHORIZE_URL,
    state,
    onSuccess,
    onError,
  } = options;

  const { setSession } = useAuthStore();

  const handleKakaoLogin = useCallback(() => {
    if (bridge.isNativeMethodAvailable('socialLogin')) {
      void (async () => {
        try {
          const result = await bridge.socialLogin('kakao');

          if (!result.success) {
            onError?.(new Error(result.message));
            return;
          }

          if (state === KAKAO_LINK_ACCOUNT_STATE) {
            await postLinkSocialAccount('KAKAO', {
              accessToken: result.accessToken,
            });
            onSuccess?.();
            return;
          }

          const response = await postSocialLogin('KAKAO', {
            accessToken: result.accessToken,
          });
          setSession(
            response.result,
            getAuthDestination(response.result.status)
          );

          onSuccess?.();
        } catch (error) {
          const errorMessage = '카카오 로그인 중 에러가 발생했습니다.';
          console.error(errorMessage, error);
          onError?.(error instanceof Error ? error : new Error(errorMessage));
        }
      })();
      return;
    }

    try {
      if (!window.Kakao || !window.Kakao.isInitialized()) {
        const error = new Error('Kakao SDK가 초기화되지 않았습니다.');
        console.error(error.message);
        onError?.(error);
        return;
      }

      if (!redirectUri) {
        const error = new Error('Redirect URI가 설정되지 않았습니다.');
        console.error(error.message);
        onError?.(error);
        return;
      }

      window.Kakao.Auth.authorize({
        redirectUri: redirectUri as string,
        ...(state ? { state } : {}),
      });

      onSuccess?.();
    } catch (error) {
      const errorMessage = '카카오 로그인 중 에러가 발생했습니다.';
      console.error(errorMessage, error);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [redirectUri, state, onSuccess, onError, setSession]);

  return { handleKakaoLogin };
};
