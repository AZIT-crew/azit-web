import dayjs from 'dayjs';

import { nicknameSchema } from '@/entities/User/model/profile';

import type { components } from '@/shared/api/apiTypes';

import { MockApiError, type MockResponse } from '../api';
import { mockMyInfo, mockOptionalTerms, mockProviders } from '../data/member';

let myInfo = structuredClone(mockMyInfo);
let optionalTerms: MockResponse<'get', '/api/v1/members/me/terms/optional'> =
  structuredClone(mockOptionalTerms);
type Provider = Required<components['schemas']['LinkedProviderItem']>;
let providers: Provider[];

export function resetMockMemberState() {
  myInfo = structuredClone(mockMyInfo);
  optionalTerms = structuredClone(mockOptionalTerms);
  providers = structuredClone(mockProviders.result.providers);
}
resetMockMemberState();
export const getMockMyInfo = () => structuredClone(myInfo);
export const getMockProfile = () => structuredClone(myInfo.result);
export function projectMockProfile<
  T extends { memberId: number; nickname: string; profileImageUrl: string },
>(member: T): T {
  return member.memberId === myInfo.result.id
    ? {
        ...member,
        nickname: myInfo.result.nickname,
        profileImageUrl: myInfo.result.profileImageUrl,
      }
    : { ...member };
}
export function updateMockProfile(
  body: components['schemas']['UpdateMemberProfileRequest']
) {
  if (!nicknameSchema.safeParse(body.nickname).success)
    throw new MockApiError(
      'INVALID_INPUT_VALUE',
      '닉네임은 10자 이내의 한글, 영문, 숫자로 입력해주세요.',
      400
    );
  let isDefault = false;
  try {
    const url = new URL(body.imageUrl);
    isDefault =
      ['https:', 'http:'].includes(url.protocol) &&
      url.pathname.includes('/default/');
  } catch {
    /* 현재 이미지의 상대 경로는 아래에서 허용한다. */
  }
  if (body.imageUrl !== myInfo.result.profileImageUrl && !isDefault)
    throw new MockApiError(
      'INVALID_INPUT_VALUE',
      '사용할 수 없는 프로필 이미지입니다.',
      400
    );
  myInfo.result.nickname = body.nickname;
  myInfo.result.profileImageUrl = body.imageUrl;
}
export const getMockOptionalTerms = () => structuredClone(optionalTerms);
export function updateMockOptionalTerms(
  body: components['schemas']['UpdateOptionalTermsRequest']
) {
  if (
    (body.marketingAgreed == null && body.notificationAgreed == null) ||
    (body.marketingAgreed != null &&
      typeof body.marketingAgreed !== 'boolean') ||
    (body.notificationAgreed != null &&
      typeof body.notificationAgreed !== 'boolean')
  )
    throw new MockApiError(
      'INVALID_INPUT_VALUE',
      '변경할 동의 항목을 확인해주세요.',
      400
    );
  const changedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
  if (body.marketingAgreed != null)
    optionalTerms.result.marketing = {
      agreed: body.marketingAgreed,
      changedAt,
    };
  if (body.notificationAgreed != null)
    optionalTerms.result.notification = {
      agreed: body.notificationAgreed,
      changedAt,
    };
  return getMockOptionalTerms();
}
export function getMockProviders() {
  const linkedCount = providers.filter((item) => item.isLinked).length;
  return {
    providers: providers.map((item) => ({
      ...item,
      isUnlinkable: item.isLinked && linkedCount > 1,
    })),
  };
}
export function unlinkMockProvider(provider: string) {
  const found = providers.find(
    (item) => item.provider === provider && item.isLinked
  );
  if (!found)
    throw new MockApiError(
      'PROVIDER_NOT_LINKED',
      '연동되어 있지 않은 계정입니다.',
      400
    );
  if (providers.filter((item) => item.isLinked).length <= 1)
    throw new MockApiError(
      'CANNOT_UNLINK_LAST_PROVIDER',
      '마지막 로그인 수단은 해제할 수 없어요.',
      400
    );
  found.isLinked = false;
  found.email = '';
  found.linkedAt = '';
}
// 외부 OAuth는 실행하지 않고, 두 계정이 연결된 상황만 QA할 수 있게 한다.
export function setMockProvidersForQa(value: Provider[]) {
  providers = structuredClone(value);
}
