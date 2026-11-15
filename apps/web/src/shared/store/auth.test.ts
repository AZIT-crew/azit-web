import { afterEach, expect, it, vi } from 'vitest';

import { postLogout } from '@/shared/api/handlers/postLogout';

import { useAuthStore } from './auth';

vi.mock('@/shared/api/handlers/postLogout', () => ({ postLogout: vi.fn() }));
afterEach(() => {
  vi.resetAllMocks();
  useAuthStore.getState().clearSession();
  useAuthStore.getState().setIsInitialized(false);
});
it('로그아웃 실패 시 기존 인증 상태를 유지하고 호출자에게 오류를 전달한다', async () => {
  useAuthStore
    .getState()
    .setSession({ accessToken: 'qa-token', status: 'ACTIVE' });
  vi.mocked(postLogout).mockRejectedValue(new Error('서버 오류'));
  await expect(useAuthStore.getState().logout()).rejects.toThrow('서버 오류');
  expect(useAuthStore.getState()).toMatchObject({
    accessToken: 'qa-token',
    isInitialized: true,
  });
});
it('서버 로그아웃 성공 후 재발급 없이 로그아웃 상태로 전환한다', async () => {
  useAuthStore
    .getState()
    .setSession({ accessToken: 'qa-token', status: 'ACTIVE' });
  vi.mocked(postLogout).mockResolvedValue({ code: 'SUCCESS', message: '성공' });
  await useAuthStore.getState().logout();
  expect(useAuthStore.getState()).toMatchObject({
    accessToken: undefined,
    isInitialized: true,
  });
});
