import { mockApi } from '../api';
import { mockSuccess } from '../data/crew';
import {
  cancelMockJoinRequest,
  createMockCrew,
  decideMockCrewJoinRequest,
  deleteMockCrewMember,
  dissolveMockCrew,
  exitMockCrew,
  getMockCrewInfo,
  getMockCrewInvitation,
  getMockCrewJoinStatus,
  getMockCrewJoinRequests,
  getMockCrewMembers,
  getMockJoinedCrews,
  joinMockCrew,
  reissueMockInvitationCode,
  updateMockCrewInfo,
} from '../state/crews';

export const crewHandlers = [
  mockApi.get('/api/v1/crews/me', () => ({
    ...mockSuccess,
    result: getMockJoinedCrews(),
  })),
  mockApi.post('/api/v1/crews', async ({ request }) => ({
    ...mockSuccess,
    result: createMockCrew(await request.json()),
  })),
  mockApi.get('/api/v1/crews/invitation/{invitationCode}', ({ params }) => ({
    ...mockSuccess,
    result: getMockCrewInvitation(params.invitationCode),
  })),
  mockApi.post('/api/v1/crews/join', async ({ request }) => {
    joinMockCrew((await request.json()).invitationCode);
    return mockSuccess;
  }),
  mockApi.get('/api/v1/crews/{crewId}/join-status', ({ params }) => ({
    ...mockSuccess,
    result: getMockCrewJoinStatus(Number(params.crewId)),
  })),
  mockApi.get('/api/v1/crews/{crewId}/members', ({ params, request }) => ({
    ...mockSuccess,
    result: getMockCrewMembers(
      Number(params.crewId),
      new URL(request.url).searchParams
    ),
  })),
  mockApi.get('/api/v1/crews/{crewId}/join-requests', ({ params }) => ({
    ...mockSuccess,
    result: getMockCrewJoinRequests(Number(params.crewId)),
  })),
  mockApi.post(
    '/api/v1/crews/{crewId}/join-requests/{targetMemberId}/approve',
    ({ params }) => {
      decideMockCrewJoinRequest(
        Number(params.crewId),
        Number(params.targetMemberId),
        true
      );
      return mockSuccess;
    }
  ),
  mockApi.post(
    '/api/v1/crews/{crewId}/join-requests/{targetMemberId}/reject',
    ({ params }) => {
      decideMockCrewJoinRequest(
        Number(params.crewId),
        Number(params.targetMemberId),
        false
      );
      return mockSuccess;
    }
  ),
  mockApi.delete('/api/v1/crews/{crewId}/join-request', ({ params }) => {
    cancelMockJoinRequest(Number(params.crewId));
    return mockSuccess;
  }),
  mockApi.delete('/api/v1/crews/{crewId}/members/me', ({ params }) => {
    exitMockCrew(Number(params.crewId));
    return mockSuccess;
  }),
  mockApi.delete(
    '/api/v1/crews/{crewId}/members/{targetMemberId}',
    ({ params }) => {
      deleteMockCrewMember(
        Number(params.crewId),
        Number(params.targetMemberId)
      );
      return mockSuccess;
    }
  ),
  mockApi.delete('/api/v1/crews/{crewId}', ({ params }) => {
    dissolveMockCrew(Number(params.crewId));
    return mockSuccess;
  }),
  mockApi.post('/api/v1/crews/{crewId}/invitation-code', ({ params }) => ({
    ...mockSuccess,
    result: reissueMockInvitationCode(Number(params.crewId)),
  })),
  mockApi.get('/api/v1/crews/{crewId}/info', ({ params }) => ({
    ...mockSuccess,
    result: getMockCrewInfo(Number(params.crewId)),
  })),
  mockApi.patch('/api/v1/crews/{crewId}/info', async ({ params, request }) => {
    updateMockCrewInfo(Number(params.crewId), await request.json());
    return mockSuccess;
  }),
];
