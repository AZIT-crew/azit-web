import { typography, vars } from '@azit/design-system';
import { style } from '@vanilla-extract/css';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16,
  width: '100%',
  padding: '24px 12px',
  boxSizing: 'border-box',
  textAlign: 'center',
});

export const message = style([
  typography.body.b2,
  { color: vars.colors.gray60 },
]);
