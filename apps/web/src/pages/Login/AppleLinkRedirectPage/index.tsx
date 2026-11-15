import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useFlow } from '@/app/routes/stackflow';

import { userQueries } from '@/entities/User/api/queries';

import { getQueryParam } from '@/shared/lib/url';
import { PageLoader } from '@/shared/ui/loading/PageLoader';
import { toastError } from '@/shared/ui/toast';

const LINK_ERROR_MESSAGE: Record<string, string> = {
  SOCIAL_ACCOUNT_ALREADY_LINKED: '이미 다른 계정에 연동된 정보입니다.',
  ALREADY_LINKED_PROVIDER: '이미 애플 계정이 연동되어 있어요.',
  INVALID_APPLE_ID_TOKEN: '애플 인증에 실패했어요. 다시 시도해 주세요.',
  INVALID_SOCIAL_CODE: '인증이 만료되었어요. 다시 시도해 주세요.',
};

export function AppleLinkRedirectPage() {
  const { replace } = useFlow();
  const queryClient = useQueryClient();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;
    const result = getQueryParam('result');

    if (result === 'success') {
      queryClient.invalidateQueries({
        queryKey: userQueries.myProvidersKey(),
      });
    } else {
      const errorCode = getQueryParam('error');
      toastError(
        (errorCode && LINK_ERROR_MESSAGE[errorCode]) ??
          '애플 연동에 실패했습니다.'
      );
    }

    replace('SettingsLoginInfoPage', {}, { animate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <PageLoader />;
}
