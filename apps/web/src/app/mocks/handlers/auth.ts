import type { ReissueTokenResult } from '@/shared/api/models/auth';

import { MockApiError, mockApi, type MockResponse } from '../api';
import { mockSuccess } from '../data/crew';
import { getMockAuthStatus, setMockAuthStatus } from '../state/auth';
import { unlinkMockProvider } from '../state/member';

type LoginStatus = ReissueTokenResult['status'];

function loginResponse(
  status: LoginStatus
): MockResponse<'post', '/api/v1/auth/reissue'> {
  return {
    code: 'SUCCESS',
    message: '요청에 성공했습니다.',
    result: {
      accessToken: 'mock-access-token',
      accessTokenExpiresIn: 3600,
      status,
      crewId: 1,
      needsTermsUpdate: status === 'PENDING_TERMS',
    },
  };
}

export const authHandlers = [
  mockApi.delete('/api/v1/auth/social-accounts/{provider}', ({ params }) => {
    unlinkMockProvider(params.provider);
    return mockSuccess;
  }),
  mockApi.post('/api/v1/auth/social-login/{provider}', () => {
    setMockAuthStatus('ACTIVE');
    return loginResponse('ACTIVE');
  }),

  mockApi.post('/api/v1/auth/reissue', () => {
    const status = getMockAuthStatus();
    if (status === 'LOGGED_OUT') {
      throw new MockApiError('UNAUTHORIZED', '인증이 필요합니다.', 401);
    }
    return loginResponse(status);
  }),

  mockApi.post('/api/v1/auth/logout', () => {
    setMockAuthStatus('LOGGED_OUT');
    return mockSuccess;
  }),
];
