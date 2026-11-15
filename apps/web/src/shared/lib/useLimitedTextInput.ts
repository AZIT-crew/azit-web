import {
  useRef,
  useState,
  type ChangeEvent,
  type CompositionEvent,
  type ClipboardEvent,
  type FocusEvent,
} from 'react';

export function useLimitedTextInput({
  maxLength,
  initialValue = '',
  trimStart = false,
}: {
  maxLength: number;
  initialValue?: string;
  trimStart?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const acceptedValue = useRef(initialValue);
  const isComposing = useRef(false);
  const hasRejectedComposition = useRef(false);

  const acceptInput = (input: HTMLInputElement, composing: boolean) => {
    const raw = input.value;
    const withoutLeadingSpace = trimStart ? raw.trimStart() : raw;
    let next: string;

    if (
      withoutLeadingSpace.length > maxLength &&
      (composing || hasRejectedComposition.current)
    ) {
      // 조합 중 초과분을 slice하면 마지막 음절의 받침이 사라질 수 있다.
      // 초과 입력 전의 값을 보존하고, 허용 길이 내 조합은 그대로 갱신한다.
      hasRejectedComposition.current = true;
      next = acceptedValue.current;
    } else {
      next = withoutLeadingSpace.slice(0, maxLength);
      // 조합 종료 뒤 늦게 도착하는 초과 input도 실제 편집 전까지 무시한다.
      if (raw !== acceptedValue.current) hasRejectedComposition.current = false;
    }

    if (raw !== next) {
      const removedLeadingSpace = raw.length - withoutLeadingSpace.length;
      const start = input.selectionStart ?? next.length;
      const end = input.selectionEnd ?? start;
      input.value = next;
      input.setSelectionRange(
        Math.max(0, Math.min(next.length, start - removedLeadingSpace)),
        Math.max(0, Math.min(next.length, end - removedLeadingSpace))
      );
    }

    acceptedValue.current = next;
    setValue(next);
  };

  return {
    value,
    reset: (next = '') => {
      acceptedValue.current = next;
      isComposing.current = false;
      hasRejectedComposition.current = false;
      setValue(next);
    },
    maxLength,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      acceptInput(
        event.currentTarget,
        isComposing.current || (event.nativeEvent as InputEvent).isComposing
      );
    },
    onCompositionStart: (event: CompositionEvent<HTMLInputElement>) => {
      isComposing.current = true;
      hasRejectedComposition.current = false;
      // IME의 음절 갱신은 native maxlength로 막지 않고 위 입력 처리로 제한한다.
      event.currentTarget.removeAttribute('maxlength');
    },
    onCompositionEnd: (event: CompositionEvent<HTMLInputElement>) => {
      acceptInput(event.currentTarget, true);
      isComposing.current = false;
      event.currentTarget.maxLength = maxLength;
    },
    onBlur: (event: FocusEvent<HTMLInputElement>) => {
      if (isComposing.current) acceptInput(event.currentTarget, true);
      isComposing.current = false;
      event.currentTarget.maxLength = maxLength;
    },
    onPaste: (event: ClipboardEvent<HTMLInputElement>) => {
      hasRejectedComposition.current = false;
      const text = event.clipboardData?.getData('text');
      if (!text) return;

      event.preventDefault();
      const input = event.currentTarget;
      const current = acceptedValue.current;
      const start = input.selectionStart ?? current.length;
      const end = input.selectionEnd ?? start;
      const available = maxLength - current.length + end - start;
      const pastedText = text.replace(/[\r\n]/g, '');
      const insertion = (
        trimStart && start === 0 ? pastedText.trimStart() : pastedText
      ).slice(0, Math.max(0, available));
      input.value = current.slice(0, start) + insertion + current.slice(end);
      acceptInput(input, false);
      const cursor = Math.min(
        acceptedValue.current.length,
        start + insertion.length
      );
      input.setSelectionRange(cursor, cursor);
    },
  };
}
