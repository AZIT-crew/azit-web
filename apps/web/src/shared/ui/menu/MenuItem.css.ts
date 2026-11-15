import { vars, typography } from '@azit/design-system';
import { keyframes, style } from '@vanilla-extract/css';

import { listItemRow } from '@/shared/styles/listItemRow.css';

export const item = listItemRow;

export const itemClickable = style({
  cursor: 'pointer',
});

export const label = style([
  typography.body.b3,
  {
    color: vars.colors.gray70,
  },
]);

export const statusLabel = style([
  typography.body.b3,
  {
    color: vars.colors.gray50,
    marginLeft: 'auto',
    marginRight: '8px',
  },
]);

export const rightGroup = style({
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'flex-end',
  gap: 2,
});

export const navValue = style([
  typography.body.b3,
  {
    color: vars.colors.gray70,
  },
]);

export const infoValue = style([
  typography.body.b3,
  {
    color: vars.colors.blue80,
  },
]);

export const pushIcon = style({
  color: vars.colors.gray50,
});

export const toggleTextWrapper = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const toggleDescription = style({
  fontFamily: 'Inter',
  fontSize: 11,
  lineHeight: 'normal',
  color: '#888888',
});

export const switchTrack = style({
  position: 'relative',
  width: 42,
  height: 24,
  borderRadius: 9999,
  flexShrink: 0,
  transition: 'background-color 0.2s',
  cursor: 'pointer',
  border: 'none',
  padding: 0,
});

export const switchTrackOn = style({
  backgroundColor: vars.colors.blue80,
});

export const switchTrackOff = style({
  backgroundColor: vars.colors.gray20,
});

export const switchThumb = style({
  position: 'absolute',
  top: 2,
  width: 20,
  height: 20,
  borderRadius: '50%',
  backgroundColor: vars.colors.white,
  transition: 'transform 0.2s',
});

export const switchThumbOn = style({
  transform: 'translateX(20px)',
});

export const switchThumbOff = style({
  transform: 'translateX(2px)',
});

const spin = keyframes({ to: { transform: 'rotate(360deg)' } });
export const pendingSpinner = style({
  display: 'inline-block',
  width: 12,
  height: 12,
  margin: 4,
  boxSizing: 'border-box',
  border: `2px solid ${vars.colors.gray30}`,
  borderTopColor: vars.colors.blue80,
  borderRadius: '50%',
  animation: `${spin} 0.7s linear infinite`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});
