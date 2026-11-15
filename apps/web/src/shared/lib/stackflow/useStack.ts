import { actions, useFlow } from '@/app/routes/stackflow';
import type { ActivityName } from '@/app/routes/types';

export const useStack = () => {
  const { replace, pop: originalPop } = useFlow();

  const pop = (fallback?: ActivityName) => {
    const stack = actions.getStack();
    const visibleActivities = stack.activities.filter(
      (activity) => !activity.exitedBy
    );

    if (visibleActivities.length <= 1 && fallback) {
      replace(fallback, {});
      return;
    }

    originalPop();
  };

  return { pop };
};
