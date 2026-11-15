import { bridge } from '@/shared/lib/bridge';
import type { MenuGroup } from '@/shared/types/menu';

const LOCATION_PERMISSION_LABEL: Record<string, string> = {
  granted: '활성',
  denied: '비활성',
};

interface SettingsMenuOptions {
  appVersion: string;
  onLogout: () => void;
  onNavigateLoginInfo: () => void;
  onNavigateCrewNotification: () => void;
  allNotificationEnabled: boolean;
  onToggleAllNotification: (checked: boolean) => void;
  marketingConsentEnabled: boolean;
  marketingConsentDescription?: string;
  consentDisabled?: boolean;
  pendingConsent?: 'marketing' | 'notification';
  accountBusy?: boolean;
  isLoggingOut?: boolean;
  onToggleMarketingConsent: (checked: boolean) => void;
}

export const getSettingsMenu = ({
  appVersion,
  onLogout,
  onNavigateLoginInfo,
  onNavigateCrewNotification,
  allNotificationEnabled,
  onToggleAllNotification,
  marketingConsentEnabled,
  marketingConsentDescription,
  consentDisabled,
  pendingConsent,
  accountBusy,
  isLoggingOut,
  onToggleMarketingConsent,
}: SettingsMenuOptions): MenuGroup[] => [
  {
    id: 'account',
    title: '내 계정',
    items: [
      {
        id: 'login-info',
        label: '로그인 정보',
        type: 'navigation',
        onNavigate: onNavigateLoginInfo,
      },
    ],
  },
  {
    id: 'location',
    title: '위치 설정',
    items: [
      {
        id: 'location-permission',
        label: '위치 권한 설정',
        type: 'action',
        getStatusLabel: async () => {
          if (!bridge.isNativeMethodAvailable('getLocationPermissionStatus')) {
            return '미설정';
          }

          const status = await bridge.getLocationPermissionStatus();
          return LOCATION_PERMISSION_LABEL[status] ?? '미설정';
        },
        onAction: async () => {
          if (!bridge.isNativeMethodAvailable('openLocationSettings')) return;
          await bridge.openLocationSettings();
        },
      },
    ],
  },
  {
    id: 'notification',
    title: '알림 설정',
    items: [
      {
        id: 'all-notification',
        label: '전체 알림',
        type: 'toggle',
        checked: allNotificationEnabled,
        disabled: consentDisabled,
        isLoading: pendingConsent === 'notification',
        onToggle: onToggleAllNotification,
      },
      {
        id: 'crew-notification',
        label: '크루별 알림 설정',
        type: 'navigation',
        onNavigate: onNavigateCrewNotification,
      },
      {
        id: 'marketing-consent',
        label: '마케팅 정보 수신 동의',
        type: 'toggle',
        description: marketingConsentDescription,
        checked: marketingConsentEnabled,
        disabled: consentDisabled,
        isLoading: pendingConsent === 'marketing',
        onToggle: onToggleMarketingConsent,
      },
    ],
  },
  {
    id: 'etc',
    title: '기타',
    items: [
      {
        id: 'version-info',
        label: '버전 정보',
        type: 'info',
        value: appVersion,
      },
      {
        id: 'logout',
        label: '로그아웃',
        type: 'action',
        onAction: onLogout,
        disabled: accountBusy,
        isLoading: isLoggingOut,
      },
    ],
  },
];
