import { auth } from '@/shared/api/apiClient';

// 크루 생성·가입은 회원 상태를 바꾸지 않는다. 성공마다 RTR 쿠키를 재교환하지 않는다.
// 가입 약관 완료의 상태 갱신은 해당 화면에서 이동과 함께 처리한다.
export const onboarding = auth;
