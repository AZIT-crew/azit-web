import { useEffect, useId, useRef, useState } from 'react';

import type { AddressFormValues } from '@/features/Address/model/types';

import { isValidAddress } from '@/entities/Address/model/validation';

import { useAddressSelectionStore } from '@/shared/store/addressSelection';

export function useAddressForm(initialData?: Partial<AddressFormValues>) {
  const formKey = useId();
  const hydrated = useRef(false);
  const [formValues, setFormValues] = useState<AddressFormValues>({
    recipientName: '',
    phoneNumber: '',
    zipcode: '',
    baseAddress: '',
    detailAddress: '',
    isDefault: false,
  });

  useEffect(() => {
    if (initialData && !hydrated.current) {
      hydrated.current = true;
      setFormValues((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const isValidForm = isValidAddress(formValues);

  // 외부에서 데이터를 주입받아 폼을 초기화해야 할 때 사용
  const resetForm = (data: Partial<AddressFormValues>) => {
    setFormValues((prev) => ({ ...prev, ...data }));
  };

  const selectedAddress = useAddressSelectionStore(
    (state) => state.selectedAddress
  );
  const clearAddress = useAddressSelectionStore((state) => state.clearAddress);

  useEffect(() => {
    if (selectedAddress?.formKey === formKey) {
      setFormValues((prev) => ({
        ...prev,
        zipcode: selectedAddress.zipcode,
        baseAddress: selectedAddress.baseAddress,
        detailAddress:
          prev.baseAddress === selectedAddress.baseAddress &&
          prev.zipcode === selectedAddress.zipcode
            ? prev.detailAddress
            : '',
      }));
      clearAddress();
    }
  }, [selectedAddress, clearAddress, formKey]);

  return {
    formValues,
    setFormValues,
    isValidForm,
    resetForm,
    formKey,
  };
}
