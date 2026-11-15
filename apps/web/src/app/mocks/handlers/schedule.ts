import { mockApi } from '../api';
import { mockSuccess } from '../data/crew';
import {
  createMockSchedule,
  deleteMockSchedule,
  getMockParticipants,
  getMockScheduleCalendar,
  getMockScheduleDetail,
  getMockScheduleList,
  participateMockSchedule,
  updateMockSchedule,
} from '../state/schedules';

export const scheduleHandlers = [
  mockApi.get(
    '/api/v1/crews/{crewId}/schedules/calendar',
    ({ params, request }) => ({
      ...mockSuccess,
      result: getMockScheduleCalendar(
        Number(params.crewId),
        new URL(request.url).searchParams
      ),
    })
  ),
  mockApi.get(
    '/api/v1/crews/{crewId}/schedules/{scheduleId}',
    ({ params }) => ({
      ...mockSuccess,
      result: getMockScheduleDetail(
        Number(params.crewId),
        Number(params.scheduleId)
      ),
    })
  ),
  mockApi.get('/api/v1/crews/{crewId}/schedules', ({ params, request }) => ({
    ...mockSuccess,
    result: getMockScheduleList(
      Number(params.crewId),
      new URL(request.url).searchParams
    ),
  })),
  mockApi.post(
    '/api/v1/crews/{crewId}/schedules',
    async ({ params, request }) => {
      createMockSchedule(Number(params.crewId), await request.json());
      return mockSuccess;
    }
  ),
  mockApi.put(
    '/api/v1/crews/{crewId}/schedules/{scheduleId}',
    async ({ params, request }) => {
      updateMockSchedule(
        Number(params.crewId),
        Number(params.scheduleId),
        await request.json()
      );
      return mockSuccess;
    }
  ),
  mockApi.delete(
    '/api/v1/crews/{crewId}/schedules/{scheduleId}/participate',
    ({ params }) => {
      participateMockSchedule(
        Number(params.crewId),
        Number(params.scheduleId),
        true
      );
      return mockSuccess;
    }
  ),
  mockApi.post(
    '/api/v1/crews/{crewId}/schedules/{scheduleId}/participate',
    ({ params }) => {
      participateMockSchedule(Number(params.crewId), Number(params.scheduleId));
      return mockSuccess;
    }
  ),
  mockApi.get(
    '/api/v1/crews/{crewId}/schedules/{scheduleId}/participants',
    ({ params, request }) => ({
      ...mockSuccess,
      result: getMockParticipants(
        Number(params.crewId),
        Number(params.scheduleId),
        new URL(request.url).searchParams
      ),
    })
  ),
  mockApi.delete(
    '/api/v1/crews/{crewId}/schedules/{scheduleId}',
    ({ params }) => {
      deleteMockSchedule(Number(params.crewId), Number(params.scheduleId));
      return mockSuccess;
    }
  ),
];
