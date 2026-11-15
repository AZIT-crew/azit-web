import { ChevronRightIcon } from '@azit/design-system/icon';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

import type { MenuItem as MenuItemType } from '@/shared/types/menu';

import * as styles from './MenuItem.css';

interface MenuItemProps {
  item: MenuItemType;
  onClick?: (item: MenuItemType) => void;
}

export function MenuItem({ item, onClick }: MenuItemProps) {
  const [statusLabel, setStatusLabel] = useState<string | null>(null);

  useEffect(() => {
    if (item.type !== 'action' || !item.getStatusLabel) return;

    const fetch = () => {
      item.getStatusLabel!()
        .then(setStatusLabel)
        .catch(() => {});
    };

    fetch();
    window.addEventListener('focus', fetch);
    return () => window.removeEventListener('focus', fetch);
  }, [item]);

  const handleClick = () => {
    if (item.disabled || item.isLoading) return;
    onClick?.(item);
  };

  if (item.type === 'info') {
    return (
      <div className={styles.item}>
        <span className={styles.label}>{item.label}</span>
        <span className={styles.infoValue}>{item.value}</span>
      </div>
    );
  }

  if (item.type === 'toggle') {
    return (
      <div className={styles.item}>
        <div className={styles.toggleTextWrapper}>
          <span className={styles.label}>{item.label}</span>
          {item.description && (
            <span className={styles.toggleDescription}>{item.description}</span>
          )}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={item.checked}
          disabled={item.disabled || item.isLoading}
          aria-busy={item.isLoading || undefined}
          aria-label={`${item.label} ${item.checked ? '켜짐' : '꺼짐'}`}
          className={clsx(
            styles.switchTrack,
            item.checked ? styles.switchTrackOn : styles.switchTrackOff
          )}
          onClick={() => {
            if (!item.disabled && !item.isLoading) item.onToggle(!item.checked);
          }}
        >
          <span
            className={clsx(
              styles.switchThumb,
              item.checked ? styles.switchThumbOn : styles.switchThumbOff
            )}
            aria-hidden
          >
            {item.isLoading && <span className={styles.pendingSpinner} />}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`${styles.item} ${styles.itemClickable}`}
      role="button"
      tabIndex={item.disabled || item.isLoading ? -1 : 0}
      aria-disabled={item.disabled || item.isLoading || undefined}
      aria-busy={item.isLoading || undefined}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <span className={styles.label}>{item.label}</span>
      {item.type === 'action' && item.getStatusLabel ? (
        <span className={styles.statusLabel}>{statusLabel ?? ''}</span>
      ) : (
        <span className={styles.rightGroup}>
          {item.type === 'navigation' && item.value && (
            <span className={styles.navValue}>{item.value}</span>
          )}
          {item.isLoading ? (
            <span className={styles.pendingSpinner} aria-hidden />
          ) : (
            <ChevronRightIcon size={20} className={styles.pushIcon} />
          )}
        </span>
      )}
    </div>
  );
}
