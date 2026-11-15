import type { DeliveryAddressResult } from '@/entities/Address/model';
import {
  isCompleteAddress,
  isValidAddress,
  normalizeAddress,
} from '@/entities/Address/model/validation';

import { MockApiError } from '../api';
import { mockAddressList } from '../data/address';

type StoredAddress = DeliveryAddressResult & { memberId: number };
const memberId = 1;
let addresses: StoredAddress[] = [];
let nextId = 3;

export function resetAddressMocks() {
  addresses = mockAddressList.result.map((address) => ({
    ...address,
    memberId,
  }));
  // 소유권 오류 QA용 다른 회원의 주소. 내 목록에는 노출하지 않는다.
  addresses.push({ ...mockAddressList.result[1]!, id: 900, memberId: 2 });
  nextId = 3;
}
resetAddressMocks();

export function getMockAddresses(): DeliveryAddressResult[] {
  return addresses
    .filter((address) => address.memberId === memberId)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || b.id - a.id)
    .map(({ memberId: _memberId, ...address }) => ({ ...address }));
}
function findAddress(id: number) {
  if (!Number.isSafeInteger(id))
    throw new MockApiError(
      'TYPE_MISMATCH_ERROR',
      '데이터 타입이 일치하지 않습니다.',
      400
    );
  const address = addresses.find((item) => item.id === id);
  if (!address)
    throw new MockApiError(
      'ADDRESS_NOT_FOUND',
      '존재하지 않는 배송지입니다.',
      404
    );
  if (address.memberId !== memberId)
    throw new MockApiError(
      'FORBIDDEN_ADDRESS_ACCESS',
      '해당 배송지 설정에 대한 권한이 없습니다.',
      403
    );
  return address;
}
function validateAddress(value: unknown) {
  if (!isCompleteAddress(value))
    throw new MockApiError(
      'INVALID_ADDRESS_INPUT',
      '배송지 필수 정보가 누락되었습니다.',
      400
    );
  if (!isValidAddress(value))
    throw new MockApiError(
      'INVALID_INPUT_VALUE',
      '유효하지 않은 입력 값입니다.',
      400
    );
  return normalizeAddress(value);
}
function clearDefault() {
  for (const address of addresses)
    if (address.memberId === memberId) address.isDefault = false;
}
export function createMockAddress(value: unknown) {
  const payload = validateAddress(value);
  payload.isDefault = payload.isDefault || getMockAddresses().length === 0;
  if (payload.isDefault) clearDefault();
  addresses.push({ ...payload, id: nextId++, memberId });
}
export function updateMockAddress(id: number, value: unknown) {
  const address = findAddress(id);
  const payload = validateAddress(value);
  if (payload.isDefault) clearDefault();
  Object.assign(address, payload);
}
export function deleteMockAddress(id: number) {
  const address = findAddress(id);
  if (address.isDefault)
    throw new MockApiError(
      'CANNOT_DELETE_DEFAULT_ADDRESS',
      '기본 배송지는 삭제할 수 없습니다. 다른 주소를 기본으로 설정한 후 삭제해주세요.',
      400
    );
  addresses = addresses.filter((item) => item.id !== id);
}
export function setMockAddressesForQa(value: DeliveryAddressResult[]) {
  addresses = value.map((address) => ({ ...address, memberId }));
  nextId = Math.max(0, ...value.map((address) => address.id)) + 1;
}
