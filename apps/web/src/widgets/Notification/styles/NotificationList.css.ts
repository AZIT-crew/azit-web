import { vars } from '@azit/design-system';
import { style } from '@vanilla-extract/css';

export const listContainer = style({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
});

export const filterContainer = style({
  position: 'sticky',
  top: 0,
  backgroundColor: vars.colors.white,
  padding: '16px 20px',
});

export const itemsContainer = style({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
});

export const empty = style({
  textAlign: 'center',
  padding: 32,
  color: vars.colors.gray60,
});
