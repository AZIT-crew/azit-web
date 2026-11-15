import { useRef, useCallback } from 'react';

const DISMISS_DISTANCE_PX = 100;
const DISMISS_VELOCITY_PX_S = 500;
const EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';

interface TransitionStep {
  element: HTMLElement;
  keyframe: Keyframe;
  durationMs: number;
}

/**
 * Web Animations API로 여러 요소를 동시에 전환한다.
 * stop()은 현재 값을 인라인 스타일로 확정한 뒤 애니메이션을 취소한다.
 */
function runTransitions(steps: TransitionStep[]) {
  const animations = steps.map(({ element, keyframe, durationMs }) =>
    element.animate([keyframe], {
      duration: durationMs,
      easing: EASING,
      fill: 'forwards',
    })
  );

  let stopped = false;

  return {
    stop: () => {
      stopped = true;
      animations.forEach((animation) => {
        try {
          animation.commitStyles();
        } catch {
          // 요소가 detach된 경우 무시
        }
        animation.cancel();
      });
    },
    cancel: () => animations.forEach((animation) => animation.cancel()),
    /** 끝까지 재생되면 true, stop()으로 중단되면 false */
    finished: Promise.all(animations.map((a) => a.finished)).then(
      () => !stopped,
      () => false
    ),
  };
}

interface UseBottomSheetDragOptions {
  drawerRef: React.RefObject<HTMLDivElement | null>;
  overlayRef: React.RefObject<HTMLDivElement | null>;
  canDragRef: React.RefObject<boolean>;
  onDismiss: () => void;
  isDismissingByDragRef: { current: boolean };
  inProgressAnimationRef: { current: { stop: () => void } | null };
}

export function useBottomSheetDrag({
  drawerRef,
  overlayRef,
  canDragRef,
  onDismiss,
  isDismissingByDragRef,
  inProgressAnimationRef,
}: UseBottomSheetDragOptions) {
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const currentDyRef = useRef(0);
  const isDraggingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!canDragRef.current || !e.isPrimary) return;
      const drawer = drawerRef.current;
      if (!drawer) return;

      e.currentTarget.setPointerCapture(e.pointerId);
      isDraggingRef.current = true;
      startYRef.current = e.clientY;
      startTimeRef.current = performance.now();
      currentDyRef.current = 0;

      drawer.style.willChange = 'transform';
      drawer.style.transition = 'none';
      if (overlayRef.current) overlayRef.current.style.willChange = 'opacity';
      document.body.style.userSelect = 'none';
    },
    [canDragRef, drawerRef, overlayRef]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current || !e.isPrimary) return;
      currentDyRef.current = Math.max(0, e.clientY - startYRef.current);

      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const drawer = drawerRef.current;
        const overlay = overlayRef.current;
        if (!drawer) return;

        const dy = currentDyRef.current;
        drawer.style.transform = `translateY(${dy}px)`;

        if (overlay) {
          const progress = Math.min(1, dy / (drawer.offsetHeight * 0.75));
          overlay.style.opacity = String(1 - progress * 0.6);
        }
      });
    },
    [drawerRef, overlayRef]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current || !e.isPrimary) return;
      isDraggingRef.current = false;
      document.body.style.userSelect = '';

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      const drawer = drawerRef.current;
      const overlay = overlayRef.current;
      if (!drawer) return;

      const dy = currentDyRef.current;
      const elapsed = performance.now() - startTimeRef.current;
      const velocity = dy / (elapsed / 1000);
      const shouldDismiss =
        dy > DISMISS_DISTANCE_PX || velocity > DISMISS_VELOCITY_PX_S;

      if (shouldDismiss) {
        isDismissingByDragRef.current = true;
        const drawerHeight = drawer.offsetHeight;

        const steps: TransitionStep[] = [
          {
            element: drawer,
            keyframe: { transform: `translateY(${drawerHeight}px)` },
            durationMs: 250,
          },
        ];
        if (overlay) {
          steps.push({
            element: overlay,
            keyframe: { opacity: 0 },
            durationMs: 250,
          });
        }
        const controls = runTransitions(steps);
        inProgressAnimationRef.current = controls;

        controls.finished.then((completed) => {
          if (!completed) return;
          inProgressAnimationRef.current = null;
          onDismiss();
        });
      } else {
        const controls = runTransitions([
          {
            element: drawer,
            keyframe: { transform: 'translateY(0px)' },
            durationMs: 300,
          },
        ]);
        inProgressAnimationRef.current = controls;

        controls.finished.then((completed) => {
          if (!completed) return;
          controls.cancel();
          inProgressAnimationRef.current = null;
          drawer.style.transform = '';
          drawer.style.transition = '';
          drawer.style.willChange = '';
          if (overlay) {
            overlay.style.opacity = '';
            overlay.style.willChange = '';
          }
        });
      }
    },
    [
      drawerRef,
      overlayRef,
      onDismiss,
      isDismissingByDragRef,
      inProgressAnimationRef,
    ]
  );

  const handlePointerCancel = useCallback(
    (_e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      document.body.style.userSelect = '';

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      const drawer = drawerRef.current;
      const overlay = overlayRef.current;
      if (!drawer) return;

      drawer.style.transform = '';
      drawer.style.transition = '';
      drawer.style.willChange = '';
      if (overlay) {
        overlay.style.opacity = '';
        overlay.style.willChange = '';
      }
    },
    [drawerRef, overlayRef]
  );

  return {
    isDraggingRef,
    dragHandleProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
  };
}
