import { Button } from '@azit/design-system/button';
import { AppScreen } from '@stackflow/plugin-basic-ui';

import { useFlow } from '@/app/routes/stackflow';

import { useAuthStore } from '@/shared/store/auth';
import { PageErrorFallback } from '@/shared/ui/error';
import { AppLayout } from '@/shared/ui/layout';

export function NotFoundPage() {
  const { replace } = useFlow();
  const { accessToken, status } = useAuthStore();
  const target =
    status === 'PENDING_TERMS'
      ? 'OnboardingTermAgreePage'
      : accessToken
        ? 'HomePage'
        : 'LoginPage';
  const label =
    status === 'PENDING_TERMS'
      ? '약관 동의로 이동'
      : accessToken
        ? '홈으로 가기'
        : '로그인으로 가기';
  return (
    <AppScreen>
      <AppLayout>
        <PageErrorFallback message="페이지를 찾을 수 없어요" />
        <Button state="outline" onClick={() => replace(target, {})}>
          {label}
        </Button>
      </AppLayout>
    </AppScreen>
  );
}
