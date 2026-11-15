import { describe, expect, it } from 'vitest';

import { filterNotifications } from './filter';
import { mockNotificationList } from './previewFixtures';
import { canAccessNotificationCrew, getNotificationTarget } from './target';
import type { NotificationItem } from './types';

const base = {
  id: 'qa',
  date: '11월 15일',
  isRead: false,
  title: 'QA 알림',
  description: 'QA 내용',
};
describe('알림 이동 대상과 권한', () => {
  it('다른 크루의 일정 ID와 crewId를 함께 전달한다', () => {
    expect(getNotificationTarget(mockNotificationList[2]!)).toEqual({
      activityName: 'ScheduleDetailPage',
      params: { id: 3, crewId: 2 },
      crewAccess: { crewId: 2 },
    });
  });
  it('필수 대상 ID가 없거나 잘못되면 undefined 경로를 만들지 않는다', () => {
    expect(getNotificationTarget({ ...base, kind: 'join-request' })).toBeNull();
    expect(getNotificationTarget({ ...base, kind: 'notice' })).toBeNull();
    expect(
      getNotificationTarget({ ...base, kind: 'notice', noticeId: -1 })
    ).toBeNull();
    const schedule = mockNotificationList[0]!;
    if (schedule.kind !== 'crew-schedule') throw new Error('fixture');
    for (const id of [0, -1, NaN, Infinity, 1.5])
      expect(getNotificationTarget({ ...schedule, crewId: id })).toBeNull();
  });
  it('가입 요청은 요청 탭으로 이동하고 리더 권한을 요구한다', () => {
    expect(
      getNotificationTarget({ ...base, kind: 'join-request', crewId: 1 })
    ).toEqual({
      activityName: 'CrewMemberManagePage',
      params: { id: '1', initialTab: 'request' },
      crewAccess: { crewId: 1, leaderOnly: true },
    });
    expect(
      getNotificationTarget({ ...base, kind: 'join-approved', crewId: 2 })
    ).toEqual({
      activityName: 'CrewPage',
      params: { id: '2' },
      crewAccess: { crewId: 2 },
    });
  });
  it('탈퇴·대기·일반 멤버를 구분하고 정회원도 관리 화면은 리더만 허용한다', () => {
    const crews = [
      { crewId: 1, memberStatus: 'JOINED', memberRole: 'LEADER' },
      { crewId: 2, memberStatus: 'JOINED', memberRole: 'MEMBER' },
      { crewId: 3, memberStatus: 'REQUESTED', memberRole: null },
      { crewId: 4, memberStatus: 'EXITED', memberRole: 'MEMBER' },
    ];
    expect(
      canAccessNotificationCrew({ crewId: 1, leaderOnly: true }, crews)
    ).toBe(true);
    expect(canAccessNotificationCrew({ crewId: 2 }, crews)).toBe(true);
    expect(
      canAccessNotificationCrew({ crewId: 2, leaderOnly: true }, crews)
    ).toBe(false);
    expect(canAccessNotificationCrew({ crewId: 3 }, crews)).toBe(false);
    expect(canAccessNotificationCrew({ crewId: 4 }, crews)).toBe(false);
  });
  it('거절·방출·마케팅·약관·공지는 각각 맞는 화면으로 이동한다', () => {
    for (const kind of ['join-rejected', 'expelled'] as const)
      expect(getNotificationTarget({ ...base, kind })?.activityName).toBe(
        'Mypage'
      );
    expect(
      getNotificationTarget({ ...base, kind: 'marketing-consent' })
        ?.activityName
    ).toBe('SettingsPage');
    expect(
      getNotificationTarget({ ...base, kind: 'term-update' })?.activityName
    ).toBe('SettingsTermDetailPage');
    expect(
      getNotificationTarget({ ...base, kind: 'notice', noticeId: 1 })
    ).toEqual({ activityName: 'NoticeDetailPage', params: { noticeId: '1' } });
  });
  it('공지 필터에 가입 요청 등 시스템 알림을 섞지 않고 런 종류도 분리한다', () => {
    const items: NotificationItem[] = [
      ...mockNotificationList,
      { ...base, kind: 'join-request', crewId: 1 },
    ];
    expect(filterNotifications(items, 'all')).toHaveLength(5);
    expect(filterNotifications(items, 'notice').map((item) => item.id)).toEqual(
      ['4']
    );
    expect(
      filterNotifications(items, 'REGULAR').map((item) => item.id)
    ).toEqual(['1']);
    expect(
      filterNotifications(items, 'LIGHTNING').map((item) => item.id)
    ).toEqual(['2', '3']);
  });
});
