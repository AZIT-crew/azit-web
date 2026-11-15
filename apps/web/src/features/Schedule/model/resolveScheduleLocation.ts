import type { LocationSearchResponse } from '@/entities/Location/model/location.model';

import { reverseGeocode } from '@/shared/lib/naverGeocoding';
import type { LatLng } from '@/shared/ui/naver-map/NaverMap';

export async function resolveScheduleLocation(
  selected: LocationSearchResponse,
  meetingSpot: string,
  adjustedCoords: LatLng | null
) {
  const location = {
    address: selected.address ?? '',
    locationName: selected.placeName ?? '',
    detailedLocation: meetingSpot,
    latitude: adjustedCoords?.lat ?? selected.latitude ?? 0,
    longitude: adjustedCoords?.lng ?? selected.longitude ?? 0,
  };

  if (!adjustedCoords) return { location, usedAddressFallback: false };

  try {
    const address = (
      await reverseGeocode(adjustedCoords.lat, adjustedCoords.lng)
    ).trim();
    if (address) {
      return { location: { ...location, address }, usedAddressFallback: false };
    }
  } catch {
    // 주소 변환 실패 시에도 사용자가 지정한 핀 좌표는 유지한다.
  }
  return { location, usedAddressFallback: true };
}
