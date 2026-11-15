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
import { resetAddressMocks } from './state/addresses';
import { resetScheduleMocks } from './state/schedules';

const server = setupServer(...handlers);
const api = 'https://mock-api.azitcrew.com/api/v1';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  localStorage.clear();
  resetMemberMocks();
  resetScheduleMocks();
  resetAddressMocks();
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function send(path: string, method = 'GET', body?: unknown) {
  return fetch(`${api}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('MSW API contracts', () => {
  it('설정에 필요한 두 동의 항목과 변경일을 반환한다', async () => {
    const response = await send('/members/me/terms/optional');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.result).toEqual({
      marketing: { agreed: false, changedAt: null },
      notification: { agreed: true, changedAt: null },
    });
  });

  it('선택 약관 PATCH는 전체 응답을 반환하고 다음 조회에 변경을 유지한다', async () => {
    const response = await send('/members/me/terms/optional', 'PATCH', {
      marketingAgreed: true,
    });
    const patched = await response.json();
    expect(patched.result.marketing.agreed).toBe(true);
    expect(patched.result.marketing.changedAt).toEqual(expect.any(String));
    expect(patched.result.notification).toEqual({
      agreed: true,
      changedAt: null,
    });
    const fetched = await (await send('/members/me/terms/optional')).json();
    expect(fetched).toEqual(patched);
    const empty = await send('/members/me/terms/optional', 'PATCH', {
      marketingAgreed: null,
    });
    expect(empty.status).toBe(400);
    expect((await empty.json()).code).toBe('INVALID_INPUT_VALUE');
  });

  it('출석 달력과 출석 로그를 같은 월의 데이터로 반환한다', async () => {
    const calendar = await (
      await send('/members/me/attendances/calendar?yearMonth=2026-11&crewId=1')
    ).json();
    expect(Array.isArray(calendar.result)).toBe(true);
    expect(calendar.result).toEqual([
      { date: '2026-11-01', hasRegular: true, hasLightning: false },
      { date: '2026-11-05', hasRegular: false, hasLightning: true },
      { date: '2026-11-10', hasRegular: true, hasLightning: false },
    ]);
    const logs = await (
      await send('/members/me/attendances?yearMonth=2026-11&crewId=1')
    ).json();
    expect(logs.result).toMatchObject({
      totalAttendanceCount: 2,
      totalPoints: 200,
    });
    expect(logs.result.attendanceLogs).toHaveLength(3);
    const empty = await (
      await send('/members/me/attendances/calendar?yearMonth=2026-12&crewId=1')
    ).json();
    expect(empty.result).toEqual([]);
  });

  it('일정 달력은 상세 조회 라우트와 구분되고 날짜별 마커를 반환한다', async () => {
    const calendar = await (await send('/crews/1/schedules/calendar')).json();
    const list = await (await send('/crews/1/schedules')).json();
    expect(calendar.result).toEqual(
      list.result.map((schedule: { meetingAt: string; runType: string }) => ({
        date: schedule.meetingAt.slice(0, 10),
        hasRegular: schedule.runType === 'REGULAR',
        hasLightning: schedule.runType === 'LIGHTNING',
      }))
    );
    const home = await (await send('/members/me/schedules')).json();
    const detail = await (await send('/crews/1/schedules/1')).json();
    expect(home.result[0].pace).toBe(detail.result.pace);
    expect(detail.result.currentParticipants).toBe(
      detail.result.participants.length
    );
  });

  it('크루 조회별로 계약에 맞는 이름과 이미지 필드를 반환한다', async () => {
    const joined = await (await send('/crews/me')).json();
    expect(joined.result[0]).toMatchObject({
      name: '한강 러너스',
      imageUrl: expect.any(String),
    });
    const invitation = await (await send('/crews/invitation/HAN001')).json();
    expect(invitation.result).toMatchObject({
      name: '한강 러너스',
      category: 'RUNNING',
      memberCount: 2,
    });
    const info = await (await send('/crews/1/info')).json();
    expect(info.result).toMatchObject({
      name: '한강 러너스',
      crewImageUrl: expect.any(String),
    });
    const created = await (
      await send('/crews', 'POST', {
        name: 'QA크루',
        category: 'RUNNING',
        region: 'SEOUL',
      })
    ).json();
    expect(created.result.invitationCode).toHaveLength(6);
  });

  it('장소 검색은 검색어와 일치하는 장소명 및 좌표를 반환한다', async () => {
    const body = await (
      await send('/locations/search?query=%EB%B0%98%ED%8F%AC')
    ).json();
    expect(body.result).toEqual([
      expect.objectContaining({
        placeName: '반포 한강 공원',
        latitude: expect.any(Number),
        longitude: expect.any(Number),
      }),
    ]);
    const empty = await (await send('/locations/search?query=unknown')).json();
    expect(empty.result).toEqual([]);
  });

  it('소셜 로그인은 POST로 처리하며 로그아웃 후 재발급은 401이다', async () => {
    const response = await send('/auth/social-login/KAKAO', 'POST', {
      accessToken: 'qa-token',
    });
    expect(response.status).toBe(200);
    const login = await response.json();
    expect(login.result).toMatchObject({
      accessToken: expect.any(String),
      accessTokenExpiresIn: 3600,
      status: 'ACTIVE',
    });
    expect(login.result).not.toHaveProperty('refreshToken');
    await send('/auth/logout', 'POST');
    const reissue = await send('/auth/reissue', 'POST');
    expect(reissue.status).toBe(401);
    expect(await reissue.json()).toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('프로필 수정 성공 후 다시 조회하면 수정된 프로필을 반환한다', async () => {
    const response = await send('/members/me/profile', 'PATCH', {
      nickname: '테스터QA',
      imageUrl: '/icons/icon-crew-default.svg',
    });
    expect(response.status).toBe(200);
    const body = await (await send('/members/me')).json();
    expect(body.result.nickname).toBe('테스터QA');
  });

  it('Void 생성 API는 계약에 없는 식별자를 반환하지 않는다', async () => {
    for (const path of ['/addresses']) {
      const response = await send(path, 'POST', {
        recipientName: 'QA',
        phoneNumber: '010-1234-5678',
        zipcode: '06579',
        baseAddress: '서울 서초구 반포대로 45',
        detailAddress: '1층',
        isDefault: false,
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        code: 'SUCCESS',
        message: '요청에 성공했습니다.',
      });
    }
  });
});
