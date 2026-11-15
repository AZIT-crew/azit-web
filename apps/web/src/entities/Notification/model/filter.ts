import type { NotificationCategory, NotificationItem } from './types';

export function filterNotifications(
  items: NotificationItem[],
  category: NotificationCategory
) {
  if (category === 'all') return items;
  if (category === 'notice')
    return items.filter((item) => item.kind === 'notice');
  return items.filter(
    (item) => item.kind === 'crew-schedule' && item.runType === category
  );
}
