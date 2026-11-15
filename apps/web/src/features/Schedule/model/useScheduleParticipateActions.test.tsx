import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { scheduleQueries } from '@/features/Schedule/api/queries';

import { useScheduleParticipateActions } from './useScheduleParticipateActions';

const api = vi.hoisted(() => ({
  join: vi.fn(),
  cancel: vi.fn(),
  toast: vi.fn(),
}));
vi.mock('@/features/Schedule/api/postParticipateSchedule', () => ({
  postParticipateSchedule: api.join,
}));
vi.mock('@/features/Schedule/api/deleteCancelParticipation', () => ({
  deleteCancelParticipation: api.cancel,
}));
vi.mock('@/shared/ui/toast', () => ({ toastSuccess: api.toast }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

let root: Root;
let container: HTMLDivElement;
let client: QueryClient;
let actions: ReturnType<typeof useScheduleParticipateActions>;
let detailIsError: boolean;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});
afterAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: false });
});
beforeEach(() => {
  vi.clearAllMocks();
  api.join.mockResolvedValue({ code: 'SUCCESS' });
  api.cancel.mockResolvedValue({ code: 'SUCCESS' });
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  client.clear();
  container.remove();
});

async function mount(
  refetchDetail: () => Promise<{ isParticipating: boolean }>,
  { crewId = 1, scheduleId = 2, isParticipating = false } = {}
) {
  function Harness() {
    const detail = useQuery({
      queryKey: scheduleQueries.detail(scheduleId),
      queryFn: refetchDetail,
      initialData: { isParticipating },
      staleTime: Infinity,
    });
    detailIsError = detail.isError;
    actions = useScheduleParticipateActions({ crewId, scheduleId });
    return null;
  }
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <Harness />
      </QueryClientProvider>
    );
  });
}

async function waitFor(check: () => void) {
  await vi.waitFor(
    async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      check();
    },
    { interval: 5 }
  );
}

describe('일정 신청·취소의 요청 잠금', () => {
  it('동일 프레임의 중복 신청과 취소를 막고 상세 재조회가 끝날 때까지 잠근다', async () => {
    const write = deferred<{ code: string }>();
    const read = deferred<{ isParticipating: boolean }>();
    const refetchDetail = vi.fn(() => read.promise);
    api.join.mockReturnValueOnce(write.promise);
    await mount(refetchDetail);
    await act(async () => {
      actions.participate();
      actions.participate();
      actions.cancelParticipation();
    });
    expect(api.join).toHaveBeenCalledTimes(1);
    expect(api.cancel).not.toHaveBeenCalled();

    await act(async () => {
      write.resolve({ code: 'SUCCESS' });
    });
    await waitFor(() => {
      expect(refetchDetail).toHaveBeenCalledTimes(1);
      expect(actions.isPending).toBe(true);
    });
    await act(async () => {
      actions.participate();
      actions.cancelParticipation();
    });
    expect(api.join).toHaveBeenCalledTimes(1);
    expect(api.cancel).not.toHaveBeenCalled();
    expect(api.toast).not.toHaveBeenCalled();

    await act(async () => {
      read.resolve({ isParticipating: true });
    });
    await waitFor(() => {
      expect(actions.isPending).toBe(false);
    });
    expect(api.toast).toHaveBeenCalledWith('신청이 완료되었습니다');
    expect(client.getQueryData(scheduleQueries.detail(2))).toEqual({
      isParticipating: true,
    });
  });

  it('취소도 상세 재조회가 끝나기 전에 다시 신청하거나 취소할 수 없다', async () => {
    const read = deferred<{ isParticipating: boolean }>();
    await mount(() => read.promise, { isParticipating: true });
    await act(async () => {
      actions.cancelParticipation();
      actions.cancelParticipation();
    });
    await waitFor(() => {
      expect(actions.isPending).toBe(true);
    });
    await act(async () => {
      actions.participate();
      actions.cancelParticipation();
    });
    expect(api.cancel).toHaveBeenCalledTimes(1);
    expect(api.join).not.toHaveBeenCalled();
    await act(async () => {
      read.resolve({ isParticipating: false });
    });
    await waitFor(() => {
      expect(actions.isPending).toBe(false);
    });
    expect(api.toast).toHaveBeenCalledWith('신청이 취소되었습니다');
  });

  it.each(['participate', 'cancelParticipation'] as const)(
    '%s 요청 실패 후 잠금이 풀려 재시도할 수 있다',
    async (action) => {
      const request = action === 'participate' ? api.join : api.cancel;
      request.mockRejectedValueOnce(new Error('요청 실패'));
      await mount(async () => ({ isParticipating: false }));
      await act(async () => {
        actions[action]();
      });
      await waitFor(() => {
        expect(request).toHaveBeenCalledTimes(1);
        expect(actions.isPending).toBe(false);
      });
      expect(api.toast).not.toHaveBeenCalled();
      await act(async () => {
        actions[action]();
      });
      await waitFor(() => {
        expect(request).toHaveBeenCalledTimes(2);
        expect(actions.isPending).toBe(false);
      });
      expect(api.toast).toHaveBeenCalledTimes(1);
    }
  );

  it('저장 성공 후 조회 실패를 조회 오류로 유지하고 저장 요청을 반복하지 않는다', async () => {
    await mount(async () => {
      throw new Error('조회 실패');
    });
    await act(async () => {
      actions.participate();
    });
    await waitFor(() => {
      expect(actions.isPending).toBe(false);
      expect(detailIsError).toBe(true);
    });
    expect(api.join).toHaveBeenCalledTimes(1);
    expect(api.toast).toHaveBeenCalledWith('신청이 완료되었습니다');
  });

  it('크루가 유효하지 않으면 요청을 보내지 않는다', async () => {
    await mount(async () => ({ isParticipating: false }), { crewId: 0 });
    await act(async () => {
      actions.participate();
      actions.cancelParticipation();
    });
    expect(api.join).not.toHaveBeenCalled();
    expect(api.cancel).not.toHaveBeenCalled();
  });
});
