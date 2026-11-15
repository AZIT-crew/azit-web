import { Chip } from '@azit/design-system/chip';

import * as styles from '@/features/Address/styles/AddressCard.css';

import type { DeliveryAddressResult } from '@/entities/Address/model';

interface AddressCardProps {
  address: DeliveryAddressResult;
  handleDelete?: (id: number) => void;
  handleEdit?: (id: number) => void;
  handleSetDefault?: (id: number) => void;
  isDefault: boolean;
  isSelected: boolean;
  disabled?: boolean;
}
export function AddressCard({
  address,
  handleDelete,
  handleEdit,
  handleSetDefault,
  isDefault,
  isSelected,
  disabled,
}: AddressCardProps) {
  return (
    <div
      className={isSelected ? styles.cardDefault : styles.cardNormal}
      data-address-id={address.id}
    >
      <button
        type="button"
        className={styles.selectionButton}
        disabled={disabled}
        aria-pressed={isSelected}
        aria-label={`${address.recipientName}, ${address.baseAddress}, ${address.detailAddress} 배송지 선택`}
        onClick={() => handleSetDefault?.(address.id)}
      >
        {isDefault && <Chip type="skyblue">기본 배송지</Chip>}
        <span className={styles.recipientRow}>
          <span className={styles.recipientName}>{address.recipientName}</span>
          <span className={styles.recipientPhone}>{address.phoneNumber}</span>
        </span>
        <span className={styles.addressText}>
          {address.baseAddress} {address.detailAddress}
        </span>
      </button>
      <div
        className={
          isDefault
            ? `${styles.buttonRow} ${styles.buttonRowSingle}`
            : styles.buttonRow
        }
      >
        {!isDefault && (
          <button
            type="button"
            className={styles.deleteButton}
            disabled={disabled}
            onClick={() => handleDelete?.(address.id)}
          >
            삭제
          </button>
        )}
        <button
          type="button"
          className={styles.editButton}
          disabled={disabled}
          onClick={() => handleEdit?.(address.id)}
        >
          수정
        </button>
      </div>
    </div>
  );
}
