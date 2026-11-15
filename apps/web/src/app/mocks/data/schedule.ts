import dayjs from 'dayjs';
import type { RequiredDeep } from 'type-fest';

import type { components } from '@/shared/api/apiTypes';

export type MockScheduleDetail = RequiredDeep<
  components['schemas']['CrewScheduleDetailResponse']
>;
export interface MockScheduleRecord {
  crewId: number;
  detail: MockScheduleDetail;
}

// 모든 일정 응답은 이 원본에서 파생한다. 새로고침/테스트 초기화 시 다시 생성한다.
export function createScheduleSeeds(): MockScheduleRecord[] {
  const now = dayjs();
  const createdAt = now.subtract(7, 'day').format('YYYY-MM-DDTHH:mm:ss');
  const common = {
    description: '함께 한강에서 달려요!',
    distance: 5,
    pace: 4,
    maxParticipants: 20,
    currentParticipants: 1,
    supplies: ['운동화', '물'],
    creatorProfileImageUrl: '/icons/icon-crew-default.svg',
    isCheckedIn: false,
    isModifiable: true,
    isParticipationModifiable: true,
    hasMoreParticipants: false,
    createdAt,
    status: 'ACTIVE' as const,
  };
  const participant = {
    memberId: 1,
    nickname: '테스터',
    profileImageUrl: '/icons/icon-crew-default.svg',
    role: 'LEADER' as const,
    isCreator: true,
    participatedAt: createdAt,
  };
  const regular: MockScheduleDetail = {
    ...common,
    scheduleId: 1,
    title: '한강 나이트 런',
    runType: 'REGULAR',
    meetingAt: now
      .add(1, 'day')
      .hour(19)
      .minute(30)
      .second(0)
      .format('YYYY-MM-DDTHH:mm:ss'),
    locationInfo: {
      placeName: '반포 한강 공원',
      address: '서울 서초구 반포동',
      meetingSpot: '주차장 앞',
      latitude: 37.5078,
      longitude: 126.9947,
    },
    creatorId: 1,
    creatorNickname: '테스터',
    creatorRole: 'LEADER',
    isMine: true,
    isParticipating: true,
    participants: [participant],
  };
  const lightning: MockScheduleDetail = {
    ...common,
    scheduleId: 2,
    title: '아침 조깅',
    runType: 'LIGHTNING',
    meetingAt: now
      .add(5, 'day')
      .hour(7)
      .minute(0)
      .second(0)
      .format('YYYY-MM-DDTHH:mm:ss'),
    locationInfo: {
      placeName: '올림픽 공원',
      address: '서울 송파구 올림픽로 424',
      meetingSpot: '평화의 문 앞',
      latitude: 37.5207,
      longitude: 127.1215,
    },
    distance: 3,
    pace: 5,
    maxParticipants: 10,
    creatorId: 2,
    creatorNickname: '멤버1',
    creatorRole: 'MEMBER',
    isMine: false,
    isParticipating: false,
    participants: [
      { ...participant, memberId: 2, nickname: '멤버1', role: 'MEMBER' },
    ],
  };
  return [
    { crewId: 1, detail: regular },
    { crewId: 1, detail: lightning },
    {
      crewId: 2,
      detail: {
        ...structuredClone(lightning),
        scheduleId: 3,
        title: '새벽 달리기',
        meetingAt: now
          .add(2, 'day')
          .hour(7)
          .minute(0)
          .second(0)
          .format('YYYY-MM-DDTHH:mm:ss'),
      },
    },
  ];
}
