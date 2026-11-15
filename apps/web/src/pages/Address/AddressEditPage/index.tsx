import { vars } from '@azit/design-system';
import { Button } from '@azit/design-system/button';
import { Header } from '@azit/design-system/header';
import { AppScreen } from '@stackflow/plugin-basic-ui';
import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';

import { useFlow } from '@/app/routes/stackflow';

import {
  addressQueries,
  useUpdateAddress,
} from '@/features/Address/api/queries';
import { useAddressForm } from '@/features/Address/model/useAddressForm';
import { AddressForm } from '@/features/Address/ui';

import { normalizeAddress } from '@/entities/Address/model/validation';

import { useStack } from '@/shared/lib/stackflow/useStack';
import { BackButton } from '@/shared/ui/button';
import { PageErrorFallback, QueryErrorFallback } from '@/shared/ui/error';
import { AppLayout } from '@/shared/ui/layout';
import { PageLoader } from '@/shared/ui/loading/PageLoader';

import * as styles from './index.css';

export function AddressEditPage({
  params,
}: {
  params: { id: string | number };
}) {
  const addressId = Number(params.id);
  const validId = Number.isSafeInteger(addressId) && addressId > 0;
  const { push } = useFlow();
  const { pop } = useStack();
  const mutation = useUpdateAddress();
  const submitting = useRef(false);
  const query = useQuery({
    ...addressQueries.addressesQuery(),
    enabled: validId,
  });
  const address = query.data?.result.find((item) => item.id === addressId);
  const { formValues, setFormValues, isValidForm, formKey } = useAddressForm(
    address ? normalizeAddress(address) : undefined
  );
  const formId = `address-edit-${formKey}`;
  const back = () => pop('AddressSettingPage');
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!address || !isValidForm || submitting.current) return;
    submitting.current = true;
    mutation.mutate(
      { id: addressId, payload: normalizeAddress(formValues) },
      {
        onSuccess: back,
        onSettled: () => {
          submitting.current = false;
        },
      }
    );
  };
  return (
    <AppScreen backgroundColor={vars.colors.background_sub}>
      <AppLayout>
        <div className={styles.headerWrapper}>
          <Header
            left={<BackButton onClick={back} disabled={mutation.isPending} />}
            center="배송지 수정"
          />
        </div>
        {!validId || (query.isSuccess && !address) ? (
          <>
            <PageErrorFallback message="배송지를 찾을 수 없어요" />
            <Button state="outline" onClick={back}>
              배송지 목록으로
            </Button>
          </>
        ) : query.isError ? (
          <QueryErrorFallback
            message="배송지를 불러오지 못했어요"
            onRetry={() => {
              void query.refetch();
            }}
            isRetrying={query.isFetching}
          />
        ) : query.isPending ? (
          <PageLoader />
        ) : (
          <>
            <div className={styles.mainContainer}>
              <div className={styles.formWrapper}>
                <AddressForm
                  formId={formId}
                  values={formValues}
                  onValuesChange={setFormValues}
                  onAddressSearchClick={() =>
                    push('AddressSearchPage', { formKey })
                  }
                  onSubmit={handleSubmit}
                  disabled={mutation.isPending}
                />
              </div>
            </div>
            <div className={styles.footerWrapper}>
              <Button
                type="submit"
                form={formId}
                size="large"
                disabled={!isValidForm}
                state={isValidForm ? 'active' : 'disabled'}
                isLoading={mutation.isPending}
              >
                수정하기
              </Button>
            </div>
          </>
        )}
      </AppLayout>
    </AppScreen>
  );
}
