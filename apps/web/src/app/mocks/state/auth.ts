import type { ReissueTokenResult } from '@/shared/api/models/auth';
const key = '__mock_auth_status__';
type MockAuthStatus = ReissueTokenResult['status'] | 'LOGGED_OUT';
export function getMockAuthStatus(): MockAuthStatus {
  const value = localStorage.getItem(key);
  return value === 'PENDING_TERMS' ||
    value === 'WITHDRAWN' ||
    value === 'DELETED' ||
    value === 'LOGGED_OUT'
    ? value
    : 'ACTIVE';
}
export function setMockAuthStatus(status: MockAuthStatus) {
  localStorage.setItem(key, status);
}
