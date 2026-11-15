import type { RouteConfig } from '@/app/routes/types';
import { lazyImport } from '@/app/routes/utils';

/**
 * 네비게이션 1탭 페이지는 Eager 로딩을 적용해요.
 */
import { HomePage } from '@/pages/Home/HomePage';
import { LoginPage } from '@/pages/Login/LoginPage';
import { LoginRedirectPage } from '@/pages/Login/LoginRedirectPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SchedulePage } from '@/pages/Schedule/SchedulePage';

const AppleLinkRedirectPage = lazyImport(
  () => import('@/pages/Login/AppleLinkRedirectPage'),
  'AppleLinkRedirectPage'
);
const OnboardingTermAgreePage = lazyImport(
  () => import('@/pages/Onboarding/OnboardingTermAgreePage'),
  'OnboardingTermAgreePage'
);
const OnboardingPage = lazyImport(
  () => import('@/pages/Onboarding/OnboardingPage'),
  'OnboardingPage'
);
const OnboardingCompletePage = lazyImport(
  () => import('@/pages/Onboarding/OnboardingCompletePage'),
  'OnboardingCompletePage'
);
const UserPage = lazyImport(() => import('@/pages/User/UserPage'), 'UserPage');
const CrewBannedStatusPage = lazyImport(
  () => import('@/pages/Crew/CrewBannedStatusPage'),
  'CrewBannedStatusPage'
);
const ScheduleDetailPage = lazyImport(
  () => import('@/pages/Schedule/ScheduleDetailPage'),
  'ScheduleDetailPage'
);
const ScheduleEditPage = lazyImport(
  () => import('@/pages/Schedule/ScheduleEditPage'),
  'ScheduleEditPage'
);
const ScheduleMembersPage = lazyImport(
  () => import('@/pages/Schedule/ScheduleMembersPage'),
  'ScheduleMembersPage'
);
const ScheduleCreatePage = lazyImport(
  () => import('@/pages/Schedule/ScheduleCreatePage'),
  'ScheduleCreatePage'
);
const HomeNotificationPage = lazyImport(
  () => import('@/pages/Home/HomeNotificationPage'),
  'HomeNotificationPage'
);
const NoticeDetailPage = lazyImport(
  () => import('@/pages/Home/NoticeDetailPage'),
  'NoticeDetailPage'
);
const NoticeListPage = lazyImport(
  () => import('@/pages/Home/NoticeListPage'),
  'NoticeListPage'
);

const AttendancePage = lazyImport(
  () => import('@/pages/Crew/CrewAttendancePage'),
  'CrewAttendancePage'
);
const AddressSettingPage = lazyImport(
  () => import('@/pages/Address/AddressSettingPage'),
  'AddressSettingPage'
);
const AddressRegisterPage = lazyImport(
  () => import('@/pages/Address/AddressRegisterPage'),
  'AddressRegisterPage'
);
const AddressSearchPage = lazyImport(
  () => import('@/pages/Address/AddressSearchPage'),
  'AddressSearchPage'
);
const AddressEditPage = lazyImport(
  () => import('@/pages/Address/AddressEditPage'),
  'AddressEditPage'
);
const SettingsTermDetailPage = lazyImport(
  () => import('@/pages/Settings/SettingsTermDetailPage'),
  'SettingsTermDetailPage'
);
const CrewMemberManagePage = lazyImport(
  () => import('@/pages/Crew/CrewMemberManagePage'),
  'CrewMemberManagePage'
);
const CrewMemberViewPage = lazyImport(
  () => import('@/pages/Crew/CrewMemberViewPage'),
  'CrewMemberViewPage'
);
const UserProfileEditPage = lazyImport(
  () => import('@/pages/User/UserProfileEditPage'),
  'UserProfileEditPage'
);
const CrewInfoEditPage = lazyImport(
  () => import('@/pages/Crew/CrewInfoEditPage'),
  'CrewInfoEditPage'
);
const ScheduleLocationPage = lazyImport(
  () => import('@/pages/Schedule/ScheduleLocationPage'),
  'ScheduleLocationPage'
);
const CrewPage = lazyImport(() => import('@/pages/Crew/CrewPage'), 'CrewPage');
const SettingsPage = lazyImport(
  () => import('@/pages/Settings/SettingsPage'),
  'SettingsPage'
);
const SettingsLoginInfoPage = lazyImport(
  () => import('@/pages/Settings/SettingsLoginInfoPage'),
  'SettingsLoginInfoPage'
);
const SettingsCrewNotificationPage = lazyImport(
  () => import('@/pages/Settings/SettingsCrewNotificationPage'),
  'SettingsCrewNotificationPage'
);

export const routes = [
  {
    name: 'LoginPage',
    path: '/auth',
    element: LoginPage,
    withAuth: false,
  },
  {
    name: 'OnboardingTermAgreePage',
    path: '/term-agree',
    element: OnboardingTermAgreePage,
    withAuth: true,
  },
  {
    name: 'OnboardingPage',
    path: '/onboarding',
    element: OnboardingPage,
    withAuth: true,
  },
  {
    name: 'OnboardingCompletePage',
    path: '/onboarding/complete',
    element: OnboardingCompletePage,
    withAuth: true,
  },
  {
    name: 'LoginRedirectPage',
    path: '/auth/kakao/callback',
    element: LoginRedirectPage,
    withAuth: false,
  },
  {
    name: 'AppleLinkRedirectPage',
    path: '/auth/apple/link-callback',
    element: AppleLinkRedirectPage,
    withAuth: true,
  },
  {
    name: 'HomePage',
    path: '/',
    element: HomePage,
    withAuth: true,
  },
  {
    name: 'HomeNotificationPage',
    path: '/notification',
    element: HomeNotificationPage,
    withAuth: true,
  },
  {
    name: 'NoticeDetailPage',
    path: '/notice/:noticeId',
    element: NoticeDetailPage,
    withAuth: true,
  },
  {
    name: 'NoticeListPage',
    path: '/notice',
    element: NoticeListPage,
    withAuth: true,
  },
  {
    name: 'SchedulePage',
    path: '/schedule',
    element: SchedulePage,
    withAuth: true,
  },
  {
    name: 'ScheduleCreatePage',
    path: '/schedule/create',
    element: ScheduleCreatePage,
    withAuth: true,
  },
  {
    name: 'NotFoundPage',
    path: '/404',
    element: NotFoundPage,
    withAuth: false,
  },
  {
    name: 'Mypage',
    path: '/mypage',
    element: UserPage,
    withAuth: true,
  },
  {
    name: 'CrewBannedStatusPage',
    path: '/crew-join/status/banned',
    element: CrewBannedStatusPage,
    withAuth: true,
  },
  {
    name: 'ScheduleDetailPage',
    path: '/schedule/:id',
    element: ScheduleDetailPage,
    withAuth: true,
  },
  {
    name: 'ScheduleEditPage',
    path: '/schedule/:id/edit',
    element: ScheduleEditPage,
    withAuth: true,
  },
  {
    name: 'ScheduleMembersPage',
    path: '/schedule/:id/members',
    element: ScheduleMembersPage,
    withAuth: true,
  },
  {
    name: 'AttendancePage',
    path: '/crew/:id/attendance',
    element: AttendancePage,
    withAuth: true,
  },
  {
    name: 'AddressSettingPage',
    path: '/address',
    element: AddressSettingPage,
    withAuth: true,
  },
  {
    name: 'AddressRegisterPage',
    path: '/address/register',
    element: AddressRegisterPage,
    withAuth: true,
  },
  {
    name: 'AddressSearchPage',
    path: '/address/search',
    element: AddressSearchPage,
    withAuth: true,
  },
  {
    name: 'AddressEditPage',
    path: '/address/:id/edit',
    element: AddressEditPage,
    withAuth: true,
  },
  {
    name: 'SettingsTermDetailPage',
    path: '/term-detail/:termType',
    element: SettingsTermDetailPage,
    withAuth: false,
  },
  {
    name: 'CrewMemberManagePage',
    path: '/crew/:id/manage',
    element: CrewMemberManagePage,
    withAuth: true,
  },
  {
    name: 'CrewMemberViewPage',
    path: '/crew/:id/members',
    element: CrewMemberViewPage,
    withAuth: true,
  },
  {
    name: 'ScheduleLocationPage',
    path: '/schedule/location/search',
    element: ScheduleLocationPage,
    withAuth: true,
  },
  {
    name: 'UserProfileEditPage',
    path: '/mypage/profile/edit',
    element: UserProfileEditPage,
    withAuth: true,
  },
  {
    name: 'CrewInfoEditPage',
    path: '/crew/:id/edit',
    element: CrewInfoEditPage,
    withAuth: true,
  },
  {
    name: 'CrewPage',
    path: '/crew/:id',
    element: CrewPage,
    withAuth: true,
  },
  {
    name: 'SettingsPage',
    path: '/settings',
    element: SettingsPage,
    withAuth: true,
  },
  {
    name: 'SettingsLoginInfoPage',
    path: '/settings/login-info',
    element: SettingsLoginInfoPage,
    withAuth: true,
  },
  {
    name: 'SettingsCrewNotificationPage',
    path: '/settings/crew-notification',
    element: SettingsCrewNotificationPage,
    withAuth: true,
  },
] as const satisfies readonly RouteConfig[];
