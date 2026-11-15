import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { handlers } from './handlers';
import { resetAddressMocks, setMockAddressesForQa } from './state/addresses';
const server = setupServer(...handlers);
const api = 'https://mock-api.azitcrew.com/api/v1/addresses';
const payload = {
  recipientName: '배송QA',
  phoneNumber: '010-1234-5678',
  zipcode: '13494',
  baseAddress: '경기 성남시 분당구 판교역로 166',
  detailAddress: '3층',
  isDefault: false,
};
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(resetAddressMocks);
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
async function send(path = '', method = 'GET', body?: unknown) {
  const response = await fetch(api + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}
describe('배송지 API 상태와 계약', () => {
  it('기본 배송지 우선·그 외 최신순이고 등록 응답은 Void다', async () => {
    const created = await send('', 'POST', payload);
    expect(created).toEqual({
      status: 200,
      body: { code: 'SUCCESS', message: '요청에 성공했습니다.' },
    });
    expect((await send()).body.result.map((a: { id: number }) => a.id)).toEqual(
      [1, 3, 2]
    );
    expect((await send()).body.result[1]).toMatchObject(payload);
  });
  it('첫 배송지는 요청이 false여도 기본 배송지가 된다', async () => {
    setMockAddressesForQa([]);
    await send('', 'POST', payload);
    expect((await send()).body.result).toEqual([
      { ...payload, id: 1, isDefault: true },
    ]);
  });
  it('새 기본 배송지 등록 시 기존 기본을 해제하고 텍스트 공백을 정리한다', async () => {
    await send('', 'POST', {
      ...payload,
      recipientName: ' 배송QA ',
      isDefault: true,
    });
    const list = (await send()).body.result;
    expect(
      list
        .filter((a: { isDefault: boolean }) => a.isDefault)
        .map((a: { id: number }) => a.id)
    ).toEqual([3]);
    expect(list[0].recipientName).toBe('배송QA');
  });
  it('수정·기본 변경·삭제를 다음 조회에 반영한다', async () => {
    await send('/2', 'PUT', { ...payload, isDefault: true });
    let list = (await send()).body.result;
    expect(list.map((a: { id: number }) => a.id)).toEqual([2, 1]);
    expect(list[0]).toMatchObject({ ...payload, id: 2, isDefault: true });
    expect(list[1].isDefault).toBe(false);
    expect((await send('/1', 'DELETE')).status).toBe(200);
    list = (await send()).body.result;
    expect(list.map((a: { id: number }) => a.id)).toEqual([2]);
    expect((await send('/1', 'PUT', payload)).body.code).toBe(
      'ADDRESS_NOT_FOUND'
    );
  });
  it('기본 배송지 삭제·없는 주소·다른 회원 소유 주소를 계약대로 거절한다', async () => {
    expect(await send('/invalid', 'DELETE')).toMatchObject({
      status: 400,
      body: { code: 'TYPE_MISMATCH_ERROR' },
    });
    expect(await send('/1', 'DELETE')).toMatchObject({
      status: 400,
      body: { code: 'CANNOT_DELETE_DEFAULT_ADDRESS' },
    });
    expect(await send('/999', 'DELETE')).toMatchObject({
      status: 404,
      body: { code: 'ADDRESS_NOT_FOUND' },
    });
    for (const method of ['PUT', 'DELETE'])
      expect(
        await send('/900', method, method === 'PUT' ? payload : undefined)
      ).toMatchObject({
        status: 403,
        body: { code: 'FORBIDDEN_ADDRESS_ACCESS' },
      });
    expect((await send()).body.result).toHaveLength(2);
  });
  it('필수값 누락과 잘못된 연락처를 성공 응답으로 바꾸지 않는다', async () => {
    const original = (await send()).body.result;
    for (const method of ['POST', 'PUT']) {
      const path = method === 'PUT' ? '/1' : '';
      for (const invalid of [
        null,
        {},
        { ...payload, detailAddress: '  ' },
        { ...payload, isDefault: null },
      ])
        expect(await send(path, method, invalid)).toMatchObject({
          status: 400,
          body: { code: 'INVALID_ADDRESS_INPUT' },
        });
      for (const phoneNumber of ['1', '01012345678', '010-12-1234'])
        expect(
          await send(path, method, { ...payload, phoneNumber })
        ).toMatchObject({ status: 400, body: { code: 'INVALID_INPUT_VALUE' } });
    }
    expect((await send()).body.result).toEqual(original);
  });
  it('계약의 2~3자리 국번과 3~4자리 중간 번호를 허용한다', async () => {
    for (const phoneNumber of [
      '02-123-4567',
      '02-1234-5678',
      '010-123-4567',
      '010-1234-5678',
    ])
      expect((await send('', 'POST', { ...payload, phoneNumber })).status).toBe(
        200
      );
  });
});
