import { useEffect, useRef, useState } from 'react';

import { useFlow } from '@/app/routes/stackflow';

import { BusinessError } from '@/shared/api/apiHandler';
import { postLinkSocialAccount } from '@/shared/auth/api/postLinkSocialAccount';
import { postSocialLogin } from '@/shared/auth/api/postSocialLogin';
import { getAuthDestination } from '@/shared/auth/lib/navigateByAuthStatus';
import { KAKAO_LINK_ACCOUNT_STATE } from '@/shared/constants/auth';
import { getQueryParam } from '@/shared/lib/url';
import { useAuthStore } from '@/shared/store/auth';

const LINK_ERROR_MESSAGE: Record<string, string> = {
  ALREADY_LINKED_PROVIDER: '이미 카카오 계정이 연동되어 있어요.',
  SOCIAL_ACCOUNT_ALREADY_LINKED: '이미 다른 계정에 연동된 정보입니다.',
  MISSING_SOCIAL_CREDENTIAL:
    '카카오 인증 정보를 확인할 수 없어요. 다시 시도해 주세요.',
  INVALID_SOCIAL_CODE: '인증이 만료되었어요. 다시 시도해 주세요.',
};

interface UseKakaoCodeOptions {
  onLinkSuccess?: () => void;
  onLinkError?: (message: string) => void;
}

export const useKakaoCode = ({
  onLinkSuccess,
  onLinkError,
}: UseKakaoCodeOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [invalidAccess, setInvalidAccess] = useState(false);

  const { setSession } = useAuthStore();
  const startedRef = useRef(false);
  const { replace } = useFlow();

  useEffect(() => {
    const code = getQueryParam('code');
    const state = getQueryParam('state');

    if (!code) {
      setInvalidAccess(true);
      return;
    }

    if (startedRef.current) return;
    startedRef.current = true;

    if (state === KAKAO_LINK_ACCOUNT_STATE) {
      linkAccount(code);
    } else {
      login(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (code: string) => {
    setIsLoading(true);

    try {
      const response = await postSocialLogin('KAKAO', {
        authorizationCode: code,
      });

      setSession(response.result, getAuthDestination(response.result.status));
    } catch (err) {
      setError(true);
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const linkAccount = async (code: string) => {
    setIsLoading(true);

    try {
      await postLinkSocialAccount('KAKAO', { authorizationCode: code });
      onLinkSuccess?.();
    } catch (err) {
      const message =
        err instanceof BusinessError
          ? (LINK_ERROR_MESSAGE[err.code] ?? err.message)
          : '연동에 실패했습니다.';
      onLinkError?.(message);
      console.error('Link social account failed:', err);
    } finally {
      setIsLoading(false);
      replace('SettingsLoginInfoPage', {}, { animate: false });
    }
  };

  return { isLoading, error, invalidAccess };
};
