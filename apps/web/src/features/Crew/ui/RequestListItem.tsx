import { AlertDialog } from '@azit/design-system/alert-dialog';
import { Button } from '@azit/design-system/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import { crewQueries } from '@/features/Crew/api/queries';
import * as styles from '@/features/Crew/styles/RequestListItem.css';

import { formatJoinDate } from '@/shared/lib/formatters';

interface RequestListItemProps {
  crewId: number;
  targetMemberId: number;
  nickname: string;
  profileImageUrl: string;
  requestedAt: string;
}

export function RequestListItem({
  crewId,
  targetMemberId,
  nickname,
  profileImageUrl,
  requestedAt,
}: RequestListItemProps) {
  const queryClient = useQueryClient();
  const submittingRef = useRef(false);
  const release = () => {
    submittingRef.current = false;
  };

  const approveMutation = useMutation({
    ...crewQueries.approveJoinRequest,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: crewQueries.joinRequestsKey(crewId),
        }),
        queryClient.invalidateQueries({
          queryKey: crewQueries.crewMembersKey(crewId),
          refetchType: 'all',
        }),
      ]);
    },
    onSettled: release,
  });

  const rejectMutation = useMutation({
    ...crewQueries.rejectJoinRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: crewQueries.joinRequestsKey(crewId),
      });
    },
    onSettled: release,
  });
  const isPending = approveMutation.isPending || rejectMutation.isPending;

  const handleApprove = () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    approveMutation.mutate({ crewId, targetMemberId });
  };

  const handleReject = () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    rejectMutation.mutate({ crewId, targetMemberId });
  };

  return (
    <article className={styles.card}>
      <div className={styles.contentRow}>
        {profileImageUrl ? (
          <img
            src={profileImageUrl}
            alt=""
            className={styles.avatar}
            width={56}
            height={56}
          />
        ) : (
          <div
            className={styles.avatar}
            role="img"
            aria-label="프로필 이미지"
          />
        )}
        <div className={styles.info}>
          <span className={styles.nickname}>{nickname}</span>
          <span
            className={styles.requestDate}
          >{`${formatJoinDate(requestedAt)} 요청`}</span>
        </div>
      </div>
      <div className={styles.buttonGroup}>
        <AlertDialog
          trigger={
            <Button
              type="button"
              className={styles.rejectButton}
              size="small"
              state="outline"
              style={{ width: 64, height: 36, padding: '0 6px' }}
              disabled={isPending}
              isLoading={rejectMutation.isPending}
              aria-label="요청 거절"
            >
              거절
            </Button>
          }
          title="가입 요청을 거절하시겠습니까?"
          actionText="거절"
          cancelText="취소"
          onAction={handleReject}
          actionDisabled={isPending}
        />
        <Button
          type="button"
          className={styles.approveButton}
          size="small"
          style={{ width: 64, height: 36, padding: '0 6px' }}
          onClick={handleApprove}
          disabled={isPending}
          isLoading={approveMutation.isPending}
          aria-label="요청 승인"
        >
          승인
        </Button>
      </div>
    </article>
  );
}
