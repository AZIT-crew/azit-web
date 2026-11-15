import { vars } from '@azit/design-system';
import { AlertDialog } from '@azit/design-system/alert-dialog';
import { Header } from '@azit/design-system/header';
import { AppScreen } from '@stackflow/plugin-basic-ui';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { userQueries } from '@/entities/User/api/queries';

import { BusinessError } from '@/shared/api/apiHandler';
import { useAppleLinkAccount } from '@/shared/auth/model/useAppleLinkAccount';
import { useKakaoLogin } from '@/shared/auth/model/useKakaoLogin';
import { KAKAO_LINK_ACCOUNT_STATE } from '@/shared/constants/auth';
import { maskEmail } from '@/shared/lib/formatters';
import { BackButton } from '@/shared/ui/button';
import { QueryErrorFallback } from '@/shared/ui/error';
import { AppLayout } from '@/shared/ui/layout';
import { toastError } from '@/shared/ui/toast';

import * as styles from './index.css';

const PROVIDER_ICON: Record<string, string> = {
  KAKAO: '/icons/icon-kakao-badge.svg',
  APPLE: '/icons/icon-apple-badge.svg',
};

const UNLINK_ERROR_MESSAGE: Record<string, string> = {
  CANNOT_UNLINK_LAST_PROVIDER: '마지막 로그인 수단은 해제할 수 없어요.',
  PROVIDER_NOT_LINKED: '연동되어 있지 않은 계정이에요.',
};

function SettingsLoginInfoPageContent() {
  const queryClient = useQueryClient();
  const providersQuery = useQuery({
    ...userQueries.myProvidersQuery(),
    throwOnError: false,
  });
  const providers = providersQuery.data ?? [];
  const submittingRef = useRef(false);
  const [unlinkProvider, setUnlinkProvider] = useState<string | null>(null);

  const { handleKakaoLogin } = useKakaoLogin({
    state: KAKAO_LINK_ACCOUNT_STATE,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: userQueries.myProvidersKey(),
      }),
    onError: () => toastError('카카오 연동에 실패했습니다.'),
  });

  const { linkWithApple } = useAppleLinkAccount();

  const { mutate: unlinkAccount, isPending } = useMutation({
    ...userQueries.unlinkSocialAccount,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: userQueries.myProvidersKey(),
      });
      setUnlinkProvider(null);
    },
    onError: (error) => {
      const message =
        error instanceof BusinessError
          ? (UNLINK_ERROR_MESSAGE[error.code] ?? error.message)
          : '연동 해제에 실패했습니다.';
      toastError(message);
    },
    onSettled: () => {
      submittingRef.current = false;
    },
  });

  const handleConnect = (provider: string) => {
    if (submittingRef.current) return;
    if (provider === 'KAKAO') {
      handleKakaoLogin();
    } else if (provider === 'APPLE') {
      linkWithApple();
    }
  };

  return (
    <AppScreen backgroundColor={vars.colors.background_sub}>
      <AppLayout>
        <div className={styles.headerWrapper}>
          <Header
            left={<BackButton disabled={isPending} />}
            center="로그인 정보"
          />
        </div>
        <div className={styles.mainContainer}>
          <p className={styles.guideText}>
            안전한 서비스 이용을 위해 계정을 연동해 주세요.
          </p>
          <div className={styles.accountList}>
            {providersQuery.isError ? (
              <QueryErrorFallback
                message="로그인 정보를 불러오지 못했어요"
                onRetry={() => {
                  void providersQuery.refetch();
                }}
                isRetrying={providersQuery.isFetching}
              />
            ) : providersQuery.isPending ? (
              <p role="status">로그인 정보를 불러오는 중이에요</p>
            ) : (
              providers.map((account) => (
                <div key={account.provider} className={styles.accountCard}>
                  <div className={styles.accountInfo}>
                    <img
                      src={PROVIDER_ICON[account.provider]}
                      alt={account.providerName}
                      className={styles.providerIcon}
                    />
                    <div className={styles.accountTextWrapper}>
                      <div className={styles.accountNameRow}>
                        <span className={styles.accountName}>
                          {account.providerName}
                        </span>
                        {account.isLinked && account.linkedAt && (
                          <span className={styles.accountMeta}>
                            {account.linkedAt} 연동
                          </span>
                        )}
                      </div>
                      <span className={styles.accountMeta}>
                        {account.isLinked
                          ? account.email
                            ? maskEmail(account.email)
                            : '이메일 미제공'
                          : '미연동'}
                      </span>
                    </div>
                  </div>
                  {account.isLinked ? (
                    <AlertDialog
                      open={unlinkProvider === account.provider}
                      onOpenChange={(open) => {
                        if (!submittingRef.current)
                          setUnlinkProvider(open ? account.provider : null);
                      }}
                      trigger={
                        <button
                          type="button"
                          className={styles.actionButtonConnected}
                          disabled={!account.isUnlinkable || isPending}
                        >
                          연동 해제
                        </button>
                      }
                      title={`${account.providerName} 연동을 해제하시겠어요?`}
                      description={`해제 후에는 ${account.providerName} 계정으로 로그인할 수 없어요.`}
                      cancelText="취소하기"
                      actionText="해제하기"
                      closeOnAction={false}
                      actionLoading={isPending}
                      onAction={() => {
                        if (submittingRef.current) return;
                        submittingRef.current = true;
                        unlinkAccount(account.provider);
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      className={styles.actionButtonDisconnected}
                      onClick={() => handleConnect(account.provider)}
                      disabled={isPending}
                    >
                      연동하기
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </AppLayout>
    </AppScreen>
  );
}

export function SettingsLoginInfoPage() {
  return <SettingsLoginInfoPageContent />;
}
