import * as styles from '@/widgets/Notification/styles/NotificationFilterTab.css';

import type { NotificationCategory } from '@/entities/Notification/model/types';

interface NotificationFilterTabProps {
  activeFilter: NotificationCategory;
  onFilterChange: (filter: NotificationCategory) => void;
}

const FILTERS: { label: string; value: NotificationCategory }[] = [
  { label: '전체', value: 'all' },
  { label: '공지', value: 'notice' },
  { label: '정기런', value: 'REGULAR' },
  { label: '번개런', value: 'LIGHTNING' },
];

export function NotificationFilterTab({
  activeFilter,
  onFilterChange,
}: NotificationFilterTabProps) {
  return (
    <div className={styles.tabsContainer}>
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          aria-pressed={activeFilter === filter.value}
          className={
            activeFilter === filter.value
              ? styles.activeTab
              : styles.inactiveTab
          }
          onClick={() => onFilterChange(filter.value)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
