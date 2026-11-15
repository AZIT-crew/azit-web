import { vars, typography } from '@azit/design-system';
import { style } from '@vanilla-extract/css';

import { layoutStyles } from '@/shared/styles/layout.css';

export const headerWrapper = style([layoutStyles.headerWrapper]);

export const mainContainer = style([
  layoutStyles.mainContainer,
  {
    backgroundColor: 'transparent',
    display: 'block',
  },
]);

// Keep padding off the scrollport: affected WebKit versions exclude it from
// scrollHeight on flex columns (https://bugs.webkit.org/show_bug.cgi?id=316902).
export const contentWrapper = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  width: '100%',
  padding: '20px 20px 100px',
});

export const buttonContainer = style({
  display: 'flex',
  width: '100%',
  gap: 0,
});

export const logoutButtonWrapper = style({
  width: '50%',
  display: 'flex',
  justifyContent: 'center',
});

export const withdrawButtonWrapper = style({
  width: '50%',
  display: 'flex',
  justifyContent: 'center',
});

export const logoutButton = style([
  typography.body.b3,
  {
    width: 'fit-content',
    padding: '4px',
    textAlign: 'center',
    color: vars.colors.gray50,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
]);
