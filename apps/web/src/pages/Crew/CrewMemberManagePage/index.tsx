import { vars } from '@azit/design-system';
import { Header } from '@azit/design-system/header';
import { AppScreen } from '@stackflow/plugin-basic-ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { crewQueries } from '@/features/Crew/api/queries';
import { useCrewMembers } from '@/features/Crew/model/useCrewMembers';
import {
  MemberList,
  MemberManagementTab,
  RequestList,
  RequestListEmpty,
} from '@/features/Crew/ui';

import { userQueries } from '@/entities/User/api/queries';

import { MEMBER_ROLE } from '@/shared/constants/member-role';
import { useInfiniteScroll } from '@/shared/lib/useInfiniteScroll';
import { usePullToRefresh } from '@/shared/lib/usePullToRefresh';
import { BackButton } from '@/shared/ui/button';
import { PageErrorFallback, QueryErrorFallback } from '@/shared/ui/error';
import { AppLayout } from '@/shared/ui/layout';
import { PageLoader } from '@/shared/ui/loading/PageLoader';
import { spinner as pageLoaderSpinner } from '@/shared/ui/loading/PageLoader.css.ts';

import * as styles from './index.css';

function MemberListContent({
  crewId,
  containerRef,
}: {
  crewId: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const queryClient = useQueryClient();

  const query = useCrewMembers(crewId);
  const isDeletingRef = useRef(false);

  const { bottomSentinelRef } = useInfiniteScroll({
    scrollRef: containerRef,
    hasNextPage: query.hasNextPage && !query.isError,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  });

  const { isRefreshing: isPullRefreshing, pullProgress } = usePullToRefresh({
    scrollRef: containerRef,
    enabled: crewId > 0,
    onRefresh: async () => {
      await query.refetch();
    },
  });

  const deleteMutation = useMutation({
    ...crewQueries.deleteCrewMember,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: crewQueries.crewMembersKey(crewId),
      });
    },
    onSettled: () => {
      isDeletingRef.current = false;
    },
  });

  const handleDeleteMember = (targetMemberId: number) => {
    if (isDeletingRef.current || query.isError) return;
    isDeletingRef.current = true;
    deleteMutation.mutate({ crewId, targetMemberId });
  };
  if (query.isPending) return <PageLoader />;

  return (
    <>
      {(isPullRefreshing || pullProgress > 0) && (
        <div className={styles.pullIndicator} aria-hidden>
          {isPullRefreshing ? (
            <>
              <div className={pageLoaderSpinner} />
              <p className={styles.pullText}>새로고침 중</p>
            </>
          ) : (
            <p className={styles.pullHint}>
              {pullProgress >= 1 ? '놓으면 새로고침' : '당겨서 새로고침'}
            </p>
          )}
        </div>
      )}
      {query.data && (
        <p className={styles.totalCount}>총 {query.totalCount}명</p>
      )}
      <MemberList
        members={query.members}
        onDeleteMember={query.isError ? undefined : handleDeleteMember}
        isDeletingMemberId={
          deleteMutation.isPending
            ? deleteMutation.variables?.targetMemberId
            : undefined
        }
      />
      {query.isError ? (
        <QueryErrorFallback
          message="멤버 목록을 불러오지 못했어요"
          onRetry={query.retry}
          isRetrying={query.isFetching}
        />
      ) : query.members.length === 0 ? (
        <p>크루 멤버가 없어요</p>
      ) : null}
      {query.isFetchingNextPage && (
        <p role="status">멤버를 불러오는 중이에요</p>
      )}
      <div ref={bottomSentinelRef} className={styles.sentinel} aria-hidden />
    </>
  );
}

function RequestListContent({
  crewId,
  containerRef,
}: {
  crewId: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const query = useQuery({
    ...crewQueries.joinRequestsQuery(crewId),
    throwOnError: false,
  });

  const requests = query.data?.result ?? [];

  const { isRefreshing: isPullRefreshing, pullProgress } = usePullToRefresh({
    scrollRef: containerRef,
    enabled: crewId > 0,
    onRefresh: async () => {
      await query.refetch();
    },
  });

  return (
    <>
      {(isPullRefreshing || pullProgress > 0) && (
        <div className={styles.pullIndicator} aria-hidden>
          {isPullRefreshing ? (
            <>
              <div className={pageLoaderSpinner} />
              <p className={styles.pullText}>새로고침 중</p>
            </>
          ) : (
            <p className={styles.pullHint}>
              {pullProgress >= 1 ? '놓으면 새로고침' : '당겨서 새로고침'}
            </p>
          )}
        </div>
      )}
      {query.isError ? (
        <QueryErrorFallback
          message="가입 요청 목록을 불러오지 못했어요"
          onRetry={() => {
            void query.refetch();
          }}
          isRetrying={query.isFetching}
        />
      ) : query.isPending ? (
        <PageLoader />
      ) : requests.length > 0 ? (
        <RequestList crewId={crewId} requests={requests} />
      ) : (
        <RequestListEmpty />
      )}
    </>
  );
}

export function CrewMemberManagePage({
  params,
}: {
  params?: { id?: string; initialTab?: 'member' | 'request' };
}) {
  const [activeTab, setActiveTab] = useState<'member' | 'request'>(
    params?.initialTab ?? 'member'
  );
  const crewId = Number(params?.id) || 0;
  const mainContainerRef = useRef<HTMLDivElement | null>(null);
  const crewsQuery = useQuery({
    ...userQueries.myCrewsQuery(),
    throwOnError: false,
  });
  const isLeader =
    crewsQuery.data?.some(
      (crew) =>
        crew.crewId === crewId &&
        crew.memberStatus === 'JOINED' &&
        crew.memberRole === MEMBER_ROLE.LEADER
    ) ?? false;

  const {
    data: joinRequestsData,
    isError: isRequestsError,
    isPending: isRequestsPending,
  } = useQuery({
    ...crewQueries.joinRequestsQuery(crewId),
    enabled: crewId > 0 && isLeader,
    throwOnError: false,
  });
  const requestCount =
    isRequestsError || isRequestsPending
      ? undefined
      : (joinRequestsData?.result?.length ?? 0);

  return (
    <AppScreen backgroundColor={vars.colors.white}>
      <AppLayout>
        <div className={styles.headerWrapper}>
          <Header left={<BackButton />} center="멤버 관리" />
          <MemberManagementTab
            activeTab={activeTab}
            onTabChange={setActiveTab}
            requestCount={requestCount}
          />
        </div>
        <div
          className={`${styles.mainContainer}${activeTab === 'request' ? ` ${styles.noPaddingTop}` : ''}`}
          ref={mainContainerRef}
        >
          {crewsQuery.isError ? (
            <QueryErrorFallback
              message="크루 정보를 불러오지 못했어요"
              onRetry={() => {
                void crewsQuery.refetch();
              }}
              isRetrying={crewsQuery.isFetching}
            />
          ) : crewsQuery.isPending ? (
            <PageLoader />
          ) : !isLeader ? (
            <PageErrorFallback message="크루 리더만 멤버를 관리할 수 있어요" />
          ) : activeTab === 'request' ? (
            <RequestListContent
              crewId={crewId}
              containerRef={mainContainerRef}
            />
          ) : (
            <MemberListContent
              crewId={crewId}
              containerRef={mainContainerRef}
            />
          )}
        </div>
      </AppLayout>
    </AppScreen>
  );
}
