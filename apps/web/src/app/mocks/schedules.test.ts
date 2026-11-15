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

import type { components } from '@/shared/api/apiTypes';

import { handlers } from './handlers';
import { resetScheduleMocks } from './state/schedules';

const server = setupServer(...handlers);
const api = 'https://mock-api.azitcrew.com/api/v1';
const crew = '/crews/1/schedules';
const input = {
  title: 'QA 일정',
  runType: 'REGULAR',
  meetingAt: '2026-11-18 10:00:00',
  locationName: '반포 한강 공원',
  address: '서울 서초구 반포동',
  detailedLocation: '주차장 앞',
  latitude: 37.5078,
  longitude: 126.9947,
  distance: 5,
  pace: 4,
  maxParticipants: 5,
  description: '함께 달려요',
  supplies: ['물'],
} satisfies components['schemas']['CreateScheduleRequest'];

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-15T09:00:00'));
  resetScheduleMocks();
});
afterEach(() => {
  server.resetHandlers();
  vi.useRealTimers();
});
afterAll(() => server.close());

function send(path: string, method = 'GET', body?: unknown) {
  return fetch(`${api}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
async function result(path: string) {
  const response = await send(path);
  expect(response.status).toBe(200);
  return (await response.json()).result;
}
async function expectError(
  path: string,
  method: string,
  code: string,
  body?: unknown,
  status = 400
) {
  const response = await send(path, method, body);
  expect(response.status).toBe(status);
  expect(await response.json()).toMatchObject({ code });
}

describe('일정 mock의 HTTP 상태 전이', () => {
  it('생성·수정·삭제를 목록, 홈, 달력, 상세에서 함께 확인할 수 있다', async () => {
    const created = await send(crew, 'POST', input);
    expect(created.status).toBe(200);
    expect(await created.json()).toEqual({
      code: 'SUCCESS',
      message: '요청에 성공했습니다.',
    });
    expect(await result(`${crew}?date=2026-11-18`)).toEqual([
      expect.objectContaining({
        scheduleId: 4,
        title: input.title,
        currentParticipants: 1,
        isMine: true,
        isParticipating: true,
      }),
    ]);
    expect(await result('/members/me/schedules')).toEqual([
      expect.objectContaining({ scheduleId: 1 }),
      expect.objectContaining({ scheduleId: 4 }),
    ]);
    expect(await result(`${crew}/4`)).toMatchObject({
      title: input.title,
      distance: 5,
      locationInfo: { placeName: input.locationName },
      participants: [expect.objectContaining({ memberId: 1, isCreator: true })],
    });

    const updated = {
      ...input,
      title: 'QA 수정',
      runType: 'LIGHTNING',
      meetingAt: '2026-11-19 11:00:00',
      distance: 7,
      pace: 6,
      supplies: ['모자'],
    };
    expect((await send(`${crew}/4`, 'PUT', updated)).status).toBe(200);
    expect(await result(`${crew}?date=2026-11-18`)).toEqual([]);
    expect(await result(`${crew}/4`)).toMatchObject({
      title: 'QA 수정',
      runType: 'LIGHTNING',
      distance: 7,
      pace: 6,
      supplies: ['모자'],
    });
    expect(
      await result(`${crew}/calendar?startDate=2026-11-18&endDate=2026-11-19`)
    ).toEqual([{ date: '2026-11-19', hasRegular: false, hasLightning: true }]);
    expect(await result('/members/me/schedules')).toContainEqual(
      expect.objectContaining({ scheduleId: 4, title: 'QA 수정', distance: 7 })
    );

    expect((await send(`${crew}/4`, 'DELETE')).status).toBe(200);
    expect(await result(`${crew}?date=2026-11-19`)).toEqual([]);
    expect(
      await result(`${crew}/calendar?startDate=2026-11-18&endDate=2026-11-19`)
    ).toEqual([]);
    expect(await result('/members/me/schedules')).toEqual([
      expect.objectContaining({ scheduleId: 1 }),
    ]);
    await expectError(`${crew}/4`, 'GET', 'ALREADY_CANCELLED_SCHEDULE');
    await expectError(`${crew}/4`, 'DELETE', 'ALREADY_CANCELLED_SCHEDULE');
  });

  it('참여·취소가 인원, 명단, 내 일정에 반영되며 중복 요청은 상태를 바꾸지 않는다', async () => {
    expect((await send(`${crew}/2/participate`, 'POST')).status).toBe(200);
    expect(await result(`${crew}/2`)).toMatchObject({
      currentParticipants: 2,
      isParticipating: true,
    });
    expect(await result(`${crew}?date=2026-11-20`)).toEqual([
      expect.objectContaining({
        scheduleId: 2,
        currentParticipants: 2,
        isParticipating: true,
      }),
    ]);
    expect(await result('/members/me/schedules')).toEqual([
      expect.objectContaining({ scheduleId: 1 }),
      expect.objectContaining({ scheduleId: 2 }),
    ]);
    const first = await result(`${crew}/2/participants?size=1`);
    expect(first).toMatchObject({
      content: [expect.objectContaining({ memberId: 2, isCreator: true })],
      hasNext: true,
      lastId: 2,
    });
    expect(
      await result(`${crew}/2/participants?size=1&cursorId=${first.lastId}`)
    ).toMatchObject({
      content: [expect.objectContaining({ memberId: 1, isCreator: false })],
      hasNext: false,
      lastId: 1,
    });
    await expectError(`${crew}/2/participate`, 'POST', 'ALREADY_PARTICIPATED');
    expect((await result(`${crew}/2`)).currentParticipants).toBe(2);
    expect((await send(`${crew}/2/participate`, 'DELETE')).status).toBe(200);
    expect(await result(`${crew}/2`)).toMatchObject({
      currentParticipants: 1,
      isParticipating: false,
    });
    expect(await result('/members/me/schedules')).toEqual([
      expect.objectContaining({ scheduleId: 1 }),
    ]);
    await expectError(
      `${crew}/2/participate`,
      'DELETE',
      'NOT_PARTICIPATING_SCHEDULE'
    );
    await expectError(
      `${crew}/1/participate`,
      'DELETE',
      'CREATOR_CANNOT_CANCEL_PARTICIPATION'
    );
  });

  it('날짜 우선순위와 런 종류, 월, 범위 및 크루 조건을 실제로 적용한다', async () => {
    expect(
      await result(
        `${crew}?date=2026-11-20&startDate=2026-11-16&endDate=2026-11-16&yearMonth=2026-12`
      )
    ).toEqual([expect.objectContaining({ scheduleId: 2 })]);
    expect(
      await result(
        `${crew}?startDate=2026-11-16&endDate=2026-11-16&yearMonth=2026-12`
      )
    ).toEqual([expect.objectContaining({ scheduleId: 1 })]);
    expect(await result(`${crew}?date=2026-11-20&runType=REGULAR`)).toEqual([]);
    expect(await result(`${crew}?yearMonth=2026-12`)).toEqual([]);
    expect(await result(`${crew}?startDate=2026-12-01`)).toHaveLength(2);
    expect(await result('/crews/2/schedules')).toEqual([
      expect.objectContaining({ scheduleId: 3, title: '새벽 달리기' }),
    ]);
    await expectError(`${crew}/3`, 'GET', 'SCHEDULE_NOT_FOUND', undefined, 404);
    await expectError(
      '/crews/99/schedules',
      'GET',
      'NOT_A_CREW_MEMBER',
      undefined,
      403
    );
  });

  it('같은 날짜의 두 런을 달력 마커 하나에 합치고 시간순으로 정렬한다', async () => {
    await send(crew, 'POST', { ...input, meetingAt: '2026-11-18 11:00:00' });
    await send(crew, 'POST', {
      ...input,
      title: '더 이른 번개런',
      runType: 'LIGHTNING',
    });
    expect(await result(`${crew}?date=2026-11-18`)).toEqual([
      expect.objectContaining({ scheduleId: 5 }),
      expect.objectContaining({ scheduleId: 4 }),
    ]);
    expect(
      await result(`${crew}/calendar?yearMonth=2026-11&runType=REGULAR`)
    ).toContainEqual({
      date: '2026-11-18',
      hasRegular: true,
      hasLightning: true,
    });
  });

  it('과거·잘못된 입력·60분 미만 충돌은 거절하고 실패 후 기존 데이터를 보존한다', async () => {
    await expectError(crew, 'POST', 'INVALID_SCHEDULE_TIME', {
      ...input,
      meetingAt: '2026-11-14 10:00:00',
    });
    await expectError(crew, 'POST', 'INVALID_INPUT_VALUE', {
      ...input,
      title: '',
    });
    await expectError(crew, 'POST', 'SCHEDULE_INTERVAL_TOO_CLOSE', {
      ...input,
      meetingAt: '2026-11-16 19:00:00',
    });
    expect(
      (await send(crew, 'POST', { ...input, meetingAt: '2026-11-16 18:30:00' }))
        .status
    ).toBe(200);
    await expectError(`${crew}/4`, 'PUT', 'SCHEDULE_INTERVAL_TOO_CLOSE', {
      ...input,
      meetingAt: '2026-11-16 19:00:00',
    });
    expect(await result(`${crew}/4`)).toMatchObject({
      meetingAt: '2026-11-16T18:30:00',
    });
    expect(await result(crew)).toHaveLength(3);
    await expectError(`${crew}?date=2026-02-30`, 'GET', 'INVALID_INPUT_VALUE');
    await expectError(`${crew}?runType=OTHER`, 'GET', 'INVALID_INPUT_VALUE');
  });

  it('타인 일정 변경과 일반 멤버의 정기런 생성을 거절하고 해당 크루에 번개런을 생성한다', async () => {
    await expectError(`${crew}/2`, 'PUT', 'FORBIDDEN_ERROR', input, 403);
    await expectError(`${crew}/2`, 'DELETE', 'FORBIDDEN_ERROR', undefined, 403);
    await expectError(
      '/crews/2/schedules',
      'POST',
      'ONLY_LEADER_CAN_CREATE_REGULAR_RUN',
      input,
      403
    );
    expect(
      (
        await send('/crews/2/schedules', 'POST', {
          ...input,
          runType: 'LIGHTNING',
        })
      ).status
    ).toBe(200);
    expect(await result('/crews/2/schedules/4')).toMatchObject({
      creatorRole: 'MEMBER',
      runType: 'LIGHTNING',
      isMine: true,
    });
    await expectError(`${crew}/4`, 'GET', 'SCHEDULE_NOT_FOUND', undefined, 404);
  });

  it('출석 시작 이후 변경과 신청 마감을 적용하고 초기화하면 생성 데이터가 사라진다', async () => {
    await send(crew, 'POST', input);
    vi.setSystemTime(new Date('2026-11-16T18:31:00'));
    await expectError(
      `${crew}/1`,
      'DELETE',
      'SCHEDULE_MODIFICATION_NOT_ALLOWED_TIME'
    );
    vi.setSystemTime(new Date('2026-11-20T08:01:00'));
    await expectError(
      `${crew}/2/participate`,
      'POST',
      'PARTICIPATION_AND_CANCEL_CLOSED'
    );
    resetScheduleMocks();
    expect(await result(crew)).toHaveLength(2);
    await expectError(`${crew}/4`, 'GET', 'SCHEDULE_NOT_FOUND', undefined, 404);
  });
});
