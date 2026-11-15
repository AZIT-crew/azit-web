import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { handlers } from './handlers';
import { resetMemberMocks } from './handlers/member';
import { setMockAuthStatus } from './state/auth';
const server = setupServer(...handlers);
const api = 'https://mock-api.azitcrew.com/api/v1';
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  localStorage.clear();
  resetMemberMocks();
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
async function send(path: string, body?: unknown) {
  const response = await fetch(api + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}
describe('회원 상태와 가입 약관 mock', () => {
  it('필수 약관 누락은 가입을 완료하지 않고, 모두 동의하면 ACTIVE와 선택 동의를 저장한다', async () => {
    setMockAuthStatus('PENDING_TERMS');
    const terms = {
      serviceTermsAgreed: true,
      privacyPolicyAgreed: true,
      locationServiceAgreed: true,
      thirdPartyInfoAgreed: true,
      marketingTermsAgreed: false,
      notificationTermsAgreed: false,
    };
    expect(
      await send('/members/terms', { ...terms, privacyPolicyAgreed: false })
    ).toMatchObject({
      status: 400,
      body: { code: 'REQUIRED_TERMS_NOT_AGREED' },
    });
    expect((await send('/auth/reissue', {})).body.result.status).toBe(
      'PENDING_TERMS'
    );
    expect(await send('/members/terms', terms)).toEqual({
      status: 200,
      body: { code: 'SUCCESS', message: '요청에 성공했습니다.' },
    });
    expect((await send('/auth/reissue', {})).body.result.status).toBe('ACTIVE');
    expect(
      (await send('/members/me/terms/optional')).body.result
    ).toMatchObject({
      marketing: { agreed: false },
      notification: { agreed: false },
    });
  });
  it('공개 회원 상태 enum과 명시적인 로그아웃 상태를 재현한다', async () => {
    for (const status of [
      'ACTIVE',
      'PENDING_TERMS',
      'WITHDRAWN',
      'DELETED',
    ] as const) {
      setMockAuthStatus(status);
      expect((await send('/auth/reissue', {})).body.result.status).toBe(status);
    }
    setMockAuthStatus('LOGGED_OUT');
    expect(await send('/auth/reissue', {})).toMatchObject({
      status: 401,
      body: { code: 'UNAUTHORIZED' },
    });
  });
});
