import { vars } from '@azit/design-system';
import { Header } from '@azit/design-system/header';
import { AppScreen } from '@stackflow/plugin-basic-ui';
import { useActivityParams } from '@stackflow/react';
import Markdown from 'react-markdown';

import {
  LOCATION_SERVICE_AGREEMENT,
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
  THIRD_PARTY_INFO_AGREEMENT,
} from '@/shared/constants/term';
import { useStack } from '@/shared/lib/stackflow/useStack';
import { useAuthStore } from '@/shared/store/auth';
import { BackButton } from '@/shared/ui/button';
import { PageErrorFallback } from '@/shared/ui/error';
import { AppLayout } from '@/shared/ui/layout';

import * as styles from './index.css';

const TERM_CONTENT_MAP: Record<string, { title: string; content: string }> = {
  'terms-of-service': {
    title: '서비스 이용약관',
    content: TERMS_OF_SERVICE,
  },
  'privacy-policy': {
    title: '개인정보 처리방침',
    content: PRIVACY_POLICY,
  },
  'third-party-info-agreement': {
    title: '제3자 정보제공 동의',
    content: THIRD_PARTY_INFO_AGREEMENT,
  },
  'location-service-agreement': {
    title: '위치 기반 서비스 이용약관',
    content: LOCATION_SERVICE_AGREEMENT,
  },
};

export function SettingsTermDetailPage() {
  const { pop } = useStack();
  const { accessToken, status } = useAuthStore();
  const fallback =
    status === 'PENDING_TERMS'
      ? 'OnboardingTermAgreePage'
      : accessToken
        ? 'Mypage'
        : 'LoginPage';
  const { termType } = useActivityParams<{ termType: string }>();
  const content = Object.hasOwn(TERM_CONTENT_MAP, termType)
    ? TERM_CONTENT_MAP[termType]
    : undefined;

  return (
    <AppScreen backgroundColor={vars.colors.background}>
      <AppLayout>
        <div className={styles.headerWrapper}>
          <Header
            sticky
            left={<BackButton onClick={() => pop(fallback)} />}
            center={content?.title ?? '약관 및 정책'}
          />
        </div>
        <div className={styles.markdownContainer}>
          {content ? (
            <Markdown>{content.content}</Markdown>
          ) : (
            <PageErrorFallback message="요청한 약관을 찾을 수 없어요" />
          )}
        </div>
      </AppLayout>
    </AppScreen>
  );
}
