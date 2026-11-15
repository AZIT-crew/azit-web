import type { ReactNode } from 'react';

import { useFlow } from '@/app/routes/stackflow';

import type { ScheduleListItem as ScheduleListItemType } from '@/entities/Schedule/model/schedule.types';
import * as styles from '@/entities/Schedule/styles/ScheduleList.css.ts';
import { ScheduleListItem } from '@/entities/Schedule/ui/ScheduleListItem';

interface ScheduleListProps {
  items: ScheduleListItemType[];
  emptyState: ReactNode;
  isLoading?: boolean;
  crewId?: number;
  onSelect?: (item: ScheduleListItemType) => void;
}

export function ScheduleList({
  items,
  emptyState,
  isLoading,
  crewId,
  onSelect,
}: ScheduleListProps) {
  const { push } = useFlow();

  const handleClickItem = (item: ScheduleListItemType) => {
    if (onSelect) return onSelect(item);
    push('ScheduleDetailPage', {
      id: item.scheduleId,
      ...(crewId ? { crewId } : {}),
    });
  };

  const renderItem = () => {
    if (items.length === 0 || isLoading) return emptyState;

    return items.map((item) => (
      <ScheduleListItem
        key={item.scheduleId}
        item={item}
        handleClick={() => handleClickItem(item)}
      />
    ));
  };

  return <div className={styles.listContainer}>{renderItem()}</div>;
}
