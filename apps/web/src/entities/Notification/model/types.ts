import type { RunType } from '@/shared/types/schedule';

export type NotificationCategory = 'all' | 'notice' | 'REGULAR' | 'LIGHTNING';

export type NotificationKind =
  | 'crew-schedule'
  | 'notice'
  | 'join-request'
  | 'join-approved'
  | 'join-rejected'
  | 'expelled'
  | 'marketing-consent'
  | 'term-update';

interface BaseNotificationItem {
  id: string;
  kind: NotificationKind;
  date: string;
  isRead: boolean;
}

export interface CrewScheduleNotificationItem extends BaseNotificationItem {
  kind: 'crew-schedule';
  crewId: number;
  crewName: string;
  crewImageUrl: string;
  runType: RunType;
  description: string;
  scheduleId: number;
}

export interface NoticeNotificationItem extends BaseNotificationItem {
  kind: Exclude<NotificationKind, 'crew-schedule'>;
  title: string;
  description: string;
  crewId?: number;
  noticeId?: number;
}

export type NotificationItem =
  | CrewScheduleNotificationItem
  | NoticeNotificationItem;

export interface NoticeDetail {
  noticeId: number;
  title: string;
  date: string;
  content: string;
}
