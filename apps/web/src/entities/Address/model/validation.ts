import type { RegisterDeliveryAddressRequestSchema } from './address.model';

// OpenAPI Register/UpdateDeliveryAddressRequest의 연락처 pattern과 필수 항목.
export const ADDRESS_PHONE_PATTERN = /^\d{2,3}-\d{3,4}-\d{4}$/;
const requiredTextFields = [
  'recipientName',
  'phoneNumber',
  'zipcode',
  'baseAddress',
  'detailAddress',
] as const;

export function isCompleteAddress(
  value: unknown
): value is RegisterDeliveryAddressRequestSchema {
  if (typeof value !== 'object' || value === null) return false;
  const fields = value as Record<string, unknown>;
  return (
    typeof fields.isDefault === 'boolean' &&
    requiredTextFields.every(
      (key) => typeof fields[key] === 'string' && fields[key].trim().length > 0
    )
  );
}
export function isValidAddress(
  value: unknown
): value is RegisterDeliveryAddressRequestSchema {
  return (
    isCompleteAddress(value) &&
    ADDRESS_PHONE_PATTERN.test(value.phoneNumber.trim())
  );
}
export function normalizeAddress(
  value: RegisterDeliveryAddressRequestSchema
): RegisterDeliveryAddressRequestSchema {
  return {
    recipientName: value.recipientName.trim(),
    phoneNumber: value.phoneNumber.trim(),
    zipcode: value.zipcode.trim(),
    baseAddress: value.baseAddress.trim(),
    detailAddress: value.detailAddress.trim(),
    isDefault: value.isDefault,
  };
}
