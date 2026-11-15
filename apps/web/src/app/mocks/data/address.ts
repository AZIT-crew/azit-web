import type { MockResponse } from '../api';

export const mockAddressList = {
  code: 'SUCCESS',
  message: '요청에 성공했습니다.',
  result: [
    {
      id: 1,
      recipientName: '홍길동',
      phoneNumber: '010-1234-5678',
      zipcode: '06579',
      baseAddress: '서울 서초구 반포대로 45',
      detailAddress: '101동 302호',
      isDefault: true,
    },
    {
      id: 2,
      recipientName: '홍길동',
      phoneNumber: '010-1234-5678',
      zipcode: '05505',
      baseAddress: '서울 송파구 올림픽로 300',
      detailAddress: '1층',
      isDefault: false,
    },
  ],
} satisfies MockResponse<'get', '/api/v1/addresses'>;
