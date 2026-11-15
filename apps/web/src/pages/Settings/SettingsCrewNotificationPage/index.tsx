import { vars } from '@azit/design-system';
import { Header } from '@azit/design-system/header';
import { AppScreen } from '@stackflow/plugin-basic-ui';
import { useQuery } from '@tanstack/react-query';

import { userQueries } from '@/entities/User/api/queries';

import { BackButton } from '@/shared/ui/button';
import { QueryErrorFallback } from '@/shared/ui/error';
import { AppLayout } from '@/shared/ui/layout';

import { CrewNotificationCard } from './CrewNotificationCard';
import * as styles from './index.css';

export function SettingsCrewNotificationPage() {
  const query = useQuery({
    ...userQueries.crewNotificationSettingsQuery(),
    throwOnError: false,
  });
  const crews = query.data;

  return (
    <AppScreen backgroundColor={vars.colors.background_sub}>
      <AppLayout>
        <div className={styles.headerWrapper}>
          <Header left={<BackButton />} center="크루별 알림 설정" />
        </div>
        <div className={styles.mainContainer}>
          {query.isPending ? (
            <p role="status">크루별 알림 설정을 불러오는 중이에요</p>
          ) : null}
          {query.isError ? (
            <QueryErrorFallback
              message="크루별 알림 설정을 불러오지 못했어요"
              onRetry={() => {
                void query.refetch();
              }}
              isRetrying={query.isFetching}
            />
          ) : null}
          {crews && (
            <>
              <p className={styles.sectionTitle}>
                참여 중인 크루({crews.length})
              </p>
              <div className={styles.crewList}>
                {crews.map((crew) => (
                  <CrewNotificationCard
                    key={crew.crewId}
                    crew={crew}
                    disabled={query.isError}
                  />
                ))}
                {crews.length === 0 && <p>참여 중인 크루가 없어요</p>}
              </div>
            </>
          )}
        </div>
      </AppLayout>
    </AppScreen>
  );
}
