import { describe, expect, it } from 'vitest';

import { getScheduleSearchDate } from './scheduleCalendar';

describe('일정 달력의 조회 범위', () => {
  it('선택한 날짜와 표시 중인 연월이 같으면 선택일을 조회한다', () => {
    expect(
      getScheduleSearchDate(new Date(2027, 0, 20), new Date(2027, 0, 1))
    ).toBe('2027-01-20');
  });
  it('같은 월이어도 연도가 다르면 표시 중인 연월을 조회한다', () => {
    expect(
      getScheduleSearchDate(new Date(2027, 0, 1), new Date(2028, 0, 1))
    ).toBe('2028-01');
  });
  it('월 이동과 연도 경계에서는 표시 중인 연월을 조회한다', () => {
    expect(
      getScheduleSearchDate(new Date(2026, 11, 31), new Date(2027, 0, 1))
    ).toBe('2027-01');
    expect(
      getScheduleSearchDate(new Date(2027, 0, 1), new Date(2026, 11, 1))
    ).toBe('2026-12');
  });
});
