import { vars } from '@azit/design-system';
import { AlertDialog } from '@azit/design-system/alert-dialog';
import { Button } from '@azit/design-system/button';
import { Header } from '@azit/design-system/header';
import { PlusIcon } from '@azit/design-system/icon';
import { AppScreen } from '@stackflow/plugin-basic-ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { useFlow } from '@/app/routes/stackflow';

import {
  addressQueries,
  useDeleteAddress,
  useUpdateAddress,
} from '@/features/Address/api/queries';
import { AddressCard, AddressEmpty } from '@/features/Address/ui';

import { useStack } from '@/shared/lib/stackflow/useStack';
import { BackButton } from '@/shared/ui/button';
import { QueryErrorFallback } from '@/shared/ui/error';
import { AppLayout } from '@/shared/ui/layout';
import { PageLoader } from '@/shared/ui/loading/PageLoader';

import * as styles from './index.css';

export function AddressSettingPage() {
  const { push } = useFlow();
  const { pop } = useStack();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteAddress();
  const updateMutation = useUpdateAddress();
  const query = useQuery(addressQueries.addressesQuery());
  const addressList = query.data?.result ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [action, setAction] = useState<'delete' | 'default' | null>(null);
  const submitting = useRef(false);
  const selectedAddress =
    addressList.find((item) => item.id === selectedId) ??
    addressList.find((item) => item.isDefault);
  const disabled = query.isError || query.isFetching || action !== null;
  const back = () => pop('Mypage');
  const register = () => push('AddressRegisterPage', {});

  const handleDelete = async () => {
    if (deleteId === null || submitting.current || query.isError) return;
    submitting.current = true;
    setAction('delete');
    try {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    } catch {
      // MutationCache가 오류를 안내한다. 확인 창과 대상은 재시도를 위해 유지한다.
    } finally {
      submitting.current = false;
      setAction(null);
    }
  };
  const handleComplete = async () => {
    if (!selectedAddress || submitting.current || disabled) return;
    if (selectedAddress.isDefault) {
      back();
      return;
    }
    submitting.current = true;
    setAction('default');
    const { id, ...payload } = selectedAddress;
    try {
      await updateMutation.mutateAsync({
        id,
        payload: { ...payload, isDefault: true },
      });
      await queryClient.invalidateQueries({ queryKey: ['order'] });
      back();
    } catch {
      // MutationCache가 오류를 안내한다. 선택을 보존하고 현재 화면에서 재시도한다.
    } finally {
      submitting.current = false;
      setAction(null);
    }
  };
  return (
    <AppScreen backgroundColor={vars.colors.background_sub}>
      <AppLayout>
        <div className={styles.headerWrapper}>
          <Header
            left={<BackButton onClick={back} disabled={action !== null} />}
            center="배송지 설정"
            right={
              <button
                onClick={register}
                disabled={disabled}
                type="button"
                aria-label="배송지 등록하기"
              >
                <PlusIcon size={24} color="default" aria-hidden />
              </button>
            }
          />
        </div>
        {query.isPending ? <PageLoader /> : null}
        {query.isError ? (
          <QueryErrorFallback
            message="배송지를 불러오지 못했어요"
            onRetry={() => {
              void query.refetch();
            }}
            isRetrying={query.isFetching}
          />
        ) : null}
        {addressList.length > 0 ? (
          <>
            <div className={styles.mainContainer}>
              <div className={styles.addressListContainer}>
                {addressList.map((address) => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    handleDelete={setDeleteId}
                    handleEdit={(id) => push('AddressEditPage', { id })}
                    handleSetDefault={setSelectedId}
                    isDefault={address.isDefault}
                    isSelected={address.id === selectedAddress?.id}
                    disabled={disabled}
                  />
                ))}
              </div>
            </div>
            <div className={styles.footerButtonWrapper}>
              <Button
                state="active"
                size="large"
                onClick={() => {
                  void handleComplete();
                }}
                disabled={disabled || !selectedAddress}
                isLoading={action === 'default'}
              >
                배송지 변경 완료
              </Button>
            </div>
          </>
        ) : query.isSuccess ? (
          <div className={styles.emptyStateWrapper}>
            <AddressEmpty handleRegister={register} />
          </div>
        ) : null}
        <AlertDialog
          title="배송지를 삭제할까요?"
          description="선택한 배송지가 목록에서 삭제돼요."
          open={deleteId !== null}
          onOpenChange={(open) => {
            if (!open && action === null) setDeleteId(null);
          }}
          cancelText="취소"
          actionText="삭제하기"
          actionVariant="danger"
          closeOnAction={false}
          actionLoading={action === 'delete'}
          onAction={() => {
            void handleDelete();
          }}
        />
      </AppLayout>
    </AppScreen>
  );
}
