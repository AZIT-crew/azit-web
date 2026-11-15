import type { NotificationItem } from './types';

type Destination =
  | {
      activityName: 'ScheduleDetailPage';
      params: { id: number; crewId: number };
    }
  | {
      activityName: 'CrewMemberManagePage';
      params: { id: string; initialTab: 'request' };
    }
  | { activityName: 'CrewPage'; params: { id: string } }
  | { activityName: 'Mypage' | 'SettingsPage'; params: Record<string, never> }
  | { activityName: 'NoticeDetailPage'; params: { noticeId: string } }
  | { activityName: 'SettingsTermDetailPage'; params: { termType: string } };
export type NotificationCrewAccess = { crewId: number; leaderOnly?: boolean };
export type NotificationTarget = Destination & {
  crewAccess?: NotificationCrewAccess;
};
const validId = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

export function getNotificationTarget(
  item: NotificationItem
): NotificationTarget | null {
  switch (item.kind) {
    case 'crew-schedule':
      return validId(item.crewId) && validId(item.scheduleId)
        ? {
            activityName: 'ScheduleDetailPage',
            params: { id: item.scheduleId, crewId: item.crewId },
            crewAccess: { crewId: item.crewId },
          }
        : null;
    case 'join-request':
      return validId(item.crewId)
        ? {
            activityName: 'CrewMemberManagePage',
            params: { id: String(item.crewId), initialTab: 'request' },
            crewAccess: { crewId: item.crewId, leaderOnly: true },
          }
        : null;
    case 'join-approved':
      return validId(item.crewId)
        ? {
            activityName: 'CrewPage',
            params: { id: String(item.crewId) },
            crewAccess: { crewId: item.crewId },
          }
        : null;
    case 'join-rejected':
    case 'expelled':
      return { activityName: 'Mypage', params: {} };
    case 'marketing-consent':
      return { activityName: 'SettingsPage', params: {} };
    case 'notice':
      return validId(item.noticeId)
        ? {
            activityName: 'NoticeDetailPage',
            params: { noticeId: String(item.noticeId) },
          }
        : null;
    case 'term-update':
      return {
        activityName: 'SettingsTermDetailPage',
        params: { termType: 'terms-of-service' },
      };
    default:
      return null;
  }
}
export function canAccessNotificationCrew(
  access: NotificationCrewAccess,
  crews: readonly {
    crewId: number;
    memberStatus: string;
    memberRole: string | null;
  }[]
) {
  return crews.some(
    (crew) =>
      crew.crewId === access.crewId &&
      crew.memberStatus === 'JOINED' &&
      (!access.leaderOnly || crew.memberRole === 'LEADER')
  );
}
