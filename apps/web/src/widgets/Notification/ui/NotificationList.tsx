import { useMemo, useState } from 'react';

import * as styles from '@/widgets/Notification/styles/NotificationList.css.ts';

import { filterNotifications } from '@/entities/Notification/model/filter';
import type {
  NotificationCategory,
  NotificationItem,
} from '@/entities/Notification/model/types';

import { NotificationFilterTab } from './NotificationFilterTab';
import { NotificationListItem } from './NotificationListItem';

interface NotificationListProps {
  items: NotificationItem[];
  onItemClick: (item: NotificationItem) => void;
  disabled?: boolean;
  openingId?: string | null;
}

export function NotificationList({
  items,
  onItemClick,
  disabled,
  openingId,
}: NotificationListProps) {
  const [activeFilter, setActiveFilter] = useState<NotificationCategory>('all');

  const filteredNotifications = useMemo(
    () => filterNotifications(items, activeFilter),
    [activeFilter, items]
  );

  return (
    <div className={styles.listContainer}>
      <div className={styles.filterContainer}>
        <NotificationFilterTab
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>

      <div className={styles.itemsContainer}>
        {filteredNotifications.map((item) => (
          <NotificationListItem
            key={item.id}
            item={item}
            onClick={onItemClick}
            disabled={disabled}
            isOpening={openingId === item.id}
          />
        ))}
        {filteredNotifications.length === 0 && (
          <p role="status" className={styles.empty}>
            해당하는 알림이 없어요
          </p>
        )}
      </div>
    </div>
  );
}
