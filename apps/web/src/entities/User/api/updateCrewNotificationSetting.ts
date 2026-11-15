import type {
  CrewNotificationSetting,
  UpdateCrewNotificationSettingRequest,
} from '@/entities/User/model';

import { auth } from '@/shared/api/apiClient';
import type { ApiResponse } from '@/shared/api/baseTypes';
import { END_POINT } from '@/shared/constants/endpoint';

export const updateCrewNotificationSetting = ({
  crewId,
  ...body
}: { crewId: number } & UpdateCrewNotificationSettingRequest) =>
  auth.patch<
    ApiResponse<CrewNotificationSetting>,
    UpdateCrewNotificationSettingRequest
  >(END_POINT.MEMBER.CREW_NOTIFICATION(crewId), body);
