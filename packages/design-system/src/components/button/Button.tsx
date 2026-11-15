import type { ButtonHTMLAttributes, ReactNode } from 'react';
import {
  buttonVariant,
  loadingButton,
  loadingContent,
  loadingSpinner,
  type ButtonSize,
  type ButtonColor,
} from './Button.css';
import clsx from 'clsx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  width?: string;
  size?: ButtonSize;
  state?: ButtonColor;
  isLoading?: boolean;
  children: ReactNode;
  onClick?: () => void;
}

export function Button({
  width,
  size,
  state,
  isLoading = false,
  disabled = false,
  children,
  type = 'button',
  onClick,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading || state === 'disabled';
  const visualState = disabled && !isLoading ? 'disabled' : state;

  return (
    <button
      type={type}
      className={clsx(
        buttonVariant({ size, state: visualState }),
        isLoading && loadingButton,
        className
      )}
      style={width ? { width } : undefined}
      onClick={onClick}
      {...props}
      disabled={isDisabled}
      aria-busy={isLoading ? true : props['aria-busy']}
    >
      {isLoading ? (
        <span className={loadingContent}>
          <span className={loadingSpinner} aria-hidden="true" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
