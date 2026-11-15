import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { withAuth } from '@/app/routes/withAuth';

import { BusinessError, ServerError } from '@/shared/api/apiHandler';
import { postReissueToken } from '@/shared/api/handlers/postReissueToken';
import { useAuthStore } from '@/shared/store/auth';

import { AuthInitializer } from './AuthInitializer';
const { replace, current } = vi.hoisted(() => ({
  replace: vi.fn(),
  current: { name: 'HomePage', previousName: '' },
}));
vi.mock('@/app/routes/stackflow', () => ({ useFlow: () => ({ replace }) }));
vi.mock('@stackflow/react', () => ({
  useStack: () => ({
    activities: [
      ...(current.previousName
        ? [{ name: current.previousName, isActive: true, exitedBy: {} }]
        : []),
      { name: current.name, isActive: !current.previousName, isTop: true },
    ],
  }),
}));
vi.mock('@/app/routes/config', () => ({
  routes: [
    { name: 'HomePage', withAuth: true },
    { name: 'SettingsTermDetailPage', withAuth: false },
  ],
}));
vi.mock('@/shared/api/handlers/postReissueToken', () => ({
  postReissueToken: vi.fn(),
}));
vi.mock('@/shared/api/handlers/postLogout', () => ({ postLogout: vi.fn() }));
vi.mock('@/shared/ui/loading/PageLoader', () => ({
  PageLoader: () => <p>인증 확인 중</p>,
}));
vi.mock('@/shared/ui/error', () => ({
  QueryErrorFallback: ({
    message,
    onRetry,
  }: {
    message: string;
    onRetry: () => void;
  }) => (
    <>
      <p>{message}</p>
      <button onClick={onRetry}>다시 시도</button>
    </>
  ),
}));
const result = {
  accessToken: 'new-token',
  status: 'ACTIVE' as const,
  accessTokenExpiresIn: 3600,
  crewId: 1,
  needsTermsUpdate: false,
};
const response = { code: 'SUCCESS', message: '성공', result };
const Private = withAuth(() => <p>회원 전용 내용</p>);
let root: Root, container: HTMLDivElement, client: QueryClient;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  current.name = 'HomePage';
  current.previousName = '';
  useAuthStore.setState({
    accessToken: undefined,
    status: undefined,
    isInitialized: false,
    generation: 0,
    destination: undefined,
  });
  client = new QueryClient();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  container.remove();
  vi.resetAllMocks();
});
async function render(publicPage = false) {
  await act(async () =>
    root.render(
      <StrictMode>
        <QueryClientProvider client={client}>
          <AuthInitializer>
            {publicPage ? <p>공개 약관 내용</p> : <Private />}
          </AuthInitializer>
        </QueryClientProvider>
      </StrictMode>
    )
  );
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
}
describe('인증 초기화와 보호 화면', () => {
  it('StrictMode 초기화도 재발급을 한 번만 호출한다', async () => {
    vi.mocked(postReissueToken).mockResolvedValue(response);
    await render();
    expect(postReissueToken).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain('회원 전용 내용');
  });
  it('토큰 소실 시 보호 내용을 숨기고 회원 캐시를 제거한다', async () => {
    useAuthStore.getState().setSession(result);
    client.setQueryData(['private'], { name: '이전 회원' });
    await render();
    await act(async () => useAuthStore.getState().clearSession());
    expect(container.textContent).not.toContain('회원 전용 내용');
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(replace).toHaveBeenCalledWith('LoginPage', {}, { animate: false });
  });
  it('초기화 서버 오류를 로그인 만료와 구분하고 재시도한다', async () => {
    vi.mocked(postReissueToken)
      .mockRejectedValueOnce(new ServerError('일시 오류', 503))
      .mockResolvedValueOnce(response);
    await render();
    expect(container.textContent).toContain('로그인 상태를 확인하지 못했어요');
    expect(replace).not.toHaveBeenCalled();
    await act(async () => container.querySelector('button')!.click());
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(container.textContent).toContain('회원 전용 내용');
  });
  it('로그아웃 상태에서도 공개 약관을 읽는다', async () => {
    current.name = 'SettingsTermDetailPage';
    vi.mocked(postReissueToken).mockRejectedValue(
      new BusinessError('만료', 'EXPIRED_TOKEN', 401)
    );
    await render(true);
    expect(container.textContent).toContain('공개 약관 내용');
    expect(replace).not.toHaveBeenCalled();
  });
  it('인증 서버 장애도 정적 공개 약관을 막지 않는다', async () => {
    current.name = 'SettingsTermDetailPage';
    vi.mocked(postReissueToken).mockRejectedValue(
      new ServerError('일시 오류', 503)
    );
    await render(true);
    expect(container.textContent).toContain('공개 약관 내용');
    expect(replace).not.toHaveBeenCalled();
  });
  it('전환 중 퇴장하는 약관 화면 대신 새 온보딩 화면을 기준으로 판단한다', async () => {
    current.name = 'OnboardingPage';
    current.previousName = 'OnboardingTermAgreePage';
    useAuthStore.getState().setSession(result);
    await render();
    expect(replace).not.toHaveBeenCalled();
    expect(container.textContent).toContain('회원 전용 내용');
  });
  it('약관 완료의 회원 상태와 다음 화면을 함께 반영해 홈 이동과 경쟁하지 않는다', async () => {
    current.name = 'OnboardingTermAgreePage';
    useAuthStore.getState().setSession(result, 'OnboardingPage');
    await render();
    expect(replace).toHaveBeenCalledWith(
      'OnboardingPage',
      {},
      { animate: false }
    );
    expect(replace).not.toHaveBeenCalledWith(
      'HomePage',
      {},
      { animate: false }
    );
  });
});
