import { vars } from '@azit/design-system';
import { Button } from '@azit/design-system/button';
import { Header } from '@azit/design-system/header';
import { AppScreen } from '@stackflow/plugin-basic-ui';
import { useActivityParams } from '@stackflow/react';
import { useQuery } from '@tanstack/react-query';

import { notificationPreviewQueries } from '@/entities/Notification/api/queries';

import { useStack } from '@/shared/lib/stackflow/useStack';
import { BackButton } from '@/shared/ui/button';
import { PageErrorFallback, QueryErrorFallback } from '@/shared/ui/error';
import { AppLayout } from '@/shared/ui/layout';

import * as styles from './index.css';

export function NoticeDetailPage() {
  const { noticeId } = useActivityParams<{ noticeId: string }>();
  const id = Number(noticeId);
  const validId = Number.isSafeInteger(id) && id > 0;
  const { pop } = useStack();
  const back = () => pop('NoticeListPage');
  const query = useQuery({
    ...notificationPreviewQueries.notice(id),
    enabled: validId,
    throwOnError: false,
  });
  const notice = query.data;

  return (
    <AppScreen backgroundColor={vars.colors.white}>
      <AppLayout>
        <div className={styles.headerWrapper}>
          <Header left={<BackButton onClick={back} />} center="공지" />
        </div>
        {!validId || (query.isSuccess && !notice) ? (
          <div className={styles.mainContainer}>
            <PageErrorFallback message="공지를 찾을 수 없어요" />
            <Button state="outline" onClick={back}>
              돌아가기
            </Button>
          </div>
        ) : query.isError ? (
          <QueryErrorFallback
            message="공지를 불러오지 못했어요"
            onRetry={() => {
              void query.refetch();
            }}
            isRetrying={query.isFetching}
          />
        ) : query.isPending ? (
          <p role="status">공지를 불러오는 중이에요</p>
        ) : notice ? (
          <div className={styles.mainContainer}>
            <h1 className={styles.title}>{notice.title}</h1>
            <p className={styles.date}>{notice.date}</p>
            <p className={styles.content}>{notice.content}</p>
          </div>
        ) : null}
      </AppLayout>
    </AppScreen>
  );
}
