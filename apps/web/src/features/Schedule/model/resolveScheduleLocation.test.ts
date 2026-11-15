import { beforeEach, describe, expect, it, vi } from 'vitest';

import { reverseGeocode } from '@/shared/lib/naverGeocoding';

import { resolveScheduleLocation } from './resolveScheduleLocation';

vi.mock('@/shared/lib/naverGeocoding', () => ({ reverseGeocode: vi.fn() }));

const place = {
  placeName: '반포 한강 공원',
  address: '서울 서초구 반포동',
  latitude: 37.5078,
  longitude: 126.9947,
};
const moved = { lat: 37.507034, lng: 126.996202 };

beforeEach(() => {
  vi.resetAllMocks();
});

describe('집합 장소의 핀 좌표와 주소 저장', () => {
  it('핀을 움직이지 않으면 검색 결과의 주소와 좌표를 유지한다', async () => {
    const result = await resolveScheduleLocation(place, '집합지', null);
    expect(result.location).toMatchObject({
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      detailedLocation: '집합지',
    });
    expect(result.usedAddressFallback).toBe(false);
    expect(reverseGeocode).not.toHaveBeenCalled();
  });

  it('핀을 움직이면 주소와 좌표를 모두 이동 위치에 맞춘다', async () => {
    vi.mocked(reverseGeocode).mockResolvedValue('이동한 주소');
    const result = await resolveScheduleLocation(place, '집합지', moved);
    expect(reverseGeocode).toHaveBeenCalledWith(moved.lat, moved.lng);
    expect(result.location).toMatchObject({
      address: '이동한 주소',
      latitude: moved.lat,
      longitude: moved.lng,
    });
    expect(result.usedAddressFallback).toBe(false);
  });

  it('주소 변환 실패 시 검색 주소로 대체해도 이동 좌표는 유지한다', async () => {
    vi.mocked(reverseGeocode).mockRejectedValue(new Error('주소 변환 실패'));
    const result = await resolveScheduleLocation(place, '집합지', moved);
    expect(result.location).toMatchObject({
      address: place.address,
      latitude: moved.lat,
      longitude: moved.lng,
    });
    expect(result.usedAddressFallback).toBe(true);
  });

  it('변환된 주소가 빈 값이어도 이동 좌표를 버리지 않는다', async () => {
    vi.mocked(reverseGeocode).mockResolvedValue('   ');
    const result = await resolveScheduleLocation(place, '집합지', moved);
    expect(result.location).toMatchObject({
      address: place.address,
      latitude: moved.lat,
      longitude: moved.lng,
    });
    expect(result.usedAddressFallback).toBe(true);
  });
});
