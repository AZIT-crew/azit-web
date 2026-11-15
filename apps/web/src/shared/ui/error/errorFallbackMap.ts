export interface FallbackConfig {
  message: string;
  label: string;
  action: 'reset' | 'replace';
  navigateTo?: string;
}

export const ERROR_FALLBACK_MAP: Record<string, FallbackConfig> = {
  ALREADY_CANCELLED_SCHEDULE: {
    message: '삭제된 일정이에요',
    label: '다른 일정 확인하기',
    action: 'replace',
    navigateTo: 'SchedulePage',
  },
  NOT_A_CREW_MEMBER: {
    message: '현재 가입되어 있지 않은 크루예요',
    label: '내 크루 확인하기',
    action: 'replace',
    navigateTo: 'Mypage',
  },
  SCHEDULE_NOT_FOUND: {
    message: '일정을 찾을 수 없어요',
    label: '다른 일정 확인하기',
    action: 'replace',
    navigateTo: 'SchedulePage',
  },
  FORBIDDEN_ERROR: {
    message: '접근 권한이 없어요',
    label: '홈으로 가기',
    action: 'replace',
    navigateTo: 'HomePage',
  },
};

export const DEFAULT_FALLBACK: FallbackConfig = {
  message: '페이지를 찾을 수 없어요',
  label: '홈으로 가기',
  action: 'replace',
  navigateTo: 'HomePage',
};
