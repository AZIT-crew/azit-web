import type { MockResponse } from '../api';

export const mockLocationSearch = {
  code: 'SUCCESS',
  message: '요청에 성공했습니다.',
  result: [
    {
      placeName: '반포 한강 공원',
      category: '공원',
      address: '서울 서초구 반포동',
      latitude: 37.5078,
      longitude: 126.9947,
    },
    {
      placeName: '올림픽 공원',
      category: '공원',
      address: '서울 송파구 올림픽로 424',
      latitude: 37.5207,
      longitude: 127.1215,
    },
    {
      placeName: '광화문역 5호선',
      category: '지하철, 전철',
      address: '서울 종로구 세종대로 172',
      latitude: 37.5716,
      longitude: 126.9769,
    },
  ],
} satisfies MockResponse<'get', '/api/v1/locations/search'>;
