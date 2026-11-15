import { queryOptions } from '@tanstack/react-query';

import {
  getPreviewNotifications,
  getPreviewNotice,
  getPreviewNotices,
} from './previewRepository';

export const notificationPreviewQueries = {
  all: ['notification-preview'] as const,
  listKey: () => [...notificationPreviewQueries.all, 'list'] as const,
  noticesKey: () => [...notificationPreviewQueries.all, 'notices'] as const,
  noticeKey: (id: number) =>
    [...notificationPreviewQueries.noticesKey(), id] as const,
  list: () =>
    queryOptions({
      queryKey: notificationPreviewQueries.listKey(),
      queryFn: getPreviewNotifications,
      staleTime: 0,
      retry: false,
    }),
  notices: () =>
    queryOptions({
      queryKey: notificationPreviewQueries.noticesKey(),
      queryFn: getPreviewNotices,
      staleTime: 0,
      retry: false,
    }),
  notice: (id: number) =>
    queryOptions({
      queryKey: notificationPreviewQueries.noticeKey(id),
      queryFn: () => getPreviewNotice(id),
      staleTime: 0,
      retry: false,
    }),
};
