import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import { scheduleQueries } from '@/features/Schedule/api/queries';

import { userQueries } from '@/entities/User/api/queries';

import { toastSuccess } from '@/shared/ui/toast';

interface UseScheduleActionsProps {
  crewId: number;
  scheduleId: number;
}

export function useScheduleParticipateActions({
  crewId,
  scheduleId,
}: UseScheduleActionsProps) {
  const queryClient = useQueryClient();
  const isSubmittingRef = useRef(false);

  const refreshScheduleState = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: scheduleQueries.all }),
      queryClient.invalidateQueries({ queryKey: userQueries.myInfoKey() }),
    ]);

  const releaseSubmission = () => {
    isSubmittingRef.current = false;
  };

  const participateMutation = useMutation({
    ...scheduleQueries.participateSchedule,
    meta: {
      errorMessages: {
        SCHEDULE_INTERVAL_TOO_CLOSE: '이전 일정과 시작 시간이 너무 가깝습니다',
      },
    },
    onSuccess: async () => {
      await refreshScheduleState();
      toastSuccess('신청이 완료되었습니다');
    },
    onSettled: releaseSubmission,
  });

  const cancelMutation = useMutation({
    ...scheduleQueries.cancelParticipation,
    onSuccess: async () => {
      await refreshScheduleState();
      toastSuccess('신청이 취소되었습니다');
    },
    onSettled: releaseSubmission,
  });

  const participate = () => {
    if (isSubmittingRef.current || crewId <= 0 || scheduleId <= 0) return;
    isSubmittingRef.current = true;
    participateMutation.mutate({ crewId, scheduleId });
  };

  const cancelParticipation = () => {
    if (isSubmittingRef.current || crewId <= 0 || scheduleId <= 0) return;
    isSubmittingRef.current = true;
    cancelMutation.mutate({ crewId, scheduleId });
  };

  return {
    participate,
    cancelParticipation,
    isPending: participateMutation.isPending || cancelMutation.isPending,
  };
}
