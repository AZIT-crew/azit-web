import dayjs from 'dayjs';
import { z } from 'zod';

import { meetingSpotSchema } from '@/entities/Schedule/model/meetingSpot';

import type { components } from '@/shared/api/apiTypes';

import { MockApiError } from '../api';
import { getMockJoinedCrews, getMockMembership } from './crews';
import { getMockProfile, projectMockProfile } from './member';
import { mockMyInfo } from '../data/member';
import {
  createScheduleSeeds,
  type MockScheduleDetail,
  type MockScheduleRecord,
} from '../data/schedule';

type CreateRequest = components['schemas']['CreateScheduleRequest'];
type UpdateRequest = components['schemas']['UpdateScheduleRequest'];
const currentMemberId = mockMyInfo.result.id;
let schedules = createScheduleSeeds();
let nextId = 4;

export function resetScheduleMocks() {
  schedules = createScheduleSeeds();
  nextId = 4;
}

function fail(code: string, message: string, status = 400): never {
  throw new MockApiError(code, message, status);
}

function member(crewId: number) {
  return getMockMembership(crewId);
}

function find(crewId: number, scheduleId: number) {
  member(crewId);
  const record = schedules.find(
    (item) => item.crewId === crewId && item.detail.scheduleId === scheduleId
  );
  if (!record) fail('SCHEDULE_NOT_FOUND', '일정을 찾을 수 없습니다.', 404);
  if (record.detail.status === 'CANCELLED')
    fail('ALREADY_CANCELLED_SCHEDULE', '이미 삭제된 일정입니다.');
  return record;
}

function sortedParticipants(detail: MockScheduleDetail) {
  return detail.participants
    .map(projectMockProfile)
    .sort(
      (a, b) =>
        Number(b.isCreator) - Number(a.isCreator) ||
        Number(b.role === 'LEADER') - Number(a.role === 'LEADER') ||
        a.participatedAt.localeCompare(b.participatedAt) ||
        a.memberId - b.memberId
    );
}

function view(record: MockScheduleRecord): MockScheduleDetail {
  const { detail } = record;
  const isMine = detail.creatorId === currentMemberId;
  return {
    ...structuredClone(detail),
    currentParticipants: detail.participants.length,
    ...(isMine
      ? {
          creatorNickname: getMockProfile().nickname,
          creatorProfileImageUrl: getMockProfile().profileImageUrl,
        }
      : {}),
    isMine,
    isParticipating: detail.participants.some(
      (item) => item.memberId === currentMemberId
    ),
    isModifiable:
      isMine &&
      !detail.isCheckedIn &&
      dayjs().isBefore(dayjs(detail.meetingAt).subtract(1, 'hour')),
    isParticipationModifiable:
      !detail.isCheckedIn &&
      dayjs().isBefore(dayjs(detail.meetingAt).add(1, 'hour')),
    participants: sortedParticipants(detail),
    hasMoreParticipants: detail.participants.length > 10,
  };
}

function listItem(record: MockScheduleRecord) {
  const detail = view(record);
  return {
    scheduleId: detail.scheduleId,
    title: detail.title,
    runType: detail.runType,
    meetingAt: detail.meetingAt,
    placeName: detail.locationInfo.placeName,
    distance: detail.distance,
    pace: detail.pace,
    maxParticipants: detail.maxParticipants,
    currentParticipants: detail.currentParticipants,
    isMine: detail.isMine,
    isParticipating: detail.isParticipating,
    createdAt: detail.createdAt,
    status: detail.status,
  } satisfies components['schemas']['CrewScheduleListResponse'];
}

function sortedActive() {
  const joinedIds = new Set(getMockJoinedCrews().map((crew) => crew.crewId));
  return schedules
    .filter(
      (item) => item.detail.status === 'ACTIVE' && joinedIds.has(item.crewId)
    )
    .sort(
      (a, b) =>
        dayjs(a.detail.meetingAt).valueOf() -
          dayjs(b.detail.meetingAt).valueOf() ||
        a.detail.scheduleId - b.detail.scheduleId
    );
}

function validDate(value: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    dayjs(value).format('YYYY-MM-DD') !== value
  )
    fail('INVALID_INPUT_VALUE', '날짜 형식이 올바르지 않습니다.');
  return value;
}

export function getMockScheduleList(crewId: number, query: URLSearchParams) {
  member(crewId);
  const date = query.get('date');
  const start = query.get('startDate');
  const end = query.get('endDate');
  const yearMonth = query.get('yearMonth') || dayjs().format('YYYY-MM');
  const runType = query.get('runType');
  if (runType && runType !== 'REGULAR' && runType !== 'LIGHTNING')
    fail('INVALID_INPUT_VALUE', '런 종류가 올바르지 않습니다.');
  // API 문서의 우선순위: date > startDate/endDate > yearMonth > 현재 월
  let matchesDate: (value: string) => boolean;
  if (date) {
    validDate(date);
    matchesDate = (value) => value === date;
  } else if (start && end) {
    validDate(start);
    validDate(end);
    if (start > end)
      fail('INVALID_INPUT_VALUE', '날짜 범위가 올바르지 않습니다.');
    matchesDate = (value) => value >= start && value <= end;
  } else {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(yearMonth))
      fail('INVALID_INPUT_VALUE', '조회 연월이 올바르지 않습니다.');
    matchesDate = (value) => value.startsWith(yearMonth);
  }
  return sortedActive()
    .filter(
      (item) =>
        item.crewId === crewId &&
        matchesDate(dayjs(item.detail.meetingAt).format('YYYY-MM-DD')) &&
        (!runType || item.detail.runType === runType)
    )
    .map(listItem);
}

export function getMockScheduleCalendar(
  crewId: number,
  query: URLSearchParams
) {
  const calendarQuery = new URLSearchParams(query);
  calendarQuery.delete('runType');
  calendarQuery.delete('date');
  const days = new Map<
    string,
    { date: string; hasRegular: boolean; hasLightning: boolean }
  >();
  for (const item of getMockScheduleList(crewId, calendarQuery)) {
    const date = dayjs(item.meetingAt).format('YYYY-MM-DD');
    const day = days.get(date) ?? {
      date,
      hasRegular: false,
      hasLightning: false,
    };
    day.hasRegular ||= item.runType === 'REGULAR';
    day.hasLightning ||= item.runType === 'LIGHTNING';
    days.set(date, day);
  }
  return [...days.values()];
}

export function getMockScheduleDetail(crewId: number, scheduleId: number) {
  const detail = view(find(crewId, scheduleId));
  return { ...detail, participants: detail.participants.slice(0, 10) };
}

export function getMockParticipants(
  crewId: number,
  scheduleId: number,
  query: URLSearchParams
) {
  const all = sortedParticipants(find(crewId, scheduleId).detail);
  const size = Number(query.get('size') ?? 20);
  const cursor = query.get('cursorId');
  if (!Number.isInteger(size) || size < 1 || size > 100)
    fail('INVALID_INPUT_VALUE', '페이지 크기가 올바르지 않습니다.');
  const cursorIndex =
    cursor === null
      ? -1
      : all.findIndex((item) => item.memberId === Number(cursor));
  if (cursor !== null && cursorIndex < 0)
    fail('INVALID_INPUT_VALUE', '커서가 올바르지 않습니다.');
  const content = all.slice(cursorIndex + 1, cursorIndex + 1 + size);
  return {
    content,
    hasNext: cursorIndex + 1 + size < all.length,
    lastId: content.at(-1)?.memberId ?? 0,
  };
}

export function getMockMemberSchedules() {
  return sortedActive()
    .filter(
      (record) =>
        dayjs(record.detail.meetingAt).valueOf() >= Date.now() &&
        record.detail.participants.some((p) => p.memberId === currentMemberId)
    )
    .map(listItem);
}

export function getMockCheckInStatus(): components['schemas']['CheckInStatusResponse'] {
  const upcoming = getMockMemberSchedules();
  const today = upcoming.find((item) =>
    dayjs(item.meetingAt).isSame(dayjs(), 'day')
  );
  if (today) {
    const record = schedules.find(
      (item) => item.detail.scheduleId === today.scheduleId
    )!;
    const { detail } = record;
    return {
      hasScheduleToday: true,
      todayScheduleInfo: {
        scheduleId: detail.scheduleId,
        title: detail.title,
        runType: detail.runType,
        latitude: detail.locationInfo.latitude,
        longitude: detail.locationInfo.longitude,
        isCheckedIn: detail.isCheckedIn,
        isAvailableTime:
          Math.abs(dayjs(detail.meetingAt).diff(dayjs(), 'minute', true)) <= 60,
      },
    };
  }
  const next = upcoming[0];
  return {
    hasScheduleToday: false,
    ...(next
      ? {
          nextScheduleInfo: {
            title: next.title,
            daysLeft: dayjs(next.meetingAt)
              .startOf('day')
              .diff(dayjs().startOf('day'), 'day'),
          },
        }
      : {}),
  };
}

const commonFields = {
  title: z.string().trim().min(1).max(15),
  runType: z.enum(['REGULAR', 'LIGHTNING']),
  meetingAt: z.string().min(1),
  locationName: z.string().trim().min(1),
  address: z.string().trim().min(1),
  detailedLocation: meetingSpotSchema,
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  distance: z.number().int().min(1).max(999),
  pace: z.number().min(1).max(99),
  maxParticipants: z.number().int().min(1).max(999),
  description: z.string().trim().min(1),
  supplies: z.array(z.string().trim().min(1).max(15)).max(5).optional(),
};
const createSchema = z.object(commonFields);
const updateSchema = createSchema.extend({
  distance: commonFields.distance.optional(),
  pace: commonFields.pace.optional(),
  maxParticipants: commonFields.maxParticipants.optional(),
  description: z.string().optional(),
});

function checkInterval(meetingAt: string, excludedId?: number) {
  if (
    getMockMemberSchedules().some(
      (item) =>
        item.scheduleId !== excludedId &&
        Math.abs(dayjs(item.meetingAt).diff(dayjs(meetingAt), 'minute', true)) <
          60
    )
  )
    fail(
      'SCHEDULE_INTERVAL_TOO_CLOSE',
      '참여 중인 일정과 시작 시간이 너무 가깝습니다.'
    );
}

function validateMeeting(
  crewId: number,
  body: CreateRequest | UpdateRequest,
  original?: MockScheduleDetail
) {
  const crew = member(crewId);
  if (
    !dayjs(body.meetingAt).isValid() ||
    dayjs(body.meetingAt).valueOf() < Date.now()
  )
    fail('INVALID_SCHEDULE_TIME', '이미 지난 시간은 설정할 수 없습니다.');
  if (
    (body.runType === 'REGULAR' || original?.runType === 'REGULAR') &&
    crew.memberRole !== 'LEADER'
  )
    fail(
      'ONLY_LEADER_CAN_CREATE_REGULAR_RUN',
      '정기런은 리더만 등록하거나 수정할 수 있습니다.',
      403
    );
  checkInterval(body.meetingAt, original?.scheduleId);
}

function currentParticipant(crewId: number) {
  return {
    memberId: currentMemberId,
    nickname: getMockProfile().nickname,
    profileImageUrl: getMockProfile().profileImageUrl,
    role: member(crewId).memberRole,
    isCreator: false,
    participatedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
  };
}

export function createMockSchedule(crewId: number, body: CreateRequest) {
  const result = createSchema.safeParse(body);
  if (!result.success)
    fail('INVALID_INPUT_VALUE', '일정 입력값이 올바르지 않습니다.');
  const input = result.data;
  validateMeeting(crewId, input);
  const creator = currentParticipant(crewId);
  const detail: MockScheduleDetail = {
    scheduleId: nextId++,
    title: input.title,
    runType: input.runType,
    meetingAt: dayjs(input.meetingAt).format('YYYY-MM-DDTHH:mm:ss'),
    locationInfo: {
      placeName: input.locationName,
      address: input.address,
      meetingSpot: input.detailedLocation,
      latitude: input.latitude,
      longitude: input.longitude,
    },
    description: input.description,
    distance: input.distance,
    pace: input.pace,
    maxParticipants: input.maxParticipants,
    supplies: input.supplies ?? [],
    creatorId: currentMemberId,
    creatorNickname: creator.nickname,
    creatorProfileImageUrl: creator.profileImageUrl,
    creatorRole: creator.role,
    participants: [{ ...creator, isCreator: true }],
    currentParticipants: 1,
    isMine: true,
    isParticipating: true,
    isCheckedIn: false,
    isModifiable: true,
    isParticipationModifiable: true,
    hasMoreParticipants: false,
    createdAt: creator.participatedAt,
    status: 'ACTIVE',
  };
  schedules.push({ crewId, detail });
}

function editable(crewId: number, scheduleId: number) {
  const record = find(crewId, scheduleId);
  if (record.detail.creatorId !== currentMemberId)
    fail('FORBIDDEN_ERROR', '생성한 일정만 변경할 수 있습니다.', 403);
  if (!view(record).isModifiable)
    fail(
      'SCHEDULE_MODIFICATION_NOT_ALLOWED_TIME',
      '출석이 시작된 일정은 변경할 수 없습니다.'
    );
  return record;
}

export function updateMockSchedule(
  crewId: number,
  scheduleId: number,
  body: UpdateRequest
) {
  const record = editable(crewId, scheduleId);
  const result = updateSchema.safeParse(body);
  if (!result.success)
    fail('INVALID_INPUT_VALUE', '일정 입력값이 올바르지 않습니다.');
  const input = result.data;
  validateMeeting(crewId, input, record.detail);
  if (
    input.maxParticipants !== undefined &&
    input.maxParticipants < record.detail.participants.length
  )
    fail('EXCEEDED_MAX_PARTICIPANTS', '참여 인원보다 정원을 줄일 수 없습니다.');
  Object.assign(record.detail, {
    title: input.title,
    runType: input.runType,
    meetingAt: dayjs(input.meetingAt).format('YYYY-MM-DDTHH:mm:ss'),
    locationInfo: {
      placeName: input.locationName,
      address: input.address,
      meetingSpot: input.detailedLocation,
      latitude: input.latitude,
      longitude: input.longitude,
    },
    distance: input.distance ?? record.detail.distance,
    pace: input.pace ?? record.detail.pace,
    maxParticipants: input.maxParticipants ?? record.detail.maxParticipants,
    description: input.description ?? record.detail.description,
    supplies: input.supplies ?? [],
  });
}

export function deleteMockSchedule(crewId: number, scheduleId: number) {
  editable(crewId, scheduleId).detail.status = 'CANCELLED';
}

export function participateMockSchedule(
  crewId: number,
  scheduleId: number,
  cancel = false
) {
  const record = find(crewId, scheduleId);
  const detail = view(record);
  if (cancel && detail.isCheckedIn)
    fail('CANNOT_CANCEL_AFTER_CHECK_IN', '출석한 일정은 취소할 수 없습니다.');
  if (!detail.isParticipationModifiable)
    fail(
      'PARTICIPATION_AND_CANCEL_CLOSED',
      '참여 신청 및 취소가 마감되었습니다.'
    );
  if (cancel) {
    if (detail.isMine)
      fail(
        'CREATOR_CANNOT_CANCEL_PARTICIPATION',
        '생성자는 참여를 취소할 수 없습니다.'
      );
    if (!detail.isParticipating)
      fail('NOT_PARTICIPATING_SCHEDULE', '참여 중인 일정이 아닙니다.');
    record.detail.participants = record.detail.participants.filter(
      (item) => item.memberId !== currentMemberId
    );
  } else {
    if (detail.isParticipating)
      fail('ALREADY_PARTICIPATED', '이미 참여 중인 일정입니다.');
    if (detail.currentParticipants >= detail.maxParticipants)
      fail('EXCEEDED_MAX_PARTICIPANTS', '모집 인원이 마감되었습니다.');
    checkInterval(detail.meetingAt);
    record.detail.participants.push(currentParticipant(crewId));
  }
}
