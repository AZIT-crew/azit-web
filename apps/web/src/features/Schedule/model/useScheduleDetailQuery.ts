import { useSuspenseQuery } from '@tanstack/react-query';

import { scheduleQueries } from '@/features/Schedule/api/queries';

import { BusinessError } from '@/shared/api/apiHandler';

export function useScheduleDetailQuery(crewId: number, scheduleId: number) {
  const query = useSuspenseQuery(
    scheduleQueries.scheduleDetailQuery(crewId, scheduleId)
  );
  // Suspense query는 캐시가 있으면 조회 오류를 자동으로 throw하지 않는다.
  // 삭제/권한 상실은 일시 오류와 구분해 오래된 상세를 표시하지 않는다.
  if (
    query.error instanceof BusinessError &&
    [
      'SCHEDULE_NOT_FOUND',
      'ALREADY_CANCELLED_SCHEDULE',
      'NOT_A_CREW_MEMBER',
    ].includes(query.error.code)
  )
    throw query.error;
  return query;
}
