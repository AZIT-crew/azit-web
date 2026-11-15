import type { RequiredDeep } from 'type-fest';

import type { components, operations } from '@/shared/api/apiTypes';

/** API 스키마 기준 Response 타입만 정의 */

export type MyInfoResponse = components['schemas']['MyInfoResponse'];
export type MyCrewResponse = components['schemas']['MyCrewResponse'];
export type JoinedCrewResponse = components['schemas']['JoinedCrewResponse'];
export type LinkedProviderResponse =
  components['schemas']['LinkedProviderResponse'];
export type LinkedProviderItem = Required<
  components['schemas']['LinkedProviderItem']
>;
export type OptionalTermsResponse =
  components['schemas']['OptionalTermsResponse'];
export type UpdateOptionalTermsRequest =
  components['schemas']['UpdateOptionalTermsRequest'];
export type CrewNotificationSetting =
  components['schemas']['CrewNotificationSettingResponse'];
export type UpdateCrewNotificationSettingRequest =
  components['schemas']['UpdateCrewNotificationSettingRequest'];
export type CrewMemberListResponse =
  components['schemas']['CrewMemberListResponse'];
export type CrewMemberDetailResponse = RequiredDeep<
  components['schemas']['CrewMemberDetailResponse']
>;

export type MyAttendanceCalendarResponse =
  components['schemas']['MyAttendanceMonthlyListResponse'][];
export type MyAttendanceCalendarRequest = NonNullable<
  operations['getMyAttendancesForCalendar']['parameters']['query']
>;

export type MyAttendanceResponse =
  components['schemas']['MyAttendanceLogResponse'];
export type MyAttendanceRequest = NonNullable<
  operations['getMyAttendanceLogs']['parameters']['query']
>;
