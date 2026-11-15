import { z } from 'zod';

export const MEETING_SPOT_MAX_LENGTH = 15;

export const meetingSpotSchema = z
  .string()
  .max(
    MEETING_SPOT_MAX_LENGTH,
    `세부 장소는 ${MEETING_SPOT_MAX_LENGTH}자 이내로 입력해주세요`
  )
  .trim()
  .min(1, '세부 장소를 입력해주세요');
