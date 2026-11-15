import { http } from 'msw';

import { mockApi, type MockHandler } from './api';
import { mockSuccess } from './data/crew';

// 앱 typecheck/build에 포함된다. 이 함수는 실행하지 않는다.
// 계약 검사가 느슨해지면 @ts-expect-error가 사용되지 않아 빌드가 실패한다.
export function checkMockContracts() {
  // @ts-expect-error 계약 검사 없이 만든 MSW 핸들러는 등록할 수 없음
  const untypedHandler: MockHandler = http.get(
    '/api/v1/members/me',
    () => new Response()
  );
  void untypedHandler;
  // @ts-expect-error OpenAPI에 없는 경로
  mockApi.get('/api/v1/unknown', () => mockSuccess);
  // @ts-expect-error 소셜 로그인은 POST만 지원
  mockApi.get('/api/v1/auth/social-login/{provider}', () => mockSuccess);
  // @ts-expect-error 약관 응답에서 result를 생략할 수 없음
  mockApi.get('/api/v1/members/me/terms/optional', () => mockSuccess);
  mockApi.get('/api/v1/members/me/terms/optional', () => ({
    ...mockSuccess,
    // @ts-expect-error 예전 mock의 평탄한 약관 구조를 거부
    result: { isMarketingAgreed: false },
  }));
  mockApi.get('/api/v1/members/me/attendances/calendar', () => ({
    ...mockSuccess,
    // @ts-expect-error 출석 달력의 result는 객체가 아닌 배열
    result: { attendanceDates: [] },
  }));
  mockApi.post('/api/v1/addresses', () => ({
    ...mockSuccess,
    // @ts-expect-error 주소 생성은 Void 응답이며 임의의 ID를 반환하지 않음
    result: { id: 3 },
  }));
  mockApi.patch('/api/v1/members/me/terms/optional', async ({ request }) => {
    const body = await request.json();
    // @ts-expect-error 요청 필드명도 OpenAPI 계약에 연결됨
    void body.isMarketingAgreed;
    return {
      ...mockSuccess,
      result: {
        marketing: { agreed: false, changedAt: null },
        notification: { agreed: true, changedAt: null },
      },
    };
  });
}
