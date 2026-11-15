import { vars } from '@azit/design-system';
import { AlertDialog } from '@azit/design-system/alert-dialog';
import { Chip } from '@azit/design-system/chip';
import { Header } from '@azit/design-system/header';
import { CopyIcon, UploadIcon } from '@azit/design-system/icon';
import { Input } from '@azit/design-system/input';
import { AppScreen } from '@stackflow/plugin-basic-ui';
import {
  useMutation,
  useSuspenseQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { josa } from 'es-hangul';
import { useRef, useState } from 'react';

import { useFlow } from '@/app/routes/stackflow';

import { crewQueries } from '@/features/Crew/api/queries';

import { scheduleKeys } from '@/entities/Schedule/api/keys';
import { userQueries } from '@/entities/User/api/queries';

import {
  MEMBER_ROLE,
  MEMBER_ROLE_LABEL,
  ROLE_CHIP_TYPE_MAP,
} from '@/shared/constants/member-role';
import { bridge } from '@/shared/lib/bridge';
import { copyToClipboard } from '@/shared/lib/clipboard';
import { AsyncBoundary } from '@/shared/ui/async-boundary';
import { BackButton } from '@/shared/ui/button';
import { PageErrorFallback, QueryErrorFallback } from '@/shared/ui/error';
import { AppLayout } from '@/shared/ui/layout';
import { PageLoader } from '@/shared/ui/loading/PageLoader';
import { MenuSection } from '@/shared/ui/menu';

import * as styles from './index.css';
import { useCrewMenu } from './useCrewMenu';

function CrewPageContent({ params }: { params?: { id?: string } }) {
  const [dissolveInput, setDissolveInput] = useState('');
  const [isReissueOpen, setIsReissueOpen] = useState(false);
  const [isDissolveOpen, setIsDissolveOpen] = useState(false);
  const [isExitOpen, setIsExitOpen] = useState(false);
  const submittingRef = useRef(false);

  const crewId = Number(params?.id) || 0;
  const { pop } = useFlow();
  const queryClient = useQueryClient();

  const crewsQuery = useSuspenseQuery(userQueries.myCrewsQuery());
  const myCrewsData = crewsQuery.data;
  const crew = myCrewsData?.find((c) => c.crewId === crewId) ?? null;

  const isLeader = crew?.memberRole === MEMBER_ROLE.LEADER;

  const menuSections = useCrewMenu(crew?.memberRole ?? 'MEMBER', crewId, () =>
    setIsReissueOpen(true)
  );
  const refreshCrews = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: userQueries.myCrewsKey() }),
      queryClient.invalidateQueries({ queryKey: userQueries.joinedCrewsKey() }),
      queryClient.invalidateQueries({ queryKey: scheduleKeys.memberListKey() }),
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.checkInStatusKey(),
      }),
      queryClient.invalidateQueries({ queryKey: crewQueries.crewInfoKey() }),
    ]);
  const release = () => {
    submittingRef.current = false;
  };
  const submit = (action: () => void) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    action();
  };

  const dissolveMutation = useMutation({
    ...crewQueries.dissolveCrew,
    onSuccess: async () => {
      setIsDissolveOpen(false);
      pop();
      await refreshCrews();
    },
    onSettled: release,
  });

  const exitMutation = useMutation({
    ...crewQueries.exitCrew,
    onSuccess: async () => {
      setIsExitOpen(false);
      pop();
      await refreshCrews();
    },
    onSettled: release,
  });

  const reissueMutation = useMutation({
    ...crewQueries.reissueInvitationCode,
    onSuccess: async () => {
      await refreshCrews();
      setIsReissueOpen(false);
    },
    onSettled: release,
  });
  const isBusy =
    dissolveMutation.isPending ||
    exitMutation.isPending ||
    reissueMutation.isPending;

  if (!crew || crewsQuery.isError)
    return (
      <AppScreen>
        <AppLayout>
          <Header left={<BackButton />} center="나의 크루" />
          <QueryErrorFallback
            message="크루 정보를 확인할 수 없어요"
            onRetry={() => {
              void crewsQuery.refetch();
            }}
            isRetrying={crewsQuery.isFetching}
          />
        </AppLayout>
      </AppScreen>
    );

  const onCopyCode = () => {
    if (crew.invitationCode) {
      copyToClipboard(crew.invitationCode, '초대 코드');
    }
  };

  const onShare = async () => {
    if (crew.invitationCode) {
      await bridge.shareInviteCode(crew.invitationCode, crew.crewName);
    }
  };

  return (
    <AppScreen backgroundColor={vars.colors.background_sub}>
      <AppLayout>
        <div className={styles.headerWrapper}>
          <Header left={<BackButton />} center="나의 크루" />
        </div>
        <div className={styles.mainContainer}>
          <div className={styles.contentWrapper}>
            <div className={styles.profileSection}>
              <div className={styles.profileTop}>
                <div className={styles.avatarWrapper}>
                  <img
                    src={crew.crewImageUrl}
                    alt="크루 이미지"
                    className={styles.avatar}
                  />
                  <div className={styles.profileInfo}>
                    <span className={styles.crewName}>{crew.crewName}</span>
                    {crew.memberRole && (
                      <Chip type={ROLE_CHIP_TYPE_MAP[crew.memberRole]}>
                        {MEMBER_ROLE_LABEL[crew.memberRole]}
                      </Chip>
                    )}
                  </div>
                </div>
                <div className={styles.inviteCard}>
                  <button
                    type="button"
                    className={styles.inviteCardLeft}
                    onClick={onCopyCode}
                  >
                    <span className={styles.inviteCode}>
                      {crew.invitationCode}
                    </span>
                    <CopyIcon size={16} />
                  </button>
                  <div className={styles.divider} />
                  <button
                    type="button"
                    className={styles.inviteCardRight}
                    onClick={onShare}
                  >
                    <span className={styles.shareText}>공유하기</span>
                    <UploadIcon size={16} />
                  </button>
                </div>
              </div>
              <div className={styles.menuSectionWrapper} inert={isBusy}>
                {menuSections.map((section) => (
                  <MenuSection key={section.id} section={section} />
                ))}
              </div>
            </div>
            {isLeader && (
              <AlertDialog
                title="초대코드 재발급"
                description={`새로운 초대코드가 생성되며\n기존 초대코드는 더 이상 사용할 수 없어요.`}
                cancelText="취소하기"
                actionText="재발급하기"
                onAction={() =>
                  submit(() => reissueMutation.mutate({ crewId }))
                }
                actionLoading={reissueMutation.isPending}
                closeOnAction={false}
                open={isReissueOpen}
                onOpenChange={(open) => {
                  if (!isBusy) setIsReissueOpen(open);
                }}
              >
                <div className={styles.dissolveInputContainer}>
                  <p className={styles.reissueCodeGuide}>
                    현재의 초대 코드는 다음과 같아요
                  </p>
                  <div className={styles.reissueCodeBox}>
                    <span className={styles.reissueCodeText}>
                      {crew.invitationCode}
                    </span>
                  </div>
                </div>
              </AlertDialog>
            )}
            {isLeader ? (
              <AlertDialog
                trigger={
                  <button
                    type="button"
                    className={styles.dissolveButton}
                    disabled={isBusy}
                  >
                    크루 해산하기
                  </button>
                }
                title="정말 크루를 해산하시겠어요?"
                description={`크루 정보 및 일정 데이터가 삭제되며\n절대 복구할 수 없어요.`}
                cancelText="취소하기"
                actionText="해산하기"
                actionVariant="danger"
                actionDisabled={dissolveInput !== crew.crewName}
                onAction={() =>
                  submit(() => dissolveMutation.mutate({ crewId }))
                }
                actionLoading={dissolveMutation.isPending}
                closeOnAction={false}
                open={isDissolveOpen}
                onOpenChange={(open) => {
                  if (!isBusy) {
                    setIsDissolveOpen(open);
                    if (!open) setDissolveInput('');
                  }
                }}
              >
                <div className={styles.dissolveInputContainer}>
                  <p className={styles.dissolveInputGuide}>
                    해산하려면 &apos;{crew.crewName}&apos;
                    {josa(crew.crewName, '을/를').slice(-1)} 입력해 주세요.
                  </p>
                  <Input
                    placeholder="크루 이름을 정확히 입력해 주세요."
                    value={dissolveInput}
                    readOnly={isBusy}
                    onChange={(e) => setDissolveInput(e.target.value)}
                  />
                </div>
              </AlertDialog>
            ) : (
              <AlertDialog
                trigger={
                  <button
                    type="button"
                    className={styles.dissolveButton}
                    disabled={isBusy}
                  >
                    이 크루에서 나가기
                  </button>
                }
                title="정말 크루를 나가시겠어요?"
                description={`크루 탈퇴 시 24시간 동안은\n동일한 크루에 다시 가입할 수 없어요.`}
                cancelText="취소하기"
                actionText="나가기"
                onAction={() => submit(() => exitMutation.mutate({ crewId }))}
                actionLoading={exitMutation.isPending}
                closeOnAction={false}
                open={isExitOpen}
                onOpenChange={(open) => {
                  if (!isBusy) setIsExitOpen(open);
                }}
              />
            )}
          </div>
        </div>
      </AppLayout>
    </AppScreen>
  );
}

export function CrewPage({ params }: { params?: { id?: string } }) {
  return (
    <AsyncBoundary
      suspenseFallback={<PageLoader />}
      errorFallback={
        <PageErrorFallback message="크루 정보를 불러오지 못했어요" />
      }
    >
      <CrewPageContent params={params} />
    </AsyncBoundary>
  );
}
