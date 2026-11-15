import dayjs from 'dayjs';

import type { components } from '@/shared/api/apiTypes';

import { MockApiError } from '../api';
import { mockAttendances } from '../data/member';

type Log = Required<components['schemas']['DailyAttendanceLog']>;
const records: { crewId: number; points: number; log: Log }[] = [
  ...mockAttendances.result.attendanceLogs.map((log) => ({
    crewId: 1,
    points: log.status === 'ATTENDED' ? 100 : 0,
    log,
  })),
  {
    crewId: 2,
    points: 100,
    log: {
      ...mockAttendances.result.attendanceLogs[1],
      scheduleId: 13,
      crewName: '새벽 달리기 모임',
      title: '새벽 번개런',
      meetingAt: '2026-11-03T07:00:00',
    },
  },
];

function filtered(query: URLSearchParams) {
  const month = query.get('yearMonth') ?? dayjs().format('YYYY-MM');
  const crewId = query.has('crewId') ? Number(query.get('crewId')) : null;
  if (
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) ||
    (crewId !== null && (!Number.isInteger(crewId) || crewId <= 0))
  )
    throw new MockApiError(
      'INVALID_INPUT_VALUE',
      '조회 조건을 확인해주세요.',
      400
    );
  return records.filter(
    (item) =>
      item.log.meetingAt.startsWith(month) &&
      (crewId === null || item.crewId === crewId) &&
      (item.log.status === 'ATTENDED' ||
        dayjs(item.log.meetingAt).valueOf() <= Date.now())
  );
}
export function getMockAttendanceLogs(query: URLSearchParams) {
  const items = filtered(query);
  return {
    attendanceLogs: structuredClone(items.map((item) => item.log)),
    totalAttendanceCount: items.filter((item) => item.log.status === 'ATTENDED')
      .length,
    totalPoints: items.reduce((sum, item) => sum + item.points, 0),
  };
}
export function getMockAttendanceCalendar(query: URLSearchParams) {
  const days = new Map<
    string,
    { date: string; hasRegular: boolean; hasLightning: boolean }
  >();
  for (const { log } of filtered(query)) {
    const date = log.meetingAt.slice(0, 10);
    const day = days.get(date) ?? {
      date,
      hasRegular: false,
      hasLightning: false,
    };
    day.hasRegular ||= log.runType === 'REGULAR';
    day.hasLightning ||= log.runType === 'LIGHTNING';
    days.set(date, day);
  }
  return [...days.values()];
}
