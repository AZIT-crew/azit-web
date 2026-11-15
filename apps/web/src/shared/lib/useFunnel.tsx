import {
  useCallback,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

type StepProps<T extends string> = {
  name: T;
  render: (actions: {
    onNext: (context?: unknown) => void;
    onPrev: () => void;
  }) => ReactNode;
};

type FunnelProps<T extends string> = {
  children: ReactElement<StepProps<T>>[];
};

export const useFunnel = <T extends string>(
  initialStep: T,
  flow: Record<T, ((ctx: unknown) => T) | T | null>
) => {
  const [step, setStep] = useState<T>(initialStep);
  const [history, setHistory] = useState<T[]>([]);

  const onNext = useCallback(
    (name: T, ctx?: unknown) => {
      const next = flow[name];

      if (next == null) return;

      const nextStep = typeof next === 'function' ? next(ctx) : next;

      setHistory((prev) => [...prev, name]);
      setStep(nextStep);
    },
    [flow]
  );

  const onPrev = useCallback(() => {
    if (history.length === 0) return;

    setStep(history[history.length - 1]);
    setHistory((prev) => prev.slice(0, -1));
  }, [history]);

  // 부모의 mutation 상태 변경으로 현재 단계가 다시 마운트되지 않게 한다.
  const Funnel = useMemo(() => {
    const Step = ({ name, render }: StepProps<T>) => {
      return (
        <>
          {render({
            onNext: (ctx?: unknown) => onNext(name, ctx),
            onPrev,
          })}
        </>
      );
    };

    const Component = ({ children }: FunnelProps<T>) => {
      const currentStep = children.find((child) => child.props.name === step);
      return <>{currentStep}</>;
    };
    Component.Step = Step;
    return Component;
  }, [step, onNext, onPrev]);

  return { Funnel };
};
