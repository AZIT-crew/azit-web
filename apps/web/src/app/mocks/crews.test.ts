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
import { resetScheduleMocks } from './state/schedules';

const server = setupServer(...handlers);
const api = 'https://mock-api.azitcrew.com/api/v1';
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetMemberMocks();
  resetScheduleMocks();
});
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

describe('크루 mock 상태와 조회 일관성', () => {
  const createBody = {
    name: 'QA생성크루',
    category: 'RUNNING',
    region: 'SEOUL',
  };
  it('생성한 크루를 리더로 가입시키고 고유 코드·상세·멤버·가입 크루를 연결한다', async () => {
    const created = await send('/crews', 'POST', createBody);
    expect(created.status).toBe(200);
    const code = created.body.result.invitationCode;
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
    expect(code).not.toBe('HAN001');
    const mine = (await send('/members/me/crews')).body.result.at(-1);
    expect(mine).toMatchObject({
      crewId: 4,
      crewName: createBody.name,
      memberRole: 'LEADER',
      memberStatus: 'JOINED',
      invitationCode: code,
    });
    expect((await send('/crews/4/info')).body.result.name).toBe(
      createBody.name
    );
    expect((await send('/crews/4/members')).body.result).toMatchObject({
      totalCount: 1,
      content: [expect.objectContaining({ memberId: 1, role: 'LEADER' })],
    });
    expect((await send('/crews/invitation/' + code)).body.result).toMatchObject(
      { crewId: 4, category: 'RUNNING', memberCount: 1 }
    );
    expect((await send('/crews/me')).body.result).toHaveLength(3);
    expect((await send('/crews', 'POST', createBody)).body.code).toBe(
      'CREW_JOIN_LIMIT_EXCEEDED'
    );
    expect(
      (await send('/crews/join', 'POST', { invitationCode: 'NOON03' })).body
        .code
    ).toBe('CREW_JOIN_LIMIT_EXCEEDED');
  });
  it('잘못된 생성·초대 코드 입력과 이미 가입한 크루의 중복 신청을 거절한다', async () => {
    expect(
      (await send('/crews', 'POST', { ...createBody, name: 'QA 크루' })).body
        .code
    ).toBe('INVALID_CREW_NAME_CHARACTERS');
    expect(
      (await send('/crews', 'POST', { ...createBody, name: '가'.repeat(16) }))
        .body.code
    ).toBe('INVALID_INPUT_VALUE');
    expect(
      (await send('/crews', 'POST', { ...createBody, region: 'INVALID' })).body
        .code
    ).toBe('INVALID_INPUT_VALUE');
    expect(
      (await send('/crews/join', 'POST', { invitationCode: 'INVALID' })).body
        .code
    ).toBe('CREW_NOT_FOUND');
    expect(
      (await send('/crews/join', 'POST', { invitationCode: 'HAN001' })).body
        .code
    ).toBe('ALREADY_JOINED_CREW');
    expect((await send('/members/me/crews')).body.result).toHaveLength(2);
  });
  it('가입 신청·취소를 목록과 가입 상태에 반영하고 1시간 후 재신청을 허용한다', async () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1800000000000);
    await send('/crews/join', 'POST', { invitationCode: 'NOON03' });
    expect((await send('/members/me/crews')).body.result.at(-1)).toMatchObject({
      crewId: 3,
      memberStatus: 'REQUESTED',
    });
    expect((await send('/crews/3/join-status')).body.result.status).toBe(
      'REQUESTED'
    );
    expect((await send('/crews/me')).body.result).toHaveLength(2);
    expect((await send('/crews/3/members')).status).toBe(403);
    expect(
      (await send('/crews/join', 'POST', { invitationCode: 'NOON03' })).body
        .code
    ).toBe('ALREADY_JOINED_CREW');
    expect((await send('/crews/3/join-request', 'DELETE')).status).toBe(200);
    expect((await send('/members/me/crews')).body.result).toHaveLength(2);
    expect((await send('/crews/3/join-status')).body.result.status).toBe(
      'CANCELLED'
    );
    expect((await send('/crews/3/join-request', 'DELETE')).body.code).toBe(
      'JOIN_REQUEST_NOT_FOUND'
    );
    expect(
      (await send('/crews/join', 'POST', { invitationCode: 'NOON03' })).body
        .code
    ).toBe('CANCEL_REJOINING_COOLDOWN');
    clock.mockReturnValue(1800000000000 + 60 * 60 * 1000);
    expect(
      (await send('/crews/join', 'POST', { invitationCode: 'NOON03' })).status
    ).toBe(200);
  });
  it('거절 후 재신청·승인 결과를 내 크루·가입 상태·멤버 조회에서 일치시킨다', async () => {
    await send('/crews/join', 'POST', { invitationCode: 'NOON03' });
    resolveMockJoinRequest(3, false);
    expect((await send('/crews/3/join-status')).body.result.status).toBe(
      'REJECTED'
    );
    expect(
      (await send('/members/me/crews')).body.result.at(-1).memberStatus
    ).toBe('REJECTED');
    expect(
      (await send('/crews/invitation/NOON03')).body.result.memberCount
    ).toBe(1);
    await send('/crews/join', 'POST', { invitationCode: 'NOON03' });
    resolveMockJoinRequest(3, true);
    expect((await send('/crews/3/join-status')).body.result.status).toBe(
      'JOINED'
    );
    expect((await send('/crews/me')).body.result.at(-1).crewId).toBe(3);
    expect((await send('/crews/3/members')).body.result.totalCount).toBe(2);
    expect(
      (await send('/crews/invitation/NOON03')).body.result.memberCount
    ).toBe(2);
    expect(
      (await send('/crews/3/join-requests/1/approve', 'POST')).status
    ).toBe(403);
  });
  it('자진 탈퇴 후 같은 크루의 24시간 재가입 제한을 적용한다', async () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1800000000000);
    await send('/crews/2/members/me', 'DELETE');
    expect(
      (await send('/crews/join', 'POST', { invitationCode: 'DAWN02' })).body
        .code
    ).toBe('EXIT_REJOINING_COOLDOWN');
    clock.mockReturnValue(1800000000000 + 24 * 60 * 60 * 1000);
    expect(
      (await send('/crews/join', 'POST', { invitationCode: 'DAWN02' })).status
    ).toBe(200);
  });
  it('재발급한 코드를 내 크루에 반영하고 이전 초대 코드는 무효화한다', async () => {
    const response = await send('/crews/1/invitation-code', 'POST');
    const code = response.body.result.invitationCode;
    expect(code).toHaveLength(6);
    expect(code).not.toBe('HAN001');
    expect(
      (await send('/members/me/crews')).body.result[0].invitationCode
    ).toBe(code);
    expect((await send('/crews/invitation/HAN001')).body.code).toBe(
      'INVALID_INVITATION_CODE'
    );
    expect((await send('/crews/invitation/' + code)).body.result.crewId).toBe(
      1
    );
    expect((await send('/crews/2/invitation-code', 'POST')).status).toBe(403);
  });

  it('수정한 크루 정보는 상세·내 크루·가입 크루에서 일치하고 다른 크루를 변경하지 않는다', async () => {
    expect(
      (
        await send('/crews/1/info', 'PATCH', {
          name: 'QA크루',
          imageUrl: '/qa.png',
          description: 'QA 소개',
        })
      ).status
    ).toBe(200);
    expect((await send('/crews/1/info')).body.result).toEqual({
      name: 'QA크루',
      crewImageUrl: '/qa.png',
      description: 'QA 소개',
    });
    expect((await send('/members/me/crews')).body.result[0].crewName).toBe(
      'QA크루'
    );
    expect((await send('/crews/me')).body.result[0]).toMatchObject({
      name: 'QA크루',
      imageUrl: '/qa.png',
      description: 'QA 소개',
    });
    expect((await send('/crews/2/info')).body.result.name).toBe(
      '새벽 달리기 모임'
    );
    await send('/crews/1/info', 'PATCH', {
      name: 'QA크루',
      imageUrl: '/qa.png',
    });
    expect((await send('/crews/1/info')).body.result.description).toBe('');
    expect(
      (await send('/crews/1/info', 'PATCH', { name: '', imageUrl: '/qa.png' }))
        .status
    ).toBe(400);
    expect(
      (
        await send('/crews/1/info', 'PATCH', {
          name: '@invalid',
          imageUrl: '/qa.png',
        })
      ).body.code
    ).toBe('INVALID_CREW_NAME_CHARACTERS');
    expect(
      (
        await send('/crews/2/info', 'PATCH', {
          name: '권한없음',
          imageUrl: '/qa.png',
        })
      ).status
    ).toBe(403);
  });

  it('가입 승인 후 요청은 사라지고 멤버와 인원수가 갱신되며 중복 승인하지 않는다', async () => {
    expect(
      (await send('/crews/1/join-requests/3/approve', 'POST')).status
    ).toBe(200);
    expect((await send('/crews/1/join-requests')).body.result).toEqual([]);
    const members = (await send('/crews/1/members')).body.result;
    expect(members.totalCount).toBe(3);
    expect(
      members.content.map((member: { memberId: number }) => member.memberId)
    ).toEqual([1, 2, 3]);
    expect(
      (await send('/crews/invitation/HAN001')).body.result.memberCount
    ).toBe(3);
    expect(
      (await send('/crews/1/join-requests/3/approve', 'POST')).status
    ).toBe(404);
    await send('/crews/1/members/3', 'DELETE');
    expect((await send('/crews/1/members')).body.result.totalCount).toBe(2);
    expect((await send('/crews/1/members/3', 'DELETE')).status).toBe(400);
  });

  it('거절한 가입 요청은 사라지며 멤버로 추가되지 않는다', async () => {
    await send('/crews/1/join-requests/3/reject', 'POST');
    expect((await send('/crews/1/join-requests')).body.result).toEqual([]);
    expect((await send('/crews/1/members')).body.result.totalCount).toBe(2);
  });

  it('크루별 역할을 구분하고 멤버 ID와 다른 크루 멤버 ID로 페이지를 이어간다', async () => {
    const first = (await send('/crews/2/members?size=1')).body.result;
    expect(first.content[0]).toMatchObject({
      memberId: 2,
      id: 22,
      role: 'LEADER',
    });
    expect(first.hasNext).toBe(true);
    const next = (
      await send('/crews/2/members?size=1&cursorId=' + first.lastId)
    ).body.result;
    expect(next.content[0]).toMatchObject({
      memberId: 1,
      id: 21,
      role: 'MEMBER',
    });
    expect(next.hasNext).toBe(false);
    expect((await send('/crews/2/join-requests')).status).toBe(403);
    expect((await send('/crews/2/members/2', 'DELETE')).status).toBe(403);
    expect((await send('/crews/1/members/1', 'DELETE')).body.code).toBe(
      'CANNOT_KICK_SELF'
    );
  });

  it('탈퇴하면 내 크루·가입 크루·내 일정에서 제외하고 리더 탈퇴는 막는다', async () => {
    await send('/crews/2/schedules/3/participate', 'POST');
    expect(
      (await send('/members/me/schedules')).body.result.map(
        (item: { scheduleId: number }) => item.scheduleId
      )
    ).toContain(3);
    expect((await send('/crews/2/members/me', 'DELETE')).status).toBe(200);
    expect(
      (await send('/members/me/crews')).body.result.map(
        (item: { crewId: number }) => item.crewId
      )
    ).toEqual([1]);
    expect(
      (await send('/crews/me')).body.result.map(
        (item: { crewId: number }) => item.crewId
      )
    ).toEqual([1]);
    expect(
      (await send('/members/me/schedules')).body.result.map(
        (item: { scheduleId: number }) => item.scheduleId
      )
    ).not.toContain(3);
    expect((await send('/crews/2/members')).status).toBe(403);
    expect((await send('/crews/1/members/me', 'DELETE')).body.code).toBe(
      'CANNOT_WITHDRAW_AS_LEADER'
    );
  });

  it('해산한 크루는 목록·내 일정·초대 코드 조회에서 사라진다', async () => {
    expect((await send('/crews/2', 'DELETE')).status).toBe(403);
    expect((await send('/crews/1', 'DELETE')).status).toBe(200);
    expect(
      (await send('/members/me/crews')).body.result.map(
        (item: { crewId: number }) => item.crewId
      )
    ).toEqual([2]);
    expect(
      (await send('/crews/me')).body.result.map(
        (item: { crewId: number }) => item.crewId
      )
    ).toEqual([2]);
    expect((await send('/members/me/schedules')).body.result).toEqual([]);
    expect((await send('/crews/invitation/HAN001')).status).toBe(404);
  });

  it('출석 로그·달력·통계에 같은 월과 크루 조건을 적용한다', async () => {
    const one = (
      await send('/members/me/attendances?yearMonth=2026-11&crewId=1')
    ).body.result;
    const two = (
      await send('/members/me/attendances?yearMonth=2026-11&crewId=2')
    ).body.result;
    expect(one).toMatchObject({ totalAttendanceCount: 2, totalPoints: 200 });
    expect(one.attendanceLogs).toHaveLength(3);
    expect(two).toMatchObject({ totalAttendanceCount: 1, totalPoints: 100 });
    expect(
      two.attendanceLogs.map((log: { crewName: string }) => log.crewName)
    ).toEqual(['새벽 달리기 모임']);
    expect(
      (
        await send(
          '/members/me/attendances/calendar?yearMonth=2026-11&crewId=2'
        )
      ).body.result
    ).toEqual([{ date: '2026-11-03', hasRegular: false, hasLightning: true }]);
    expect(
      (await send('/members/me/attendances?yearMonth=2026-11')).body.result
        .attendanceLogs
    ).toHaveLength(4);
    expect(
      (await send('/members/me/attendances?yearMonth=2026-12&crewId=2')).body
        .result
    ).toEqual({ attendanceLogs: [], totalAttendanceCount: 0, totalPoints: 0 });
    expect(
      (await send('/members/me/attendances?yearMonth=2026-13')).status
    ).toBe(400);
  });
});
