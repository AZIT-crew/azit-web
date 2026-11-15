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
import { setMockProvidersForQa } from './state/member';
import { resetScheduleMocks } from './state/schedules';

const server = setupServer(...handlers);
const api = 'https://mock-api.azitcrew.com/api/v1';
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  localStorage.clear();
  resetMemberMocks();
  resetScheduleMocks();
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
async function send(path: string, method = 'GET', body?: unknown) {
  const response = await fetch(api + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

describe('회원·설정 mock 상태', () => {
  it('프로필 변경을 내 정보·크루 멤버·일정 생성자와 참여자에 함께 반영한다', async () => {
    const imageUrl = 'https://cdn.example.com/default/default_2.svg';
    expect(
      (
        await send('/members/me/profile', 'PATCH', {
          nickname: 'QA프로필',
          imageUrl,
        })
      ).status
    ).toBe(200);
    expect((await send('/members/me')).body.result).toMatchObject({
      nickname: 'QA프로필',
      profileImageUrl: imageUrl,
    });
    const members = (await send('/crews/1/members')).body.result.content;
    expect(members[0]).toMatchObject({
      memberId: 1,
      nickname: 'QA프로필',
      profileImageUrl: imageUrl,
    });
    expect(members[1].nickname).toBe('멤버1');
    const detail = (await send('/crews/1/schedules/1')).body.result;
    expect(detail).toMatchObject({
      creatorNickname: 'QA프로필',
      creatorProfileImageUrl: imageUrl,
    });
    expect(
      (await send('/crews/1/schedules/1/participants')).body.result.content[0]
    ).toMatchObject({ nickname: 'QA프로필', profileImageUrl: imageUrl });
    await send('/crews/2/schedules/3/participate', 'POST');
    expect(
      (
        await send('/crews/2/schedules/3/participants')
      ).body.result.content.find((p: { memberId: number }) => p.memberId === 1)
        .nickname
    ).toBe('QA프로필');
  });
  it('잘못된 닉네임·이미지는 저장하지 않고 기존 프로필을 유지한다', async () => {
    for (const nickname of ['', '가'.repeat(11), 'ㄱㄴ', 'QA@', 'QA 공백'])
      expect(
        (
          await send('/members/me/profile', 'PATCH', {
            nickname,
            imageUrl: '/icons/icon-crew-default.svg',
          })
        ).status
      ).toBe(400);
    expect(
      (
        await send('/members/me/profile', 'PATCH', {
          nickname: 'QA',
          imageUrl: 'javascript:alert(1)',
        })
      ).status
    ).toBe(400);
    expect((await send('/members/me')).body.result.nickname).toBe('테스터');
  });
  it('선택 약관은 부분 갱신·변경 일시를 저장하고 빈 요청은 거절한다', async () => {
    const changed = (
      await send('/members/me/terms/optional', 'PATCH', {
        notificationAgreed: false,
      })
    ).body.result;
    expect(changed.notification.agreed).toBe(false);
    expect(changed.notification.changedAt).toMatch(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
    );
    expect(changed.marketing).toEqual({ agreed: false, changedAt: null });
    expect((await send('/members/me/terms/optional')).body.result).toEqual(
      changed
    );
    expect((await send('/members/me/terms/optional', 'PATCH', {})).status).toBe(
      400
    );
    expect(
      (
        await send('/members/me/terms/optional', 'PATCH', {
          notificationAgreed: null,
          marketingAgreed: null,
        })
      ).status
    ).toBe(400);
  });
  it('복수 연동 해제 후 목록을 갱신하고 마지막 로그인 수단은 보호한다', async () => {
    setMockProvidersForQa([
      {
        provider: 'KAKAO',
        providerName: '카카오',
        isLinked: true,
        isUnlinkable: true,
        email: 'qa@kakao.com',
        linkedAt: '2026-01-01',
      },
      {
        provider: 'APPLE',
        providerName: '애플',
        isLinked: true,
        isUnlinkable: true,
        email: 'qa@apple.com',
        linkedAt: '2026-01-02',
      },
    ]);
    expect((await send('/auth/social-accounts/APPLE', 'DELETE')).status).toBe(
      200
    );
    const providers = (await send('/members/me/providers')).body.result
      .providers;
    expect(providers[1]).toMatchObject({
      isLinked: false,
      isUnlinkable: false,
    });
    expect(providers[0].isUnlinkable).toBe(false);
    expect(
      (await send('/auth/social-accounts/KAKAO', 'DELETE')).body.code
    ).toBe('CANNOT_UNLINK_LAST_PROVIDER');
    expect(
      (await send('/auth/social-accounts/APPLE', 'DELETE')).body.code
    ).toBe('PROVIDER_NOT_LINKED');
    expect((await send('/members/me')).body.result.nickname).toBe('테스터');
  });
  it('멤버가 없는 리더 크루라도 서비스 탈퇴를 막고 일반 멤버는 탈퇴한다', async () => {
    await send('/crews/1/members/2', 'DELETE');
    expect((await send('/members/me/withdraw', 'POST')).body.code).toBe(
      'CANNOT_SERVICE_WITHDRAW_AS_LEADER'
    );
    expect((await send('/auth/reissue', 'POST')).status).toBe(200);
    await send('/crews/1', 'DELETE');
    expect((await send('/members/me/withdraw', 'POST')).status).toBe(200);
    expect((await send('/auth/reissue', 'POST')).status).toBe(401);
  });
});
