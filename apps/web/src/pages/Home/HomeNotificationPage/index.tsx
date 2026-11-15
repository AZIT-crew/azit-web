import { vars } from '@azit/design-system';
import { Header } from '@azit/design-system/header';
import { AppScreen } from '@stackflow/plugin-basic-ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { useFlow } from '@/app/routes/stackflow';

import { NotificationList } from '@/widgets/Notification/ui';

import { markPreviewNotificationRead } from '@/entities/Notification/api/previewRepository';
import { notificationPreviewQueries } from '@/entities/Notification/api/queries';
import {
  canAccessNotificationCrew,
  getNotificationTarget,
} from '@/entities/Notification/model/target';
import type { NotificationItem } from '@/entities/Notification/model/types';
import { getMyCrews } from '@/entities/User/api/getMyCrews';
import { userQueries } from '@/entities/User/api/queries';

import { useStack } from '@/shared/lib/stackflow/useStack';
import { BackButton } from '@/shared/ui/button';
import { QueryErrorFallback } from '@/shared/ui/error';
import { AppLayout } from '@/shared/ui/layout';
import { toastError } from '@/shared/ui/toast';

import * as styles from './index.css';

export function HomeNotificationPage() {
  const { push } = useFlow();
  const { pop } = useStack();
  const queryClient = useQueryClient();
  const query = useQuery({
    ...notificationPreviewQueries.list(),
    throwOnError: false,
  });
  const openingRef = useRef(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const handleItemClick = async (item: NotificationItem) => {
    if (openingRef.current || query.isError) return;
    const target = getNotificationTarget(item);
    if (!target) {
      toastError('알림의 이동 정보를 확인할 수 없어요.');
      return;
    }
    openingRef.current = true;
    setOpeningId(item.id);
    try {
      if (target.crewAccess) {
        const response = await getMyCrews();
        queryClient.setQueryData(userQueries.myCrewsKey(), response);
        if (!canAccessNotificationCrew(target.crewAccess, response.result)) {
          toastError(
            target.crewAccess.leaderOnly
              ? '가입 요청을 확인할 권한이 없어요.'
              : '현재 가입되어 있지 않은 크루예요.'
          );
          return;
        }
      }
      const notifications = await markPreviewNotificationRead(item.id);
      queryClient.setQueryData(
        notificationPreviewQueries.listKey(),
        notifications
      );
      push(target.activityName, target.params);
    } catch {
      toastError('알림을 열지 못했어요. 다시 시도해주세요.');
    } finally {
      openingRef.current = false;
      setOpeningId(null);
    }
  };

  return (
    <AppScreen backgroundColor={vars.colors.white}>
      <AppLayout>
        <Header
          sticky
          left={
            <BackButton
              onClick={() => pop('HomePage')}
              disabled={openingId !== null}
            />
          }
          center="알림"
        />
        <div className={styles.pageContainer}>
          {query.isPending ? (
            <p role="status" className={styles.message}>
              알림을 불러오는 중이에요
            </p>
          ) : null}
          {query.isError ? (
            <QueryErrorFallback
              message="알림을 불러오지 못했어요"
              onRetry={() => {
                void query.refetch();
              }}
              isRetrying={query.isFetching}
            />
          ) : null}
          {query.data &&
            (query.data.length === 0 ? (
              query.isSuccess ? (
                <div className={styles.emptyContainer}>
                  <img src="/icons/bell.svg" width={64} height={64} alt="" />
                  <p className={styles.emptyText}>
                    새로운 소식을 기다려보세요!
                  </p>
                </div>
              ) : null
            ) : (
              <NotificationList
                items={query.data}
                onItemClick={handleItemClick}
                disabled={query.isError || openingId !== null}
                openingId={openingId}
              />
            ))}
        </div>
      </AppLayout>
    </AppScreen>
  );
}
