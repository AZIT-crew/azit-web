import type { MockResponse } from '../api';

export const mockMyInfo = {
  code: 'SUCCESS',
  message: '요청에 성공했습니다.',
  result: {
    id: 1,
    nickname: '테스터',
    profileImageUrl: '/icons/icon-crew-default.svg',
    totalPoints: 0,
  },
} satisfies MockResponse<'get', '/api/v1/members/me'>;

export const mockMyCrews = {
  code: 'SUCCESS',
  message: '요청에 성공했습니다.',
  result: [
    {
      crewId: 1,
      crewName: '한강 러너스',
      crewImageUrl: '/icons/icon-crew-default.svg',
      memberRole: 'LEADER',
      memberStatus: 'JOINED',
      invitationCode: 'HAN001',
    },
    {
      crewId: 2,
      crewName: '새벽 달리기 모임',
      crewImageUrl: '/icons/icon-crew-default.svg',
      memberRole: 'MEMBER',
      memberStatus: 'JOINED',
      invitationCode: 'DAWN02',
    },
  ],
} satisfies MockResponse<'get', '/api/v1/members/me/crews'>;

export const mockAttendances = {
  code: 'SUCCESS',
  message: '요청에 성공했습니다.',
  result: {
    totalAttendanceCount: 2,
    totalPoints: 200,
    attendanceLogs: [
      {
        scheduleId: 10,
        crewName: '한강 러너스',
        title: '정기 러닝',
        runType: 'REGULAR',
        meetingAt: '2026-11-01T09:00:00',
        placeName: '반포 한강 공원',
        status: 'ATTENDED',
        maxParticipants: 20,
        currentParticipants: 2,
      },
      {
        scheduleId: 11,
        crewName: '한강 러너스',
        title: '번개 러닝',
        runType: 'LIGHTNING',
        meetingAt: '2026-11-05T09:00:00',
        placeName: '반포 한강 공원',
        status: 'ATTENDED',
        maxParticipants: 20,
        currentParticipants: 2,
      },
      {
        scheduleId: 12,
        crewName: '한강 러너스',
        title: '정기 러닝',
        runType: 'REGULAR',
        meetingAt: '2026-11-10T09:00:00',
        placeName: '반포 한강 공원',
        status: 'ABSENT',
        maxParticipants: 20,
        currentParticipants: 2,
      },
    ],
  },
} satisfies MockResponse<'get', '/api/v1/members/me/attendances'>;

export const mockAttendanceCalendar = {
  code: 'SUCCESS',
  message: '요청에 성공했습니다.',
  result: mockAttendances.result.attendanceLogs.map((log) => ({
    date: log.meetingAt.slice(0, 10),
    hasRegular: log.runType === 'REGULAR',
    hasLightning: log.runType === 'LIGHTNING',
  })),
} satisfies MockResponse<'get', '/api/v1/members/me/attendances/calendar'>;

export const mockProviders = {
  code: 'SUCCESS',
  message: '요청에 성공했습니다.',
  result: {
    providers: [
      {
        provider: 'KAKAO',
        providerName: '카카오',
        isLinked: true,
        email: 'test@kakao.com',
        linkedAt: '2026-01-01',
        isUnlinkable: false,
      },
    ],
  },
} satisfies MockResponse<'get', '/api/v1/members/me/providers'>;

export const mockOptionalTerms = {
  code: 'SUCCESS',
  message: '요청에 성공했습니다.',
  result: {
    marketing: { agreed: false, changedAt: null },
    notification: { agreed: true, changedAt: null },
  },
} satisfies MockResponse<'get', '/api/v1/members/me/terms/optional'>;
