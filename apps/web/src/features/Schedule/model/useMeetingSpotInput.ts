import { MEETING_SPOT_MAX_LENGTH } from '@/entities/Schedule/model/meetingSpot';

import { useLimitedTextInput } from '@/shared/lib/useLimitedTextInput';

export function useMeetingSpotInput() {
  const { reset: _reset, ...input } = useLimitedTextInput({
    maxLength: MEETING_SPOT_MAX_LENGTH,
    trimStart: true,
  });
  return input;
}
