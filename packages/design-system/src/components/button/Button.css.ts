import { typography } from '../../shared/styles';
import { vars } from '../../shared/styles/theme.css';
import { recipe } from '@vanilla-extract/recipes';
import { keyframes, style } from '@vanilla-extract/css';

export type ButtonVariants = NonNullable<Parameters<typeof buttonVariant>[0]>;
export type ButtonSize = ButtonVariants['size'];
export type ButtonColor = ButtonVariants['state'];

export const buttonVariant = recipe({
  base: {
    borderRadius: 16,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    selectors: {
      '&:disabled': { cursor: 'not-allowed' },
    },
  },
  variants: {
    size: {
      large: [
        typography.body.b1,
        {
          height: 54,
        },
      ],
      medium: [
        typography.body.b2,
        {
          height: 44,
          borderRadius: 12,
        },
      ],
      small: [
        typography.body.b3,
        { height: 32, width: 'fit-content', padding: '0 12px' },
      ],
    },
    state: {
      kakao: {
        backgroundColor: '#FEE500',
        color: vars.colors.black,
        fontSize: 16,
        borderRadius: 12,
      },
      apple: {
        backgroundColor: vars.colors.white,
        color: vars.colors.black,
        fontSize: 16,
        borderRadius: 12,
      },
      active: { backgroundColor: vars.colors.blue80, color: vars.colors.white },
      outline: {
        backgroundColor: vars.colors.white,
        color: vars.colors.blue80,
        border: `1px solid ${vars.colors.blue80}`,
      },
      disabled: {
        backgroundColor: vars.colors.gray10,
        color: vars.colors.gray50,
      },
      disabled_outline: {
        backgroundColor: vars.colors.white,
        color: vars.colors.gray40,
        border: `1px solid ${vars.colors.gray20}`,
      },
    },
  },
  compoundVariants: [
    {
      variants: { size: 'small', state: 'active' },
      style: { backgroundColor: vars.colors.blue100 },
    },
  ],
  defaultVariants: {
    size: 'large',
    state: 'active',
  },
});

const spin = keyframes({
  to: { transform: 'rotate(360deg)' },
});

export const loadingButton = style({
  selectors: {
    '&:disabled': { cursor: 'progress' },
  },
});

export const loadingContent = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
});

export const loadingSpinner = style({
  width: '1em',
  height: '1em',
  flexShrink: 0,
  border: '2px solid currentColor',
  borderTopColor: 'transparent',
  borderRadius: '50%',
  animation: `${spin} 0.8s linear infinite`,
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
});
