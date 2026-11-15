import type { AuthProvider } from '@/shared/api/models/auth';

export const END_POINT = {
  AUTH: {
    SOCIAL_LOGIN: (provider: AuthProvider) => `auth/social-login/${provider}`,
    SOCIAL_ACCOUNT: (provider: AuthProvider) =>
      `auth/social-accounts/${provider}`,
    APPLE_LINK_SESSION: 'auth/social-accounts/apple/link-session',
    REISSUE_TOKEN: 'auth/reissue',
    LOGOUT: 'auth/logout',
    WITHDRAW: 'members/me/withdraw',
  },
  MEMBER: {
    MY_INFO: 'members/me',
    MY_CREWS: 'members/me/crews',
    MY_PROFILE: 'members/me/profile',
    MY_ATTENDANCE: 'members/me/attendances',
    MY_ATTENDANCE_CALENDAR: 'members/me/attendances/calendar',
    MY_PROVIDERS: 'members/me/providers',
    OPTIONAL_TERMS: 'members/me/terms/optional',
    CREW_NOTIFICATIONS: 'members/me/crews/notifications',
    CREW_NOTIFICATION: (crewId: number) =>
      `members/me/crews/${crewId}/notifications`,
  },
  ONBOARDING: {
    CREATE_CREW: 'crews',
    CREW_INFO: (invitationCode: string) => `crews/invitation/${invitationCode}`,
    JOIN_CREW: 'crews/join',
    JOIN_STATUS: (crewId: number) => `crews/${crewId}/join-status`,
    TERM_AGREE: 'members/terms',
  },
  CREW: {
    MY_JOINED_CREWS: 'crews/me',
    MEMBERS: (crewId: number) => `crews/${crewId}/members`,
    MEMBER: (crewId: number, targetMemberId: number) =>
      `crews/${crewId}/members/${targetMemberId}`,
    JOIN_REQUESTS: (crewId: number) => `crews/${crewId}/join-requests`,
    APPROVE_JOIN_REQUEST: (crewId: number, targetMemberId: number) =>
      `crews/${crewId}/join-requests/${targetMemberId}/approve`,
    REJECT_JOIN_REQUEST: (crewId: number, targetMemberId: number) =>
      `crews/${crewId}/join-requests/${targetMemberId}/reject`,
    CANCEL_JOIN_REQUEST: (crewId: number) => `crews/${crewId}/join-request`,
    DISSOLVE: (crewId: number) => `crews/${crewId}`,
    EXIT: (crewId: number) => `crews/${crewId}/members/me`,
    REISSUE_INVITATION_CODE: (crewId: number) =>
      `crews/${crewId}/invitation-code`,
    UPDATE_INFO: (crewId: number) => `crews/${crewId}/info`,
  },
  ADDRESS: {
    LIST: 'addresses',
    DETAIL: (addressId: number) => `addresses/${addressId}`,
  },
  IMAGES: {
    PRESIGNED_URL: 'images/presigned-url',
  },
  LOCATION: {
    SEARCH: 'locations/search',
  },
  SCHEDULE: {
    LIST: (crewId: number) => `crews/${crewId}/schedules`,
    DETAIL: (crewId: number, scheduleId: number) =>
      `crews/${crewId}/schedules/${scheduleId}`,
    CALENDAR: (crewId: number) => `crews/${crewId}/schedules/calendar`,
    PARTICIPATE: (crewId: number, scheduleId: number) =>
      `crews/${crewId}/schedules/${scheduleId}/participate`,
    PARTICIPANTS: (crewId: number, scheduleId: number) =>
      `crews/${crewId}/schedules/${scheduleId}/participants`,
    JOINED_LIST: 'members/me/schedules',
    CHECK_IN: (scheduleId: number) =>
      `members/me/schedules/${scheduleId}/check-in`,
    CHECK_IN_STATUS: 'members/me/check-in-status',
  },
} as const;
