import { vars } from '@azit/design-system';
import { AppScreen } from '@stackflow/plugin-basic-ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useFlow } from '@/app/routes/stackflow';

import { STATUS_CONTENT } from '@/features/Crew/model/crewJoinStatus';
import { CrewJoinStatusSection } from '@/features/Crew/ui';

import { userQueries } from '@/entities/User/api/queries';

import { AsyncBoundary } from '@/shared/ui/async-boundary';
import { PageErrorFallback, QueryErrorFallback } from '@/shared/ui/error';
import { AppLayout } from '@/shared/ui/layout';
import { PageLoader } from '@/shared/ui/loading/PageLoader';

function CrewBannedStatusContent() {
  const { replace } = useFlow();
  const query = useSuspenseQuery(userQueries.myCrewsQuery());
  const myCrewsData = query.data;

  const expelledCrew =
    myCrewsData?.find((c) => c.memberStatus === 'EXPELLED') ?? null;
  useEffect(() => {
    if (!query.isFetching && !query.isError && !expelledCrew)
      replace('Mypage', {}, { animate: false });
  }, [query.isFetching, query.isError, expelledCrew, replace]);
  if (query.isError)
    return (
      <QueryErrorFallback
        message="크루 상태를 확인하지 못했어요"
        onRetry={() => {
          void query.refetch();
        }}
        isRetrying={query.isFetching}
      />
    );
  if (query.isFetching || !expelledCrew) return <PageLoader />;

  const crewName = expelledCrew?.crewName ?? '';
  const crewImageUrl = expelledCrew?.crewImageUrl ?? null;
  const content = STATUS_CONTENT['EXPELLED'];

  return (
    <AppScreen backgroundColor={vars.colors.white}>
      <AppLayout>
        <CrewJoinStatusSection
          name={crewName}
          profileImageSrc={crewImageUrl ?? '/azit.png'}
          primaryMessage={content.primaryMessage}
          secondaryMessage={content.secondaryMessage}
          buttonText="마이페이지로 이동"
          buttonState={content.buttonState}
          onButtonClick={() => replace('Mypage', {}, { animate: false })}
        />
      </AppLayout>
    </AppScreen>
  );
}

export function CrewBannedStatusPage() {
  return (
    <AsyncBoundary
      suspenseFallback={<PageLoader />}
      errorFallback={<PageErrorFallback />}
    >
      <CrewBannedStatusContent />
    </AsyncBoundary>
  );
}
