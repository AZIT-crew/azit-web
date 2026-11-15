import { vars } from '@azit/design-system';
import { AlertDialog } from '@azit/design-system/alert-dialog';
import { Header } from '@azit/design-system/header';
import { AppScreen } from '@stackflow/plugin-basic-ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Fragment, useEffect, useRef, useState } from 'react';

import { useFlow } from '@/app/routes/stackflow';

import { userQueries } from '@/entities/User/api/queries';
import type { UpdateOptionalTermsRequest } from '@/entities/User/model';

import { BusinessError } from '@/shared/api/apiHandler';
import { useWithdraw } from '@/shared/auth/model';
import { bridge } from '@/shared/lib/bridge';
import { useAuthStore } from '@/shared/store/auth';
import { BackButton } from '@/shared/ui/button';
import { QueryErrorFallback } from '@/shared/ui/error';
import { AppLayout } from '@/shared/ui/layout';
import { MenuItem, MenuSection, menuSectionStyles } from '@/shared/ui/menu';
import { toastError } from '@/shared/ui/toast';

import * as styles from './index.css';
import { getSettingsMenu } from './menu';

export function SettingsPage() {
  const { push } = useFlow();
  const { logout } = useAuthStore();
  const { handleWithdraw } = useWithdraw();
  const queryClient = useQueryClient();
  const termsQuery = useQuery({
    ...userQueries.optionalTermsQuery(),
    throwOnError: false,
  });
  const optionalTerms = termsQuery.data;
  const [appVersion, setAppVersion] = useState<string>('');
  const [showLeaderError, setShowLeaderError] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const termsSubmittingRef = useRef(false);
  const accountSubmittingRef = useRef(false);

  const termsMutation = useMutation({
    ...userQueries.updateOptionalTerms,
    onSuccess: async (data, variables) => {
      queryClient.setQueryData(userQueries.optionalTermsKey(), data);
      if (variables.notificationAgreed === true) {
        await queryClient.invalidateQueries({
          queryKey: userQueries.crewNotificationsKey(),
        });
      }
    },
    onError: () => {
      toastError('알림 설정 변경에 실패했습니다.');
    },
    onSettled: () => {
      termsSubmittingRef.current = false;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      accountSubmittingRef.current = false;
    },
  });
  const withdrawMutation = useMutation({
    mutationFn: handleWithdraw,
    onSuccess: () => setWithdrawOpen(false),
    onError: (error) => {
      if (
        error instanceof BusinessError &&
        error.code === 'CANNOT_SERVICE_WITHDRAW_AS_LEADER'
      ) {
        setShowLeaderError(true);
        setWithdrawOpen(false);
      } else {
        toastError(
          error instanceof BusinessError
            ? error.message
            : '탈퇴 요청에 실패했습니다. 다시 시도해주세요.'
        );
      }
    },
    onSettled: () => {
      accountSubmittingRef.current = false;
    },
  });
  const updateOptionalTerms = (body: UpdateOptionalTermsRequest) => {
    if (termsSubmittingRef.current || termsQuery.isError || !optionalTerms)
      return;
    termsSubmittingRef.current = true;
    termsMutation.mutate(body);
  };
  const accountBusy = logoutMutation.isPending || withdrawMutation.isPending;

  useEffect(() => {
    bridge
      .getAppVersion()
      .then(setAppVersion)
      .catch(() => {});
  }, []);

  const marketingConsentDescription = optionalTerms?.marketing.changedAt
    ? `[AZIT] 마케팅 정보 수신 ${optionalTerms.marketing.agreed ? '동의' : '거부'} ${optionalTerms.marketing.changedAt.slice(0, 10)}`
    : undefined;

  const menu = getSettingsMenu({
    appVersion: appVersion ? `최신 버전(${appVersion})` : '',
    onLogout: () => {
      if (accountSubmittingRef.current) return;
      accountSubmittingRef.current = true;
      logoutMutation.mutate();
    },
    onNavigateLoginInfo: () =>
      push('SettingsLoginInfoPage', {}, { animate: true }),
    onNavigateCrewNotification: () =>
      push('SettingsCrewNotificationPage', {}, { animate: true }),
    // TODO: OS 알림 권한이 꺼진 경우 이 토글을 강제 비활성화해야 함 (Native 브릿지에 권한 조회 메서드 추가 후 반영)
    allNotificationEnabled: optionalTerms?.notification.agreed ?? false,
    onToggleAllNotification: (checked) =>
      updateOptionalTerms({ notificationAgreed: checked }),
    marketingConsentEnabled: optionalTerms?.marketing.agreed ?? false,
    marketingConsentDescription,
    consentDisabled:
      termsMutation.isPending || termsQuery.isError || !optionalTerms,
    pendingConsent: termsMutation.isPending
      ? termsMutation.variables?.marketingAgreed != null
        ? 'marketing'
        : 'notification'
      : undefined,
    accountBusy,
    isLoggingOut: logoutMutation.isPending,
    onToggleMarketingConsent: (checked) =>
      updateOptionalTerms({ marketingAgreed: checked }),
  });

  return (
    <AppScreen backgroundColor={vars.colors.background_sub}>
      <AppLayout>
        <div className={styles.headerWrapper}>
          <Header
            left={
              <BackButton disabled={accountBusy || termsMutation.isPending} />
            }
            center="설정"
          />
        </div>
        <div className={styles.mainContainer}>
          <div className={styles.menuSectionWrapper}>
            {menu.map((section) => {
              if (section.id === 'notification')
                return (
                  <Fragment key={section.id}>
                    <MenuSection
                      section={{
                        ...section,
                        items: optionalTerms
                          ? section.items
                          : section.items.filter(
                              (item) => item.type !== 'toggle'
                            ),
                      }}
                    />
                    {termsQuery.isError ? (
                      <QueryErrorFallback
                        message="알림 설정을 불러오지 못했어요"
                        onRetry={() => {
                          void termsQuery.refetch();
                        }}
                        isRetrying={termsQuery.isFetching}
                      />
                    ) : !optionalTerms ? (
                      <p role="status">알림 설정을 불러오는 중이에요</p>
                    ) : null}
                  </Fragment>
                );
              if (section.id !== 'etc') {
                return <MenuSection key={section.id} section={section} />;
              }

              return (
                <section
                  key={section.id}
                  className={menuSectionStyles.container}
                >
                  <h2 className={menuSectionStyles.title}>{section.title}</h2>
                  <div className={menuSectionStyles.list}>
                    {section.items.map((item) => (
                      <Fragment key={item.id}>
                        <MenuItem
                          item={item}
                          onClick={() => {
                            if (item.type === 'action') item.onAction();
                          }}
                        />
                        <div
                          className={menuSectionStyles.listItemDivider}
                          aria-hidden
                        />
                      </Fragment>
                    ))}
                    <AlertDialog
                      open={withdrawOpen}
                      onOpenChange={(open) => {
                        if (!accountSubmittingRef.current)
                          setWithdrawOpen(open);
                      }}
                      trigger={
                        <MenuItem
                          item={{
                            id: 'withdraw',
                            label: '탈퇴하기',
                            type: 'action',
                            onAction: () => {},
                            disabled: accountBusy,
                          }}
                        />
                      }
                      title="정말로 탈퇴하시겠습니까?"
                      description="탈퇴 후 30일이 지나면 계정 복구가 불가능해요."
                      actionText="탈퇴하기"
                      cancelText="취소하기"
                      closeOnAction={false}
                      actionLoading={withdrawMutation.isPending}
                      onAction={() => {
                        if (accountSubmittingRef.current) return;
                        accountSubmittingRef.current = true;
                        withdrawMutation.mutate();
                      }}
                    />
                    <AlertDialog
                      open={showLeaderError}
                      onOpenChange={setShowLeaderError}
                      title="탈퇴를 할 수 없습니다"
                      description="리더로 소속된 크루가 있어요. 리더 권한을 위임하거나 크루를 해산한 뒤 다시 시도해주세요."
                      actionText="확인"
                      singleButton
                    />
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </AppLayout>
    </AppScreen>
  );
}
