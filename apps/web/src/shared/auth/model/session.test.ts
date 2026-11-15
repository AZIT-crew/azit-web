import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BusinessError, ServerError } from '@/shared/api/apiHandler';
import { postReissueToken } from '@/shared/api/handlers/postReissueToken';
import { useAuthStore } from '@/shared/store/auth';

import { refreshSession, SessionChangedError } from './session';
vi.mock('@/shared/api/handlers/postReissueToken', () => ({
  postReissueToken: vi.fn(),
}));
vi.mock('@/shared/api/handlers/postLogout', () => ({ postLogout: vi.fn() }));
const result = {
  accessToken: 'new-token',
  status: 'ACTIVE' as const,
  accessTokenExpiresIn: 3600,
  crewId: 1,
  needsTermsUpdate: false,
};
const response = { code: 'SUCCESS', message: '성공', result };
beforeEach(() => {
  useAuthStore
    .getState()
    .setSession({ accessToken: 'old-token', status: 'ACTIVE' });
});
afterEach(() => {
  vi.resetAllMocks();
  useAuthStore.getState().clearSession();
});
describe('공유 세션 재발급', () => {
  it('동시 호출이 하나의 RTR 교환을 공유한다', async () => {
    vi.mocked(postReissueToken).mockResolvedValue(response);
    const a = refreshSession(),
      b = refreshSession();
    expect(a).toBe(b);
    await Promise.all([a, b]);
    expect(postReissueToken).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: 'new-token',
      status: 'ACTIVE',
      isInitialized: true,
    });
  });
  it('로그아웃 후 늦게 도착한 재발급 응답으로 세션이 살아나지 않는다', async () => {
    let resolve!: (value: typeof response) => void;
    vi.mocked(postReissueToken).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        })
    );
    const pending = refreshSession();
    useAuthStore.getState().clearSession();
    resolve(response);
    await expect(pending).rejects.toBeInstanceOf(SessionChangedError);
    expect(useAuthStore.getState().accessToken).toBeUndefined();
  });
  it('일시 서버 오류는 기존 세션을 보존하고 다음 재시도를 허용한다', async () => {
    vi.mocked(postReissueToken)
      .mockRejectedValueOnce(new ServerError('일시 오류', 503))
      .mockResolvedValueOnce(response);
    await expect(refreshSession()).rejects.toBeInstanceOf(ServerError);
    expect(useAuthStore.getState().accessToken).toBe('old-token');
    await refreshSession();
    expect(postReissueToken).toHaveBeenCalledTimes(2);
  });
  it('인증 거절은 세션을 제거하고 초기화를 끝낸다', async () => {
    vi.mocked(postReissueToken).mockRejectedValue(
      new BusinessError('만료', 'EXPIRED_TOKEN', 401)
    );
    await expect(refreshSession()).rejects.toBeInstanceOf(BusinessError);
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: undefined,
      status: undefined,
      isInitialized: true,
    });
  });
  it('회원 상태를 함께 갱신하며 서비스 이용 불가 상태의 토큰은 사용하지 않는다', async () => {
    vi.mocked(postReissueToken).mockResolvedValueOnce({
      ...response,
      result: { ...result, status: 'PENDING_TERMS' },
    });
    await refreshSession();
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: 'new-token',
      status: 'PENDING_TERMS',
    });
    vi.mocked(postReissueToken).mockResolvedValueOnce({
      ...response,
      result: { ...result, status: 'WITHDRAWN' },
    });
    await refreshSession();
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: undefined,
      status: 'WITHDRAWN',
    });
  });
});
