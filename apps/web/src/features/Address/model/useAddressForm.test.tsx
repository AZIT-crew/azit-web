import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useAddressSelectionStore } from '@/shared/store/addressSelection';

import { useAddressForm } from './useAddressForm';
const initial = {
  recipientName: '테스터',
  phoneNumber: '010-1234-5678',
  zipcode: '06579',
  baseAddress: '이전 주소',
  detailAddress: '101호',
  isDefault: true,
};
let root: Root;
let container: HTMLDivElement;
let forms: ReturnType<typeof useAddressForm>[];
function Form({ index, data }: { index: number; data?: typeof initial }) {
  forms[index] = useAddressForm(data);
  return null;
}
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  root = createRoot(container);
  forms = [];
  useAddressSelectionStore.getState().clearAddress();
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  useAddressSelectionStore.getState().clearAddress();
});
describe('배송지 입력 상태 보존과 검색 결과 소유자', () => {
  it('같은 주소 재조회는 작성 중인 필드를 초기값으로 덮어쓰지 않는다', async () => {
    await act(async () => root.render(<Form index={0} data={initial} />));
    await act(async () =>
      forms[0]!.setFormValues({
        ...forms[0]!.formValues,
        recipientName: '작성 중',
      })
    );
    await act(async () =>
      root.render(<Form index={0} data={{ ...initial }} />)
    );
    expect(forms[0]!.formValues.recipientName).toBe('작성 중');
  });
  it('검색 결과는 요청한 폼만 갱신하고 새 주소의 이전 상세주소는 지운다', async () => {
    await act(async () =>
      root.render(
        <>
          <Form index={0} data={initial} />
          <Form index={1} data={initial} />
        </>
      )
    );
    await act(async () =>
      useAddressSelectionStore.getState().setSelectedAddress({
        formKey: forms[1]!.formKey,
        zipcode: '13494',
        baseAddress: '새 주소',
        extraAddress: '',
      })
    );
    expect(forms[0]!.formValues).toEqual(initial);
    expect(forms[1]!.formValues).toEqual({
      ...initial,
      zipcode: '13494',
      baseAddress: '새 주소',
      detailAddress: '',
    });
    expect(forms[1]!.isValidForm).toBe(false);
    expect(useAddressSelectionStore.getState().selectedAddress).toBeNull();
  });
  it('같은 주소를 다시 선택하면 입력한 상세주소를 유지한다', async () => {
    await act(async () => root.render(<Form index={0} data={initial} />));
    await act(async () =>
      useAddressSelectionStore.getState().setSelectedAddress({
        formKey: forms[0]!.formKey,
        zipcode: initial.zipcode,
        baseAddress: initial.baseAddress,
        extraAddress: '',
      })
    );
    expect(forms[0]!.formValues).toEqual(initial);
    expect(forms[0]!.isValidForm).toBe(true);
  });
});
