import type { components } from '@/shared/api/apiTypes';
import { MAX_CREW_COUNT, MAX_CREW_NAME_LENGTH } from '@/shared/constants/crew';
import { REGION_OPTIONS } from '@/shared/constants/region';

import { MockApiError } from '../api';
import { getMockProfile, projectMockProfile } from './member';
import { mockCrewJoinRequests, mockCrewMembers } from '../data/crew';
import { mockMyCrews } from '../data/member';

type Membership = Required<components['schemas']['MyCrewResponse']>;
type Member = Required<components['schemas']['CrewMemberDetailResponse']>;
type JoinRequest = Required<components['schemas']['JoinRequestMemberResponse']>;
type CrewState = {
  id: number;
  name: string;
  image: string;
  invitationCode: string;
  category: string;
  region: string;
  membership: Pick<Membership, 'memberRole' | 'memberStatus'> | null;
  cooldown?: { until: number; code: string; message: string };
  description: string;
  members: Member[];
  requests: JoinRequest[];
  dissolved: boolean;
  notifications?: { regularRunEnabled: boolean; lightningRunEnabled: boolean };
};
const currentMemberId = 1;
let crews: CrewState[];
let nextMemberId: number;
let nextCrewId: number;
let codeSequence: number;

export function resetCrewMocks() {
  crews = mockMyCrews.result.map((membership) => ({
    id: membership.crewId,
    name: membership.crewName,
    image: membership.crewImageUrl,
    invitationCode: membership.invitationCode,
    category: 'RUNNING',
    region: 'SEOUL',
    membership: {
      memberRole: membership.memberRole,
      memberStatus: membership.memberStatus,
    },
    description:
      membership.crewId === 1
        ? '한강에서 함께 달려요!'
        : '이른 아침 함께 달려요!',
    members:
      membership.crewId === 1
        ? structuredClone(mockCrewMembers.result.content)
        : [
            {
              id: 21,
              memberId: 1,
              nickname: '테스터',
              profileImageUrl: membership.crewImageUrl,
              role: 'MEMBER',
              joinedDate: '2026-02-01T00:00:00.000Z',
            },
            {
              id: 22,
              memberId: 2,
              nickname: '새벽리더',
              profileImageUrl: membership.crewImageUrl,
              role: 'LEADER',
              joinedDate: '2026-01-01T00:00:00.000Z',
            },
          ],
    requests:
      membership.crewId === 1
        ? structuredClone(mockCrewJoinRequests.result)
        : [],
    dissolved: false,
  }));
  // 현재 사용자가 아직 가입하지 않은 초대 코드 QA용 크루.
  crews.push({
    id: 3,
    name: '한낮러너스',
    image: '/icons/icon-crew-default.svg',
    invitationCode: 'NOON03',
    category: 'RUNNING',
    region: 'SEOUL',
    membership: null,
    description: '점심시간에 함께 달려요!',
    members: [
      {
        id: 23,
        memberId: 4,
        nickname: '한낮리더',
        profileImageUrl: '/icons/icon-crew-default.svg',
        role: 'LEADER',
        joinedDate: '2026-01-01T00:00:00.000Z',
      },
    ],
    requests: [],
    dissolved: false,
  });
  nextMemberId = 30;
  nextCrewId = 4;
  codeSequence = 1;
}
resetCrewMocks();

function fail(code: string, message: string, status = 400): never {
  throw new MockApiError(code, message, status);
}
function crew(crewId: number) {
  const found = crews.find((item) => item.id === crewId && !item.dissolved);
  if (!found) fail('CREW_NOT_FOUND', '크루를 찾을 수 없습니다.', 404);
  return found;
}
function membershipResponse(found: CrewState): Membership {
  if (!found.membership)
    fail('NOT_A_CREW_MEMBER', '가입된 크루가 아닙니다.', 403);
  return {
    crewId: found.id,
    crewName: found.name,
    crewImageUrl: found.image,
    invitationCode: found.invitationCode,
    ...found.membership,
  };
}
export function getMockMembership(crewId: number) {
  const found = crews.find((item) => item.id === crewId && !item.dissolved);
  if (!found || found.membership?.memberStatus !== 'JOINED')
    fail('NOT_A_CREW_MEMBER', '가입된 크루가 아닙니다.', 403);
  return membershipResponse(found);
}
function leader(crewId: number, code = 'NOT_CREW_LEADER') {
  if (getMockMembership(crewId).memberRole !== 'LEADER')
    fail(code, '크루 리더만 사용할 수 있습니다.', 403);
  return crew(crewId);
}
export function getMockMyCrews() {
  return crews
    .filter(
      (item) =>
        !item.dissolved &&
        item.membership &&
        !['EXITED', 'CANCELLED'].includes(item.membership.memberStatus)
    )
    .map(membershipResponse);
}
export function getMockJoinedCrews() {
  return getMockMyCrews()
    .filter((item) => item.memberStatus === 'JOINED')
    .map((item) => ({
      crewId: item.crewId,
      name: item.crewName,
      imageUrl: item.crewImageUrl,
      description: crew(item.crewId).description,
    }));
}

function notificationSetting(
  found: CrewState
): components['schemas']['CrewNotificationSettingResponse'] {
  const { regularRunEnabled, lightningRunEnabled } = found.notifications ?? {
    regularRunEnabled: true,
    lightningRunEnabled: true,
  };
  return {
    crewId: found.id,
    crewName: found.name,
    crewImageUrl: found.image,
    regularRunEnabled,
    lightningRunEnabled,
    allEnabled: regularRunEnabled && lightningRunEnabled,
  };
}
export function getMockCrewNotificationSettings() {
  return getMockJoinedCrews().map(({ crewId }) =>
    notificationSetting(crew(crewId))
  );
}
export function updateMockCrewNotificationSetting(
  crewId: number,
  body: components['schemas']['UpdateCrewNotificationSettingRequest']
) {
  getMockMembership(crewId);
  const values = [
    body.allEnabled,
    body.regularRunEnabled,
    body.lightningRunEnabled,
  ];
  if (
    values.every((value) => value == null) ||
    values.some((value) => value != null && typeof value !== 'boolean')
  )
    fail('INVALID_INPUT_VALUE', '변경할 알림 설정을 확인해주세요.');
  const found = crew(crewId);
  const current = notificationSetting(found);
  found.notifications = {
    regularRunEnabled:
      body.regularRunEnabled ?? body.allEnabled ?? current.regularRunEnabled,
    lightningRunEnabled:
      body.lightningRunEnabled ??
      body.allEnabled ??
      current.lightningRunEnabled,
  };
  return notificationSetting(found);
}
function checkCrewLimit() {
  if (
    getMockMyCrews().filter((item) =>
      ['JOINED', 'REQUESTED'].includes(item.memberStatus)
    ).length >= MAX_CREW_COUNT
  )
    fail(
      'CREW_JOIN_LIMIT_EXCEEDED',
      `크루는 최대 ${MAX_CREW_COUNT}개까지 가입할 수 있습니다.`
    );
}
function newInvitationCode() {
  return `N${String(codeSequence++).padStart(5, '0')}`;
}
function currentMember(role: Member['role']): Member {
  return {
    id: nextMemberId++,
    memberId: currentMemberId,
    nickname: getMockProfile().nickname,
    profileImageUrl: getMockProfile().profileImageUrl,
    role,
    joinedDate: new Date().toISOString(),
  };
}
export function createMockCrew(
  body: components['schemas']['CreateCrewRequest']
) {
  if (
    typeof body.name !== 'string' ||
    !body.name ||
    body.name.length > MAX_CREW_NAME_LENGTH ||
    body.category !== 'RUNNING' ||
    !REGION_OPTIONS.some((region) => region.id === body.region)
  )
    fail('INVALID_INPUT_VALUE', '크루 입력값을 확인해주세요.');
  if (!/^[가-힣a-zA-Z0-9]+$/.test(body.name))
    fail(
      'INVALID_CREW_NAME_CHARACTERS',
      '크루 이름은 한글, 영문, 숫자만 사용할 수 있습니다.'
    );
  checkCrewLimit();
  const found: CrewState = {
    id: nextCrewId++,
    name: body.name,
    image: '/icons/icon-crew-default.svg',
    invitationCode: newInvitationCode(),
    category: body.category,
    region: body.region,
    membership: { memberRole: 'LEADER', memberStatus: 'JOINED' },
    description: '',
    members: [currentMember('LEADER')],
    requests: [],
    dissolved: false,
  };
  crews.push(found);
  return { invitationCode: found.invitationCode, crewImageUrl: found.image };
}
export function joinMockCrew(invitationCode: string | undefined) {
  const found = crews.find(
    (item) => !item.dissolved && item.invitationCode === invitationCode
  );
  if (!found) fail('CREW_NOT_FOUND', '크루를 찾을 수 없습니다.', 404);
  if (
    found.membership &&
    ['JOINED', 'REQUESTED'].includes(found.membership.memberStatus)
  )
    fail('ALREADY_JOINED_CREW', '이미 가입했거나 가입을 신청한 크루입니다.');
  if (found.cooldown && Date.now() < found.cooldown.until)
    fail(found.cooldown.code, found.cooldown.message);
  checkCrewLimit();
  found.membership = { memberRole: 'MEMBER', memberStatus: 'REQUESTED' };
  found.notifications = undefined;
  found.cooldown = undefined;
  found.requests.push({
    memberId: currentMemberId,
    nickname: getMockProfile().nickname,
    profileImageUrl: getMockProfile().profileImageUrl,
    requestedAt: new Date().toISOString(),
  });
}
export function getMockCrewJoinStatus(crewId: number) {
  const found = crew(crewId);
  return {
    crewId,
    name: found.name,
    crewImageUrl: found.image,
    status: membershipResponse(found).memberStatus,
  } satisfies components['schemas']['CrewJoinStatusResponse'];
}
export function cancelMockJoinRequest(crewId: number) {
  const found = crew(crewId);
  if (found.membership?.memberStatus !== 'REQUESTED')
    fail('JOIN_REQUEST_NOT_FOUND', '가입 요청을 찾을 수 없습니다.', 404);
  found.membership.memberStatus = 'CANCELLED';
  found.requests = found.requests.filter(
    (item) => item.memberId !== currentMemberId
  );
  found.cooldown = {
    until: Date.now() + 60 * 60 * 1000,
    code: 'CANCEL_REJOINING_COOLDOWN',
    message: '가입 신청 취소 후 1시간 동안은 다시 신청할 수 없습니다.',
  };
}
// 다른 계정인 리더의 결정을 모의하는 QA helper. 실제 API 권한 검사는 우회하지 않는다.
export function resolveMockJoinRequest(crewId: number, approve: boolean) {
  const found = crew(crewId);
  if (found.membership?.memberStatus !== 'REQUESTED')
    fail('JOIN_REQUEST_NOT_FOUND', '가입 요청을 찾을 수 없습니다.', 404);
  found.membership.memberStatus = approve ? 'JOINED' : 'REJECTED';
  found.requests = found.requests.filter(
    (item) => item.memberId !== currentMemberId
  );
  if (approve) found.members.push(currentMember('MEMBER'));
}
export function getMockCrewInfo(crewId: number) {
  const membership = getMockMembership(crewId);
  return {
    name: membership.crewName,
    crewImageUrl: membership.crewImageUrl,
    description: crew(crewId).description,
  };
}
export function updateMockCrewInfo(
  crewId: number,
  body: components['schemas']['UpdateCrewProfileRequest']
) {
  const found = leader(crewId);
  if (
    !body.name.trim() ||
    body.name.length > MAX_CREW_NAME_LENGTH ||
    typeof body.imageUrl !== 'string' ||
    (body.description?.length ?? 0) > 20
  )
    fail('INVALID_INPUT_VALUE', '크루 입력값을 확인해주세요.');
  if (body.name !== found.name && !/^[가-힣a-zA-Z0-9]+$/.test(body.name))
    fail(
      'INVALID_CREW_NAME_CHARACTERS',
      '크루 이름은 한글, 영문, 숫자만 사용할 수 있습니다.'
    );
  found.name = body.name.trim();
  found.image = body.imageUrl;
  found.description = body.description ?? '';
}
export function getMockCrewInvitation(code: string) {
  const found = crews.find(
    (item) => !item.dissolved && item.invitationCode === code
  );
  if (!found)
    fail('INVALID_INVITATION_CODE', '유효하지 않은 초대 코드입니다.', 404);
  return {
    crewId: found.id,
    name: found.name,
    crewImageUrl: found.image,
    description: found.description,
    memberCount: found.members.length,
    category: found.category,
  };
}
export function reissueMockInvitationCode(crewId: number) {
  const found = leader(crewId);
  found.invitationCode = newInvitationCode();
  return { invitationCode: found.invitationCode };
}
export function getMockCrewMembers(crewId: number, query: URLSearchParams) {
  getMockMembership(crewId);
  const members = [...crew(crewId).members].sort(
    (a, b) =>
      Number(b.role === 'LEADER') - Number(a.role === 'LEADER') || a.id - b.id
  );
  const size = Number(query.get('size') ?? 20);
  const cursor = query.get('cursorId');
  const index =
    cursor === null
      ? -1
      : members.findIndex((item) => item.id === Number(cursor));
  if (
    !Number.isInteger(size) ||
    size < 1 ||
    size > 100 ||
    (cursor !== null && index < 0)
  )
    fail('INVALID_INPUT_VALUE', '페이지 정보를 확인해주세요.');
  const content = members
    .slice(index + 1, index + 1 + size)
    .map(projectMockProfile);
  return structuredClone({
    totalCount: members.length,
    content,
    hasNext: index + 1 + size < members.length,
    lastId: content.at(-1)?.id ?? 0,
  });
}
export function getMockCrewJoinRequests(crewId: number) {
  return structuredClone(leader(crewId, 'FORBIDDEN_ERROR').requests);
}
export function decideMockCrewJoinRequest(
  crewId: number,
  memberId: number,
  approve: boolean
) {
  const found = leader(crewId, 'FORBIDDEN_ERROR');
  const request = found.requests.find((item) => item.memberId === memberId);
  if (!request)
    fail('JOIN_REQUEST_NOT_FOUND', '가입 요청을 찾을 수 없습니다.', 404);
  if (approve)
    found.members.push({
      id: nextMemberId++,
      memberId,
      nickname: request.nickname,
      profileImageUrl: request.profileImageUrl,
      role: 'MEMBER',
      joinedDate: new Date().toISOString(),
    });
  found.requests = found.requests.filter((item) => item.memberId !== memberId);
}
export function deleteMockCrewMember(crewId: number, memberId: number) {
  const found = leader(crewId);
  if (memberId === currentMemberId)
    fail('CANNOT_KICK_SELF', '본인은 방출할 수 없습니다.');
  if (!found.members.some((item) => item.memberId === memberId))
    fail('NOT_A_CREW_MEMBER', '가입된 멤버가 아닙니다.');
  found.members = found.members.filter((item) => item.memberId !== memberId);
}
export function exitMockCrew(crewId: number) {
  if (getMockMembership(crewId).memberRole === 'LEADER')
    fail('CANNOT_WITHDRAW_AS_LEADER', '리더는 크루를 탈퇴할 수 없습니다.');
  const found = crew(crewId);
  found.membership!.memberStatus = 'EXITED';
  found.notifications = undefined;
  found.members = found.members.filter(
    (item) => item.memberId !== currentMemberId
  );
  found.cooldown = {
    until: Date.now() + 24 * 60 * 60 * 1000,
    code: 'EXIT_REJOINING_COOLDOWN',
    message: '크루 탈퇴 후 24시간 동안은 다시 가입할 수 없습니다.',
  };
}
export function dissolveMockCrew(crewId: number) {
  leader(crewId).dissolved = true;
}
