import type { ReissueTokenResult } from '@/shared/api/models/auth';

import type { ActivityName } from './types';

interface RouteAuthContext {
  currentActivity: ActivityName;
  requiresAuth: boolean;
  accessToken?: string;
  status?: ReissueTokenResult['status'];
  accountLinkCallback?: boolean;
}
export function getAuthRedirect({
  currentActivity,
  requiresAuth,
  accessToken,
  status,
  accountLinkCallback = false,
}: RouteAuthContext): ActivityName | null {
  if (
    currentActivity === 'SettingsTermDetailPage' ||
    currentActivity === 'NotFoundPage' ||
    (currentActivity === 'LoginRedirectPage' && !accountLinkCallback)
  )
    return null;
  if (!accessToken) return requiresAuth ? 'LoginPage' : null;
  if (status === 'PENDING_TERMS')
    return currentActivity === 'OnboardingTermAgreePage'
      ? null
      : 'OnboardingTermAgreePage';
  if (status !== 'ACTIVE') return requiresAuth ? 'LoginPage' : null;
  return currentActivity === 'LoginPage' ||
    currentActivity === 'OnboardingTermAgreePage'
    ? 'HomePage'
    : null;
}
