import { useEffect } from 'react';

interface ScrollLock {
  count: number;
  overflow: string;
  priority: string;
}

const locks = new WeakMap<HTMLElement, ScrollLock>();

/** Keep the original body style until the last visible sheet closes or unmounts. */
export function useBodyScrollLock(isVisible: boolean) {
  useEffect(() => {
    if (!isVisible) return;

    const body = document.body;
    let lock = locks.get(body);
    if (!lock) {
      lock = {
        count: 0,
        overflow: body.style.getPropertyValue('overflow'),
        priority: body.style.getPropertyPriority('overflow'),
      };
      locks.set(body, lock);
      body.style.setProperty('overflow', 'hidden');
    }
    lock.count += 1;

    return () => {
      lock.count -= 1;
      if (lock.count > 0) return;

      if (lock.overflow) {
        body.style.setProperty('overflow', lock.overflow, lock.priority);
      } else {
        body.style.removeProperty('overflow');
      }
      locks.delete(body);
    };
  }, [isVisible]);
}
