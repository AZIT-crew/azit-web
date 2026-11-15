import clsx from 'clsx';

import * as styles from '@/widgets/Notification/styles/NotificationListItem.css.ts';

import type { NotificationItem } from '@/entities/Notification/model/types';

interface NotificationListItemProps {
  item: NotificationItem;
  onClick: (item: NotificationItem) => void;
  disabled?: boolean;
  isOpening?: boolean;
}

export function NotificationListItem({
  item,
  onClick,
  disabled,
  isOpening,
}: NotificationListItemProps) {
  return (
    <button
      type="button"
      className={clsx(styles.itemContainer, !item.isRead && styles.unread)}
      disabled={disabled}
      aria-busy={isOpening || undefined}
      aria-label={`${item.isRead ? '읽음' : '읽지 않음'} ${item.kind === 'crew-schedule' ? `${item.runType === 'REGULAR' ? '정기런' : '번개런'} ${item.crewName}` : item.title} ${item.description} ${item.date}`}
      data-notification-id={item.id}
      onClick={() => onClick(item)}
    >
      <div className={styles.row}>
        <div className={styles.leftContent}>
          {item.kind === 'crew-schedule' ? (
            <img
              src={item.crewImageUrl}
              alt={item.crewName}
              className={styles.iconImage}
            />
          ) : (
            <img
              src="/icons/icon-notice-speaker.svg"
              alt=""
              className={styles.iconImage}
            />
          )}
          <div className={styles.textWrapper}>
            <div className={styles.titleRow}>
              {item.kind === 'crew-schedule' && item.runType && (
                <span
                  className={clsx(
                    styles.runTypeChip,
                    item.runType === 'REGULAR'
                      ? styles.runTypeChipRegular
                      : styles.runTypeChipLightning
                  )}
                >
                  {item.runType === 'REGULAR' ? '정기런' : '번개런'}
                </span>
              )}
              <span className={styles.titleText}>
                {item.kind === 'crew-schedule' ? item.crewName : item.title}
              </span>
            </div>
            <p className={styles.descriptionText}>{item.description}</p>
          </div>
        </div>
        <span className={styles.dateText}>
          {isOpening ? (
            <span className={styles.spinner} aria-hidden />
          ) : (
            item.date
          )}
        </span>
      </div>
    </button>
  );
}
