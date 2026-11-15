import { setupServer } from 'msw/node';
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

import { handlers } from './handlers';
import { resetMemberMocks } from './handlers/member';
import { resolveMockJoinRequest } from './state/crews';

const server = setupServer(...handlers);
const api = 'https://mock-api.azitcrew.com/api/v1';
const listPath = '/members/me/crews/notifications';
const patchPath = (id: number) => `/members/me/crews/${id}/notifications`;
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetMemberMocks());
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());
async function send(path: string, method = 'GET', body?: unknown) {
  const response = await fetch(api + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}
const switches = (
  regularRunEnabled: boolean,
  lightningRunEnabled: boolean
) => ({
  regularRunEnabled,
  lightningRunEnabled,
  allEnabled: regularRunEnabled && lightningRunEnabled,
});

describe('크루별 알림 OpenAPI 계약과 mock 상태', () => {
  it('전체 알림 동의를 켜면 모든 가입 크루를 켜고, 동의를 끌 때는 크루 설정을 보존한다', async () => {
    await send(patchPath(1), 'PATCH', { allEnabled: false });
    await send(patchPath(2), 'PATCH', { regularRunEnabled: false });
    const before = (await send(listPath)).body.result;
    await send('/members/me/terms/optional', 'PATCH', {
      notificationAgreed: false,
    });
    expect((await send(listPath)).body.result).toEqual(before);
    await send('/members/me/terms/optional', 'PATCH', {
      marketingAgreed: true,
    });
    expect((await send(listPath)).body.result).toEqual(before);
    await send('/members/me/terms/optional', 'PATCH', {
      notificationAgreed: true,
    });
    expect(
      (await send(listPath)).body.result.map(
        (c: { allEnabled: boolean }) => c.allEnabled
      )
    ).toEqual([true, true]);
  });
  it('크루별 알림을 모두 꺼도 전체 알림 동의 값은 바꾸지 않는다', async () => {
    await send(patchPath(1), 'PATCH', { allEnabled: false });
    await send(patchPath(2), 'PATCH', { allEnabled: false });
    expect(
      (await send('/members/me/terms/optional')).body.result.notification.agreed
    ).toBe(true);
    await send('/members/me/terms/optional', 'PATCH', {
      notificationAgreed: false,
    });
    await send(patchPath(1), 'PATCH', { allEnabled: true });
    expect(
      (await send('/members/me/terms/optional')).body.result.notification.agreed
    ).toBe(false);
  });
  it('가입 완료 크루와 실제 이름을 조회하고 변경 전 토글을 모두 켠다', async () => {
    const response = await send(listPath);
    expect(response.status).toBe(200);
    expect(response.body.result).toEqual([
      {
        crewId: 1,
        crewName: '한강 러너스',
        crewImageUrl: '/icons/icon-crew-default.svg',
        ...switches(true, true),
      },
      {
        crewId: 2,
        crewName: '새벽 달리기 모임',
        crewImageUrl: '/icons/icon-crew-default.svg',
        ...switches(true, true),
      },
    ]);
    await send('/crews/join', 'POST', { invitationCode: 'NOON03' });
    expect((await send(listPath)).body.result).toHaveLength(2);
    expect(
      (await send(patchPath(3), 'PATCH', { allEnabled: false })).body.code
    ).toBe('NOT_A_CREW_MEMBER');
    resolveMockJoinRequest(3, true);
    expect((await send(listPath)).body.result[2]).toMatchObject({
      crewId: 3,
      ...switches(true, true),
    });
  });
  it('전체와 개별 토글 변경을 저장하고 재조회에도 유지하며 다른 크루는 변경하지 않는다', async () => {
    expect(
      (await send(patchPath(1), 'PATCH', { allEnabled: false })).body.result
    ).toMatchObject(switches(false, false));
    expect(
      (await send(patchPath(1), 'PATCH', { regularRunEnabled: true })).body
        .result
    ).toMatchObject(switches(true, false));
    const response = await send(patchPath(1), 'PATCH', {
      lightningRunEnabled: true,
    });
    expect(response.body.result).toMatchObject(switches(true, true));
    expect(response.body.result).not.toHaveProperty('flashRunEnabled');
    await send(patchPath(1), 'PATCH', { regularRunEnabled: false });
    const list = (await send(listPath)).body.result;
    expect(list[0]).toMatchObject(switches(false, true));
    expect(list[1]).toMatchObject(switches(true, true));
    expect(
      (await send(patchPath(2), 'PATCH', { lightningRunEnabled: false })).status
    ).toBe(200);
  });
  it('전체 설정을 먼저 적용한 뒤 개별 값을 덮어쓰고 null인 필드는 유지한다', async () => {
    expect(
      (
        await send(patchPath(1), 'PATCH', {
          allEnabled: false,
          regularRunEnabled: true,
        })
      ).body.result
    ).toMatchObject(switches(true, false));
    expect(
      (
        await send(patchPath(1), 'PATCH', {
          allEnabled: true,
          regularRunEnabled: false,
        })
      ).body.result
    ).toMatchObject(switches(false, true));
    expect(
      (
        await send(patchPath(1), 'PATCH', {
          allEnabled: null,
          regularRunEnabled: null,
          lightningRunEnabled: false,
        })
      ).body.result
    ).toMatchObject(switches(false, false));
  });
  it('빈 변경·모두 null·잘못된 타입·미가입 크루 요청을 거절하고 기존 값을 유지한다', async () => {
    for (const body of [
      {},
      { allEnabled: null, regularRunEnabled: null, lightningRunEnabled: null },
      { allEnabled: 'false' },
      { flashRunEnabled: false },
    ]) {
      const response = await send(patchPath(1), 'PATCH', body);
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVALID_INPUT_VALUE');
    }
    expect(
      (await send(patchPath(3), 'PATCH', { allEnabled: false })).status
    ).toBe(403);
    expect((await send(listPath)).body.result[0]).toMatchObject(
      switches(true, true)
    );
  });
  it('수정한 크루 이름과 새로 생성한 크루를 같은 조회 원본에서 반영한다', async () => {
    await send('/crews/1/info', 'PATCH', {
      name: '수정크루',
      imageUrl: '/qa-crew.svg',
    });
    await send('/crews', 'POST', {
      name: '새크루',
      category: 'RUNNING',
      region: 'SEOUL',
    });
    const list = (await send(listPath)).body.result;
    expect(list[0]).toMatchObject({
      crewName: '수정크루',
      crewImageUrl: '/qa-crew.svg',
    });
    expect(list[2]).toMatchObject({
      crewId: 4,
      crewName: '새크루',
      ...switches(true, true),
    });
  });
  it('탈퇴 시 설정을 지우고 재가입 승인 후 모두 켜짐으로 초기화한다', async () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1800000000000);
    await send(patchPath(2), 'PATCH', { allEnabled: false });
    await send('/crews/2/members/me', 'DELETE');
    expect(
      (await send(listPath)).body.result.map(
        (c: { crewId: number }) => c.crewId
      )
    ).toEqual([1]);
    expect(
      (await send(patchPath(2), 'PATCH', { allEnabled: true })).status
    ).toBe(403);
    clock.mockReturnValue(1800000000000 + 24 * 60 * 60 * 1000);
    await send('/crews/join', 'POST', { invitationCode: 'DAWN02' });
    resolveMockJoinRequest(2, true);
    expect((await send(listPath)).body.result[1]).toMatchObject({
      crewId: 2,
      ...switches(true, true),
    });
  });
  it('참여 크루가 없으면 성공과 빈 배열을 반환한다', async () => {
    await send('/crews/1', 'DELETE');
    await send('/crews/2/members/me', 'DELETE');
    expect((await send(listPath)).body.result).toEqual([]);
  });
});
