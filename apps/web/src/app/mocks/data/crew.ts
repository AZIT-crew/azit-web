import type { MockResponse } from '../api';
import { mockMyCrews } from './member';

export const mockCrewJoinedList = {
  code: 'SUCCESS',
  message: '요청에 성공했습니다.',
  result: mockMyCrews.result.map((crew) => ({
    crewId: crew.crewId,
    name: crew.crewName,
    imageUrl: crew.crewImageUrl,
    description: '함께 달려요!',
  })),
} satisfies MockResponse<'get', '/api/v1/crews/me'>;

export const mockCrewInvitation = {
  code: 'SUCCESS',
  message: '요청에 성공했습니다.',
  result: {
    crewId: 1,
    name: '한강 러너스',
    crewImageUrl: '/icons/icon-crew-default.svg',
    description: '한강에서 함께 달려요!',
    memberCount: 2,
    category: 'RUNNING',
  },
} satisfies MockResponse<'get', '/api/v1/crews/invitation/{invitationCode}'>;

export const mockCrewJoinStatus = {
  code: 'SUCCESS',
  message: '요청에 성공했습니다.',
  result: {
    crewId: 1,
    name: '한강 러너스',
    crewImageUrl: '/icons/icon-crew-default.svg',
    status: 'JOINED',
  },
} satisfies MockResponse<'get', '/api/v1/crews/{crewId}/join-status'>;

export const mockCrewMembers = {
  code: 'SUCCESS',
  message: '요청에 성공했습니다.',
  result: {
    totalCount: 2,
    content: [
      {
        id: 1,
        memberId: 1,
        nickname: '테스터',
        profileImageUrl: '/icons/icon-crew-default.svg',
        role: 'LEADER',
        joinedDate: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        memberId: 2,
        nickname: '멤버1',
        profileImageUrl: '/icons/icon-crew-default.svg',
        role: 'MEMBER',
        joinedDate: '2026-02-01T00:00:00.000Z',
      },
    ],
    hasNext: false,
    lastId: 2,
  },
} satisfies MockResponse<'get', '/api/v1/crews/{crewId}/members'>;

export const mockCrewJoinRequests = {
  code: 'SUCCESS',
  message: '요청에 성공했습니다.',
  result: [
    {
      memberId: 3,
      nickname: '가입신청자',
      profileImageUrl: '/icons/icon-crew-default.svg',
      requestedAt: '2026-11-01T10:00:00.000Z',
    },
  ],
} satisfies MockResponse<'get', '/api/v1/crews/{crewId}/join-requests'>;

export const mockCrewInfo = {
  code: 'SUCCESS',
  message: '요청에 성공했습니다.',
  result: {
    name: '한강 러너스',
    crewImageUrl: '/icons/icon-crew-default.svg',
    description: '한강에서 함께 달려요!',
  },
} satisfies MockResponse<'get', '/api/v1/crews/{crewId}/info'>;

export const mockInvitationCode = {
  code: 'SUCCESS',
  message: '요청에 성공했습니다.',
  result: {
    invitationCode: 'NEW001',
  },
} satisfies MockResponse<'post', '/api/v1/crews/{crewId}/invitation-code'>;

export const mockSuccess = {
  code: 'SUCCESS',
  message: '요청에 성공했습니다.',
} satisfies MockResponse<'post', '/api/v1/auth/logout'>;
