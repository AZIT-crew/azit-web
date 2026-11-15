import { vars } from '@azit/design-system';
import { Header } from '@azit/design-system/header';
import { AppScreen } from '@stackflow/plugin-basic-ui';
import { useQuery } from '@tanstack/react-query';

import { useFlow } from '@/app/routes/stackflow';

import { notificationPreviewQueries } from '@/entities/Notification/api/queries';

import { useStack } from '@/shared/lib/stackflow/useStack';
import { BackButton } from '@/shared/ui/button';
import { QueryErrorFallback } from '@/shared/ui/error';
import { AppLayout } from '@/shared/ui/layout';
import { MenuItem } from '@/shared/ui/menu';

import * as styles from '../HomeNotificationPage/index.css';

export function NoticeListPage() {
  const { push } = useFlow();
  const { pop } = useStack();
  const query = useQuery({
    ...notificationPreviewQueries.notices(),
    throwOnError: false,
  });
  return (
    <AppScreen backgroundColor={vars.colors.white}>
      <AppLayout>
        <Header
          sticky
          left={<BackButton onClick={() => pop('Mypage')} />}
          center="공지사항"
        />
        <div className={styles.pageContainer}>
          {query.isPending ? (
            <p role="status" className={styles.message}>
              공지사항을 불러오는 중이에요
            </p>
          ) : null}
          {query.isError ? (
            <QueryErrorFallback
              message="공지사항을 불러오지 못했어요"
              onRetry={() => {
                void query.refetch();
              }}
              isRetrying={query.isFetching}
            />
          ) : null}
          {query.data?.map((notice) => (
            <MenuItem
              key={notice.noticeId}
              item={{
                id: String(notice.noticeId),
                label: notice.title,
                type: 'navigation',
                value: notice.date,
                disabled: query.isError,
                onNavigate: () =>
                  push('NoticeDetailPage', {
                    noticeId: String(notice.noticeId),
                  }),
              }}
              onClick={(item) => {
                if (item.type === 'navigation') item.onNavigate();
              }}
            />
          ))}
          {query.isSuccess && query.data.length === 0 ? (
            <p className={styles.message}>등록된 공지사항이 없어요</p>
          ) : null}
        </div>
      </AppLayout>
    </AppScreen>
  );
}
