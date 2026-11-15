import { MockApiError, mockApi } from '../api';
import { mockSuccess } from '../data/crew';
import {
  getMockAttendanceCalendar,
  getMockAttendanceLogs,
} from '../state/attendances';
import { setMockAuthStatus } from '../state/auth';
import {
  getMockMyCrews,
  resetCrewMocks,
  getMockCrewNotificationSettings,
  updateMockCrewNotificationSetting,
} from '../state/crews';
import {
  getMockMyInfo,
  getMockOptionalTerms,
  getMockProviders,
  resetMockMemberState,
  updateMockOptionalTerms,
  updateMockProfile,
} from '../state/member';
import {
  getMockCheckInStatus,
  getMockMemberSchedules,
} from '../state/schedules';

export function resetMemberMocks() {
  resetMockMemberState();
  resetCrewMocks();
}

export const memberHandlers = [
  mockApi.post('/api/v1/members/terms', async ({ request }) => {
    const body = await request.json();
    if (
      !body ||
      body.serviceTermsAgreed !== true ||
      body.privacyPolicyAgreed !== true ||
      body.locationServiceAgreed !== true ||
      body.thirdPartyInfoAgreed !== true
    )
      throw new MockApiError(
        'REQUIRED_TERMS_NOT_AGREED',
        '필수 약관에 모두 동의해주세요.',
        400
      );
    if (
      typeof body.marketingTermsAgreed !== 'boolean' ||
      (body.notificationTermsAgreed != null &&
        typeof body.notificationTermsAgreed !== 'boolean')
    )
      throw new MockApiError(
        'INVALID_INPUT_VALUE',
        '유효하지 않은 입력 값입니다.',
        400
      );
    updateMockOptionalTerms({
      marketingAgreed: body.marketingTermsAgreed,
      notificationAgreed: body.notificationTermsAgreed ?? false,
    });
    setMockAuthStatus('ACTIVE');
    return mockSuccess;
  }),
  mockApi.get('/api/v1/members/me/crews/notifications', () => ({
    ...mockSuccess,
    result: getMockCrewNotificationSettings(),
  })),
  mockApi.patch(
    '/api/v1/members/me/crews/{crewId}/notifications',
    async ({ params, request }) => ({
      ...mockSuccess,
      result: updateMockCrewNotificationSetting(
        Number(params.crewId),
        await request.json()
      ),
    })
  ),
  mockApi.post('/api/v1/members/me/withdraw', () => {
    if (
      getMockMyCrews().some(
        (crew) => crew.memberRole === 'LEADER' && crew.memberStatus === 'JOINED'
      )
    )
      throw new MockApiError(
        'CANNOT_SERVICE_WITHDRAW_AS_LEADER',
        '리더로 소속된 크루가 있어 탈퇴할 수 없습니다.',
        400
      );
    localStorage.setItem('__mock_auth_status__', 'LOGGED_OUT');
    return mockSuccess;
  }),
  mockApi.get('/api/v1/members/me', () => getMockMyInfo()),

  mockApi.patch('/api/v1/members/me/profile', async ({ request }) => {
    const body = await request.json();
    updateMockProfile(body);
    return mockSuccess;
  }),

  mockApi.get('/api/v1/members/me/crews', () => ({
    ...mockSuccess,
    result: getMockMyCrews(),
  })),
  mockApi.get('/api/v1/members/me/schedules', () => ({
    ...mockSuccess,
    result: getMockMemberSchedules(),
  })),
  mockApi.get('/api/v1/members/me/check-in-status', () => ({
    ...mockSuccess,
    result: getMockCheckInStatus(),
  })),

  mockApi.get('/api/v1/members/me/attendances', ({ request }) => {
    return {
      ...mockSuccess,
      result: getMockAttendanceLogs(new URL(request.url).searchParams),
    };
  }),

  mockApi.get('/api/v1/members/me/attendances/calendar', ({ request }) => {
    return {
      ...mockSuccess,
      result: getMockAttendanceCalendar(new URL(request.url).searchParams),
    };
  }),

  mockApi.get('/api/v1/members/me/providers', () => ({
    ...mockSuccess,
    result: getMockProviders(),
  })),
  mockApi.get('/api/v1/members/me/terms/optional', () =>
    getMockOptionalTerms()
  ),

  mockApi.patch('/api/v1/members/me/terms/optional', async ({ request }) => {
    const body = await request.json();
    const response = updateMockOptionalTerms(body);
    if (body.notificationAgreed === true) {
      getMockCrewNotificationSettings().forEach(({ crewId }) => {
        updateMockCrewNotificationSetting(crewId, { allEnabled: true });
      });
    }
    return response;
  }),

  mockApi.post(
    '/api/v1/members/me/schedules/{scheduleId}/check-in',
    () => mockSuccess
  ),
];
