import { useInfiniteQuery } from '@tanstack/react-query';

import { crewQueries } from '@/features/Crew/api/queries';

export function useCrewMembers(crewId: number) {
  const query = useInfiniteQuery({
    ...crewQueries.crewMembersQuery(crewId),
    enabled: crewId > 0,
    throwOnError: false,
  });
  const members =
    query.data?.pages.flatMap(
      (page) =>
        page.result?.content?.map((member) => ({
          id: member.id ?? 0,
          memberId: member.memberId ?? member.id ?? 0,
          nickname: member.nickname ?? '',
          profileImageUrl: member.profileImageUrl ?? '',
          role: member.role ?? 'MEMBER',
          joinedDate: member.joinedDate ?? '',
        })) ?? []
    ) ?? [];
  const retry = () => {
    if (query.isFetchNextPageError) void query.fetchNextPage();
    else void query.refetch();
  };
  return {
    ...query,
    members,
    totalCount: query.data?.pages[0]?.result?.totalCount ?? members.length,
    retry,
  };
}
