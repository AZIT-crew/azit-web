import dayjs from 'dayjs';

import type { NoticeDetail, NotificationItem } from './types';

export const mockNoticeDetails: Record<number, NoticeDetail> = {
  1: {
    noticeId: 1,
    title: '크루명크루명크루명',
    date: dayjs().format('M월 D일'),
    content: '상세 내용을 확인하고 참가 신청하세요!',
  },
};

export const mockNotificationList: NotificationItem[] = [
  {
    id: '1',
    kind: 'crew-schedule',
    date: dayjs().format('M월 D일'),
    isRead: false,
    crewId: 1,
    crewName: '한강 러너스',
    crewImageUrl: '/icons/icon-crew-default.svg',
    runType: 'REGULAR',
    description: '상세 내용을 확인하고 참가 신청하세요!',
    scheduleId: 1,
  },
  {
    id: '2',
    kind: 'crew-schedule',
    date: dayjs().format('M월 D일'),
    isRead: false,
    crewId: 1,
    crewName: '한강 러너스',
    crewImageUrl: '/icons/icon-crew-default.svg',
    runType: 'LIGHTNING',
    description: '상세 내용을 확인하고 참가 신청하세요!',
    scheduleId: 2,
  },
  {
    id: '3',
    kind: 'crew-schedule',
    date: dayjs().format('M월 D일'),
    isRead: true,
    crewId: 2,
    crewName: '새벽 달리기 모임',
    crewImageUrl: '/icons/icon-crew-default.svg',
    runType: 'LIGHTNING',
    description: '상세 내용을 확인하고 참가 신청하세요!',
    scheduleId: 3,
  },
  {
    id: '4',
    kind: 'notice',
    date: dayjs().format('M월 D일'),
    isRead: true,
    title: '크루명크루명크루명',
    description: '상세 내용을 확인하고 참가 신청하세요!',
    noticeId: 1,
  },
];
