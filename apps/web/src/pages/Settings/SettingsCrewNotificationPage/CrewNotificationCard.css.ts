import { vars, typography } from '@azit/design-system';
import { keyframes, style } from '@vanilla-extract/css';

export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  width: '100%',
  padding: 20,
  borderRadius: 16,
  backgroundColor: vars.colors.white,
});

export const row = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
});

export const divider = style({
  width: '100%',
  height: '0.5px',
  minHeight: '0.5px',
  backgroundColor: vars.colors.gray20,
  border: 'none',
  flexShrink: 0,
});

export const crewInfo = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
});

export const crewImage = style({
  width: 44,
  height: 44,
  borderRadius: '50%',
  flexShrink: 0,
});

export const crewTextWrapper = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
});

export const crewName = style([
  typography.body.b3,
  {
    fontWeight: 500,
    color: vars.colors.gray70,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
]);

export const crewMeta = style([
  typography.body.b4,
  {
    color: vars.colors.gray50,
  },
]);

export const itemLabel = style([
  typography.body.b3,
  {
    color: vars.colors.gray70,
  },
]);

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
  selectors: { '&:disabled': { cursor: 'default' } },
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
