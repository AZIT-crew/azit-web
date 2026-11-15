import type { MockHandler } from '../api';
import { addressHandlers } from './address';
import { authHandlers } from './auth';
import { crewHandlers } from './crew';
import { locationHandlers } from './location';
import { memberHandlers } from './member';
import { scheduleHandlers } from './schedule';

export const handlers = [
  ...authHandlers,
  ...memberHandlers,
  ...crewHandlers,
  ...scheduleHandlers,
  ...addressHandlers,
  ...locationHandlers,
] satisfies MockHandler[];
