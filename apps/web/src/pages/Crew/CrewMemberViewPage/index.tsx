import { Header } from '@azit/design-system/header';
import { AppScreen } from '@stackflow/plugin-basic-ui';

import { useCrewMembers } from '@/features/Crew/model/useCrewMembers';
import { MemberList } from '@/features/Crew/ui';

import { useInfiniteScroll } from '@/shared/lib/useInfiniteScroll';
import { BackButton } from '@/shared/ui/button';
import { QueryErrorFallback } from '@/shared/ui/error';
import { AppLayout } from '@/shared/ui/layout';
import { PageLoader } from '@/shared/ui/loading/PageLoader';

import * as styles from './index.css';

export function CrewMemberViewPage({ params }: { params?: { id?: string } }) {
  const crewId = Number(params?.id) || 0;

  const query = useCrewMembers(crewId);
  const { members, totalCount } = query;

  const { scrollRef, bottomSentinelRef } = useInfiniteScroll({
    hasNextPage: query.hasNextPage && !query.isError,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  });

  return (
    <AppScreen>
      <AppLayout>
        <div className={styles.headerWrapper}>
          <Header left={<BackButton />} center="멤버 목록" />
        </div>
        <div className={styles.mainContainer} ref={scrollRef}>
          {query.isPending ? (
            <PageLoader />
          ) : (
            <>
              {query.data && (
                <p className={styles.totalCount}>총 {totalCount}명</p>
              )}
              <MemberList members={members} />
              {query.isError ? (
                <QueryErrorFallback
                  message="멤버 목록을 불러오지 못했어요"
                  onRetry={query.retry}
                  isRetrying={query.isFetching}
                />
              ) : members.length === 0 ? (
                <p>크루 멤버가 없어요</p>
              ) : null}
              {query.isFetchingNextPage && (
                <p role="status">멤버를 불러오는 중이에요</p>
              )}
            </>
          )}
          <div ref={bottomSentinelRef} aria-hidden />
        </div>
      </AppLayout>
    </AppScreen>
  );
}
