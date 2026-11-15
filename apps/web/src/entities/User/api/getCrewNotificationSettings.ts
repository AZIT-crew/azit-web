import type { CrewNotificationSetting } from '@/entities/User/model';

import { auth } from '@/shared/api/apiClient';
import type { ApiResponse } from '@/shared/api/baseTypes';
import { END_POINT } from '@/shared/constants/endpoint';

export type CrewNotificationSettingsResponse = ApiResponse<
  CrewNotificationSetting[]
>;

export const getCrewNotificationSettings = () =>
  auth.get<CrewNotificationSettingsResponse>(
    END_POINT.MEMBER.CREW_NOTIFICATIONS
  );
