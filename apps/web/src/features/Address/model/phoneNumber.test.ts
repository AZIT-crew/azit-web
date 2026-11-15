import { describe, expect, it } from 'vitest';

import { ADDRESS_PHONE_PATTERN } from '@/entities/Address/model/validation';

import { formatPhoneNumber } from './phoneNumber';
import { resolvePostcodeAddress } from './postcode';
describe('배송지 연락처와 검색 결과', () => {
  it.each([
    ['01012345678', '010-1234-5678'],
    ['0101234567', '010-123-4567'],
    ['0212345678', '02-1234-5678'],
    ['021234567', '02-123-4567'],
    ['12-345-6789', '12-345-6789'],
  ])('%s를 계약에 맞는 %s로 표시한다', (raw, expected) => {
    expect(formatPhoneNumber(raw)).toBe(expected);
    expect(ADDRESS_PHONE_PATTERN.test(expected)).toBe(true);
  });
  it('미완성 번호는 유효하지 않고, 숫자 이외 문자는 제거한다', () => {
    expect(formatPhoneNumber('abc01012')).toBe('010-12');
    expect(ADDRESS_PHONE_PATTERN.test(formatPhoneNumber('1'))).toBe(false);
  });
  it('도로명 선택은 참고 항목을 붙이고 지번 선택은 선택한 지번을 보존한다', () => {
    const data = {
      userSelectedType: 'R',
      roadAddress: '서울 서초구 반포대로 45',
      jibunAddress: '서울 서초구 서초동 1',
      bname: '서초동',
      buildingName: 'QA아파트',
      apartment: 'Y',
    };
    expect(resolvePostcodeAddress(data).baseAddress).toBe(
      '서울 서초구 반포대로 45 (서초동, QA아파트)'
    );
    expect(resolvePostcodeAddress({ ...data, userSelectedType: 'J' })).toEqual({
      baseAddress: data.jibunAddress,
      extraAddress: '',
    });
  });
});
