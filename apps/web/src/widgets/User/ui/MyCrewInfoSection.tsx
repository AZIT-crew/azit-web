import { AlertDialog } from '@azit/design-system/alert-dialog';
import { Chip } from '@azit/design-system/chip';
import { ChevronRightIcon, PlusIcon, XIcon } from '@azit/design-system/icon';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { crewEntityQueries } from '@/entities/Crew/api/queries';
import { userQueries } from '@/entities/User/api/queries';
import type { MyCrewResult } from '@/entities/User/model';

import { MAX_CREW_COUNT } from '@/shared/constants/crew';

import * as styles from '../styles/MyCrewInfoSection.css';

interface MyCrewInfoSectionProps {
  crews: MyCrewResult[];
  onNavigateToCrew: (crewId: number) => void;
  onCreateNewCrew: () => void;
}

export function MyCrewInfoSection({
  crews,
  onNavigateToCrew,
  onCreateNewCrew,
}: MyCrewInfoSectionProps) {
  const queryClient = useQueryClient();
  const submittingRef = useRef(false);
  const [cancelCrewId, setCancelCrewId] = useState<number | null>(null);

  const deleteMutation = useMutation({
    ...crewEntityQueries.deleteJoinRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: userQueries.myCrewsKey(),
      });
      setCancelCrewId(null);
    },
    onSettled: () => {
      submittingRef.current = false;
    },
  });

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>나의 크루</span>
        <button
          type="button"
          className={styles.newCrewButton}
          onClick={onCreateNewCrew}
          disabled={
            crews.filter((crew) =>
              ['JOINED', 'REQUESTED'].includes(crew.memberStatus)
            ).length >= MAX_CREW_COUNT
          }
        >
          <span className={styles.newCrewText}>새로운 크루</span>
          <PlusIcon size={16} className={styles.newCrewIcon} />
        </button>
      </div>

      {crews.length > 0 && (
        <div className={styles.crewList}>
          {crews.map((crew) => {
            const isJoined = crew.memberStatus === 'JOINED';
            const isRequested = crew.memberStatus === 'REQUESTED';
            const isRejected = crew.memberStatus === 'REJECTED';

            if (!isJoined && !isRequested && !isRejected) return null;

            const cardContent = (
              <>
                <div className={styles.crewCardLeft}>
                  {crew.crewImageUrl ? (
                    <img
                      src={crew.crewImageUrl}
                      alt={crew.crewName}
                      className={styles.crewAvatar}
                    />
                  ) : (
                    <div className={styles.crewAvatar} />
                  )}
                  <div className={styles.crewInfo}>
                    <span
                      className={
                        isJoined ? styles.crewName : styles.crewNamePending
                      }
                    >
                      {crew.crewName}
                    </span>
                    {isJoined && crew.memberRole ? (
                      <Chip
                        className={styles.roleChip}
                        type={
                          crew.memberRole === 'LEADER' ? 'primary' : 'skyblue'
                        }
                      >
                        {crew.memberRole === 'LEADER' ? '리더' : '멤버'}
                      </Chip>
                    ) : (
                      <Chip className={styles.roleChip} type="gray">
                        {isRejected ? '가입 거절' : '승인 대기중'}
                      </Chip>
                    )}
                  </div>
                </div>

                {isJoined || isRejected ? (
                  <ChevronRightIcon
                    size={20}
                    className={styles.chevronIcon}
                    aria-hidden="true"
                  />
                ) : (
                  <XIcon
                    size={20}
                    className={styles.closeIcon}
                    aria-hidden="true"
                  />
                )}
              </>
            );

            if (isJoined || isRejected) {
              return (
                <button
                  key={crew.crewId}
                  type="button"
                  className={styles.crewCard}
                  onClick={() =>
                    isJoined ? onNavigateToCrew(crew.crewId) : onCreateNewCrew()
                  }
                  aria-label={`${crew.crewName} ${isJoined ? '크루 페이지로 이동' : '가입 거절, 다시 신청'}`}
                >
                  {cardContent}
                </button>
              );
            }

            return (
              <AlertDialog
                key={crew.crewId}
                open={cancelCrewId === crew.crewId}
                onOpenChange={(open) => {
                  if (!submittingRef.current)
                    setCancelCrewId(open ? crew.crewId : null);
                }}
                trigger={
                  <button
                    type="button"
                    className={styles.crewCard}
                    disabled={deleteMutation.isPending}
                    aria-label={`${crew.crewName} 가입 신청 취소`}
                  >
                    {cardContent}
                  </button>
                }
                title="크루 가입 신청을 취소하시겠습니까?"
                description={`취소 시 대기 상태가 해제되며,\n가입을 원하실 경우 다시 신청해야 해요.`}
                cancelText="닫기"
                actionText="취소하기"
                closeOnAction={false}
                actionLoading={deleteMutation.isPending}
                onAction={() => {
                  if (submittingRef.current) return;
                  submittingRef.current = true;
                  deleteMutation.mutate({ crewId: crew.crewId });
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
