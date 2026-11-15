import { Button } from '@azit/design-system/button';
import { Input } from '@azit/design-system/input';

import { formatPhoneNumber } from '@/features/Address/model/phoneNumber';
import type { AddressFormValues } from '@/features/Address/model/types';
import * as styles from '@/features/Address/styles/AddressRegisterForm.css';

import { ADDRESS_PHONE_PATTERN } from '@/entities/Address/model/validation';

export interface AddressFormProps {
  formId: string;
  values: AddressFormValues;
  onValuesChange: (values: AddressFormValues) => void;
  onAddressSearchClick: () => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
}

export function AddressForm({
  formId,
  values,
  onValuesChange,
  onAddressSearchClick,
  onSubmit,
  disabled = false,
}: AddressFormProps) {
  const handleRecipientNameChange = (value: string) => {
    onValuesChange({ ...values, recipientName: value });
  };

  const handlePhoneNumberChange = (value: string) => {
    onValuesChange({ ...values, phoneNumber: formatPhoneNumber(value) });
  };

  const handleZipcodeChange = (value: string) => {
    onValuesChange({ ...values, zipcode: value });
  };

  const handleBaseAddressChange = (value: string) => {
    onValuesChange({ ...values, baseAddress: value });
  };

  const handleDetailAddressChange = (value: string) => {
    onValuesChange({ ...values, detailAddress: value });
  };

  return (
    <form id={formId} className={styles.form} onSubmit={onSubmit}>
      <div className={styles.section}>
        <label className={styles.label} htmlFor={`${formId}-recipient-name`}>
          수령인
        </label>
        <Input
          id={`${formId}-recipient-name`}
          readOnly={disabled}
          className={styles.inputBase}
          value={values.recipientName}
          onChange={(e) => handleRecipientNameChange(e.target.value)}
          placeholder="수령인을 입력해주세요"
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label} htmlFor={`${formId}-phone-number`}>
          연락처
        </label>
        <Input
          id={`${formId}-phone-number`}
          readOnly={disabled}
          type="tel"
          inputMode="numeric"
          pattern={ADDRESS_PHONE_PATTERN.source}
          className={styles.inputBase}
          value={values.phoneNumber}
          onChange={(e) => handlePhoneNumberChange(e.target.value)}
          placeholder="010-0000-0000"
        >
          {values.phoneNumber &&
          !ADDRESS_PHONE_PATTERN.test(values.phoneNumber) ? (
            <Input.Description left="연락처를 끝까지 입력해주세요" />
          ) : null}
        </Input>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>주소</label>
        <div className={styles.addressRow}>
          <Input
            className={styles.readOnlyInput}
            value={values.zipcode}
            onChange={(e) => handleZipcodeChange(e.target.value)}
            placeholder="우편번호"
            disabled
          />
          <Button
            type="button"
            state="outline"
            size="medium"
            className={styles.addressSearchButton}
            onClick={onAddressSearchClick}
            disabled={disabled}
          >
            주소 찾기
          </Button>
        </div>
        <Input
          className={styles.readOnlyInput}
          value={values.baseAddress}
          onChange={(e) => handleBaseAddressChange(e.target.value)}
          placeholder="주소를 입력해주세요"
          disabled
        />
        <Input
          className={styles.inputBase}
          readOnly={disabled}
          value={values.detailAddress}
          onChange={(e) => handleDetailAddressChange(e.target.value)}
          placeholder="상세 주소를 입력해주세요"
        />
      </div>
    </form>
  );
}
