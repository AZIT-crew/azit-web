import type { SocialLoginResult } from '@/shared/api/models/auth';
import type { AuthDestination } from '@/shared/store/auth';

export function getAuthDestination(
  status: SocialLoginResult['status']
): AuthDestination {
  return status === 'PENDING_TERMS'
    ? 'OnboardingTermAgreePage'
    : status === 'ACTIVE'
      ? 'HomePage'
      : 'LoginPage';
}
