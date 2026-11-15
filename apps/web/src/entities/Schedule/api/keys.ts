import type {
  CrewScheduleCalendarRequest,
  CrewScheduleListRequest,
} from '../model/schedule.model';

export const scheduleKeys = {
  all: ['schedule'] as const,
  detail: (scheduleId: number) =>
    [...scheduleKeys.all, 'detail', scheduleId] as const,
  participants: (scheduleId: number) =>
    [...scheduleKeys.all, 'participants', scheduleId] as const,
  listKey: (crewId: number, request?: CrewScheduleListRequest) =>
    [...scheduleKeys.all, 'getScheduleList', crewId, request] as const,
  memberListKey: () => [...scheduleKeys.all, 'getMemberScheduleList'] as const,
  checkInStatusKey: () =>
    [...scheduleKeys.all, 'getScheduleCheckInStatus'] as const,
  calendarKey: (crewId: number, request?: CrewScheduleCalendarRequest) =>
    [...scheduleKeys.all, 'getScheduleCalendar', crewId, request] as const,
};
