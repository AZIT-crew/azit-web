import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import type { CrewNotificationSettingsResponse } from '@/entities/User/api/getCrewNotificationSettings';
import { userQueries } from '@/entities/User/api/queries';

import type { UpdateCrewNotificationSettingRequest } from './user.model';

export function useCrewNotificationSetting(crewId: number) {
  const queryClient = useQueryClient();
  const submittingRef = useRef(false);
  const mutation = useMutation({
    ...userQueries.updateCrewNotificationSetting,
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: userQueries.crewNotificationsKey(),
      });
    },
    onSuccess: ({ result }) => {
      queryClient.setQueryData<CrewNotificationSettingsResponse>(
        userQueries.crewNotificationsKey(),
        (previous) =>
          previous
            ? {
                ...previous,
                result: previous.result.map((crew) =>
                  crew.crewId === result.crewId ? result : crew
                ),
              }
            : previous
      );
    },
    onSettled: () => {
      submittingRef.current = false;
    },
  });
  const update = (patch: UpdateCrewNotificationSettingRequest) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    mutation.mutate({ crewId, ...patch });
  };
  return {
    update,
    isPending: mutation.isPending,
    variables: mutation.variables,
  };
}
