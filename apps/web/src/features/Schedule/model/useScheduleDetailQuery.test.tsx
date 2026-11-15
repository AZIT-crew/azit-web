import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, Component, Suspense, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getScheduleDetail } from '@/entities/Schedule/api/getScheduleDetail';
import { scheduleKeys } from '@/entities/Schedule/api/keys';

import { BusinessError, ServerError } from '@/shared/api/apiHandler';

import { useScheduleDetailQuery } from './useScheduleDetailQuery';

vi.mock('@/entities/Schedule/api/getScheduleDetail', () => ({
  getScheduleDetail: vi.fn(),
}));
let root: Root;
let container: HTMLDivElement;
let client: QueryClient;
class Boundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <p role="alert">{this.state.error.message}</p>
    ) : (
      this.props.children
    );
  }
}
function Content() {
  const query = useScheduleDetailQuery(1, 1);
  return (
    <>
      <p>{query.data.result.title}</p>
      {query.isError && <p>다시 시도</p>}
    </>
  );
}
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(
    scheduleKeys.detail(1),
    {
      code: 'SUCCESS',
      message: '성공',
      result: { title: '이전 일정 상세' },
    },
    { updatedAt: Date.now() - 5000 }
  );
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  container.remove();
  vi.resetAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function renderFailure(error: Error) {
  vi.mocked(getScheduleDetail).mockRejectedValue(error);
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <Boundary>
          <Suspense fallback={<p>로딩</p>}>
            <Content />
          </Suspense>
        </Boundary>
      </QueryClientProvider>
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 25));
  });
}
describe('캐시가 있는 일정 상세의 오류 처리', () => {
  it.each([
    'SCHEDULE_NOT_FOUND',
    'ALREADY_CANCELLED_SCHEDULE',
    'NOT_A_CREW_MEMBER',
  ])('%s이면 오래된 상세 대신 도메인 오류를 표시한다', async (code) => {
    await renderFailure(new BusinessError('대상 일정 접근 불가', code, 400));
    expect(container.textContent).toBe('대상 일정 접근 불가');
    expect(container.textContent).not.toContain('이전 일정 상세');
  });
  it('일시적인 서버 오류는 기존 상세를 보존하고 재시도 상태를 제공한다', async () => {
    await renderFailure(new ServerError('일시 오류', 500));
    expect(container.textContent).toContain('이전 일정 상세');
    expect(container.textContent).toContain('다시 시도');
  });
});
