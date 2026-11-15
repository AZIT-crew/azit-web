import { vars } from '@azit/design-system';
import { Header } from '@azit/design-system/header';
import { AppScreen } from '@stackflow/plugin-basic-ui';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { scheduleQueries } from '@/features/Schedule/api/queries';
import {
  ScheduleParticipantListItem,
  ScheduleParticipantTitle,
} from '@/features/Schedule/ui';

import { userQueries } from '@/entities/User/api/queries';

import { useInfiniteScroll } from '@/shared/lib/useInfiniteScroll';
import { BackButton } from '@/shared/ui/button';
import { QueryErrorFallback } from '@/shared/ui/error';
import { AppLayout } from '@/shared/ui/layout';

import * as styles from './index.css';

interface ScheduleMembersPageProps {
  params: { id: number; crewId?: number };
}

export function ScheduleMembersPage({
  params: { id: scheduleId, crewId: requestedCrewId },
}: ScheduleMembersPageProps) {
  const crewsQuery = useQuery({
    ...userQueries.myCrewsQuery(),
    throwOnError: false,
  });
  const crewId =
    crewsQuery.data?.find(
      (c) =>
        c.memberStatus === 'JOINED' &&
        (!requestedCrewId || c.crewId === Number(requestedCrewId))
    )?.crewId ?? 0;

  const detailQuery = useQuery({
    ...scheduleQueries.scheduleDetailQuery(crewId, scheduleId),
    enabled: crewId > 0 && scheduleId > 0,
    throwOnError: false,
  });

  const participantCount = detailQuery.data?.result.currentParticipants ?? 0;
  const maxParticipants = detailQuery.data?.result.maxParticipants ?? 0;

  const participantsQuery = useInfiniteQuery({
    ...scheduleQueries.scheduleParticipantsQuery(crewId, scheduleId),
    enabled: crewId > 0 && scheduleId > 0,
    throwOnError: false,
  });

  const { scrollRef, bottomSentinelRef } = useInfiniteScroll({
    hasNextPage: participantsQuery.hasNextPage && !participantsQuery.isError,
    isFetchingNextPage: participantsQuery.isFetchingNextPage,
    fetchNextPage: participantsQuery.fetchNextPage,
  });

  const members =
    participantsQuery.data?.pages.flatMap(
      (page) => page.result?.content ?? []
    ) ?? [];

  const retryParticipants = () => {
    if (participantsQuery.isFetchNextPageError) {
      void participantsQuery.fetchNextPage();
    } else {
      void participantsQuery.refetch();
    }
  };

  return (
    <AppScreen backgroundColor={vars.colors.background_sub}>
      <AppLayout>
        <Header
          className={styles.headerSection}
          left={<BackButton />}
          center={<span>참여 멤버</span>}
        />
        <div className={styles.contentWrapper} ref={scrollRef}>
          {crewsQuery.isError || (!crewsQuery.isPending && crewId <= 0) ? (
            <QueryErrorFallback
              message="크루 정보를 불러오지 못했어요"
              onRetry={() => {
                void crewsQuery.refetch();
              }}
              isRetrying={crewsQuery.isFetching}
            />
          ) : detailQuery.isError ? (
            <QueryErrorFallback
              message="일정 정보를 불러오지 못했어요"
              onRetry={() => {
                void detailQuery.refetch();
              }}
              isRetrying={detailQuery.isFetching}
            />
          ) : crewsQuery.isPending || detailQuery.isPending ? (
            <p role="status" className={styles.status}>
              참여 멤버를 불러오는 중이에요
            </p>
          ) : (
            <>
              <ScheduleParticipantTitle
                participantCount={participantCount}
                maxParticipants={maxParticipants}
              />
              <div className={styles.memberList}>
                {members.map((member) => (
                  <ScheduleParticipantListItem
                    key={member.memberId}
                    participant={member}
                    orientation="horizontal"
                  />
                ))}
              </div>
              {participantsQuery.isError ? (
                <QueryErrorFallback
                  message="참여 멤버를 불러오지 못했어요"
                  onRetry={retryParticipants}
                  isRetrying={participantsQuery.isFetching}
                />
              ) : participantsQuery.isPending ||
                participantsQuery.isFetchingNextPage ? (
                <p role="status" className={styles.status}>
                  참여 멤버를 불러오는 중이에요
                </p>
              ) : members.length === 0 ? (
                <p className={styles.status}>참여 멤버가 없어요</p>
              ) : null}
              <div ref={bottomSentinelRef} aria-hidden />
            </>
          )}
        </div>
      </AppLayout>
    </AppScreen>
  );
}
