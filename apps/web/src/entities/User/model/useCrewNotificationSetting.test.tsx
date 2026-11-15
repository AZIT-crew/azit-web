import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CrewNotificationSettingsResponse } from '@/entities/User/api/getCrewNotificationSettings';
import { userQueries } from '@/entities/User/api/queries';
import { updateCrewNotificationSetting } from '@/entities/User/api/updateCrewNotificationSetting';

import { useCrewNotificationSetting } from './useCrewNotificationSetting';
import type { CrewNotificationSetting } from './user.model';

vi.mock('@/entities/User/api/updateCrewNotificationSetting', () => ({
  updateCrewNotificationSetting: vi.fn(),
}));
let client: QueryClient;
let root: Root;
let container: HTMLDivElement;
const hooks = new Map<number, ReturnType<typeof useCrewNotificationSetting>>();
const crew = (crewId: number, enabled = true): CrewNotificationSetting => ({
  crewId,
  crewName: `크루${crewId}`,
  crewImageUrl: null,
  regularRunEnabled: enabled,
  lightningRunEnabled: enabled,
  allEnabled: enabled,
});
const response = (result: CrewNotificationSetting) => ({
  code: 'SUCCESS',
  message: '성공',
  result,
});
const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 5));
  });
function Hook({ id }: { id: number }) {
  hooks.set(id, useCrewNotificationSetting(id));
  return null;
}
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  client.setQueryData<CrewNotificationSettingsResponse>(
    userQueries.crewNotificationsKey(),
    { code: 'SUCCESS', message: '성공', result: [crew(1), crew(2)] }
  );
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Hook id={1} />
        <Hook id={2} />
      </QueryClientProvider>
    )
  );
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  client.clear();
  hooks.clear();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});
const data = () =>
  client.getQueryData<CrewNotificationSettingsResponse>(
    userQueries.crewNotificationsKey()
  )!.result;

describe('크루별 알림 저장', () => {
  it('같은 프레임의 중복·교차 토글은 한 번만 저장하고 성공 응답을 반영한다', async () => {
    let finish!: (value: ReturnType<typeof response>) => void;
    vi.mocked(updateCrewNotificationSetting).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    await act(async () => {
      hooks.get(1)!.update({ allEnabled: false });
      hooks.get(1)!.update({ regularRunEnabled: false });
    });
    await flush();
    expect(updateCrewNotificationSetting).toHaveBeenCalledTimes(1);
    expect(updateCrewNotificationSetting).toHaveBeenCalledWith(
      { crewId: 1, allEnabled: false },
      expect.anything()
    );
    expect(hooks.get(1)!.isPending).toBe(true);
    expect(data()[0].allEnabled).toBe(true);
    await act(async () => finish(response(crew(1, false))));
    await flush();
    expect(data()[0].allEnabled).toBe(false);
    expect(data()[1].allEnabled).toBe(true);
    expect(hooks.get(1)!.isPending).toBe(false);
  });
  it('서로 다른 크루 응답이 역순으로 와도 각 크루의 저장값을 유지한다', async () => {
    const finishes = new Map<
      number,
      (value: ReturnType<typeof response>) => void
    >();
    vi.mocked(updateCrewNotificationSetting).mockImplementation(
      ({ crewId }) =>
        new Promise((resolve) => {
          finishes.set(crewId, resolve);
        })
    );
    await act(async () => {
      hooks.get(1)!.update({ allEnabled: false });
      hooks.get(2)!.update({ allEnabled: false });
    });
    await flush();
    expect(updateCrewNotificationSetting).toHaveBeenCalledTimes(2);
    await act(async () => finishes.get(2)!(response(crew(2, false))));
    await flush();
    await act(async () => finishes.get(1)!(response(crew(1, false))));
    await flush();
    expect(data().map((c) => c.allEnabled)).toEqual([false, false]);
  });
  it('실패하면 기존 값을 유지하고 같은 변경으로 다시 시도할 수 있다', async () => {
    vi.mocked(updateCrewNotificationSetting)
      .mockRejectedValueOnce(new Error('실패'))
      .mockResolvedValueOnce(response(crew(1, false)));
    await act(async () => hooks.get(1)!.update({ allEnabled: false }));
    await flush();
    expect(data()[0].allEnabled).toBe(true);
    expect(hooks.get(1)!.isPending).toBe(false);
    await act(async () => hooks.get(1)!.update({ allEnabled: false }));
    await flush();
    expect(updateCrewNotificationSetting).toHaveBeenCalledTimes(2);
    expect(data()[0].allEnabled).toBe(false);
  });
});
