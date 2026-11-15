import { describe, expect, it } from 'vitest';

import { getAuthRedirect } from './authPolicy';
import type { ActivityName } from './types';
describe('회원 상태와 경로 접근', () => {
  it.each([
    'HomePage',
    'HomeNotificationPage',
    'SchedulePage',
    'Mypage',
    'AddressSettingPage',
    'OnboardingPage',
    'OnboardingCompletePage',
    'AppleLinkRedirectPage',
  ] as const)('로그아웃이면 %s에 진입하지 않는다', (currentActivity) =>
    expect(getAuthRedirect({ currentActivity, requiresAuth: true })).toBe(
      'LoginPage'
    )
  );
  it.each([
    'SettingsTermDetailPage',
    'NotFoundPage',
    'LoginRedirectPage',
  ] as const)(
    '공개 경로 %s는 로그인/약관 여부로 막지 않는다',
    (currentActivity) => {
      expect(
        getAuthRedirect({ currentActivity, requiresAuth: false })
      ).toBeNull();
      expect(
        getAuthRedirect({
          currentActivity,
          requiresAuth: false,
          accessToken: 'token',
          status: 'PENDING_TERMS',
        })
      ).toBeNull();
    }
  );
  it('약관 대기 회원은 서비스 진입 대신 필수 동의 화면으로 간다', () => {
    expect(
      getAuthRedirect({
        currentActivity: 'Mypage',
        requiresAuth: true,
        accessToken: 'token',
        status: 'PENDING_TERMS',
      })
    ).toBe('OnboardingTermAgreePage');
    expect(
      getAuthRedirect({
        currentActivity: 'OnboardingTermAgreePage',
        requiresAuth: true,
        accessToken: 'token',
        status: 'PENDING_TERMS',
      })
    ).toBeNull();
  });
  it('ACTIVE 회원의 추가 크루 온보딩/상세 URL은 유지하고 로그인·가입 약관 진입은 홈으로 보낸다', () => {
    for (const currentActivity of [
      'OnboardingPage',
      'ScheduleDetailPage',
      'SettingsPage',
    ] as ActivityName[])
      expect(
        getAuthRedirect({
          currentActivity,
          requiresAuth: true,
          accessToken: 'token',
          status: 'ACTIVE',
        })
      ).toBeNull();
    for (const currentActivity of [
      'LoginPage',
      'OnboardingTermAgreePage',
    ] as ActivityName[])
      expect(
        getAuthRedirect({
          currentActivity,
          requiresAuth: true,
          accessToken: 'token',
          status: 'ACTIVE',
        })
      ).toBe('HomePage');
  });
  it.each(['WITHDRAWN', 'DELETED'] as const)(
    '%s 회원은 보호 화면에 진입하지 않는다',
    (status) =>
      expect(
        getAuthRedirect({
          currentActivity: 'Mypage',
          requiresAuth: true,
          accessToken: 'token',
          status,
        })
      ).toBe('LoginPage')
  );
  it('계정 연동 콜백은 일반 로그인 콜백과 달리 현재 회원 인증을 요구한다', () => {
    expect(
      getAuthRedirect({
        currentActivity: 'LoginRedirectPage',
        requiresAuth: true,
        accountLinkCallback: true,
      })
    ).toBe('LoginPage');
    expect(
      getAuthRedirect({
        currentActivity: 'LoginRedirectPage',
        requiresAuth: true,
        accountLinkCallback: true,
        accessToken: 'token',
        status: 'PENDING_TERMS',
      })
    ).toBe('OnboardingTermAgreePage');
    expect(
      getAuthRedirect({
        currentActivity: 'LoginRedirectPage',
        requiresAuth: true,
        accountLinkCallback: true,
        accessToken: 'token',
        status: 'ACTIVE',
      })
    ).toBeNull();
  });
});
