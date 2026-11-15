import { vars } from '@azit/design-system';
import { Button } from '@azit/design-system/button';
import { Header } from '@azit/design-system/header';
import { AppScreen } from '@stackflow/plugin-basic-ui';
import { useRef } from 'react';

import { useFlow } from '@/app/routes/stackflow';

import { useCreateAddress } from '@/features/Address/api/queries';
import { useAddressForm } from '@/features/Address/model/useAddressForm';
import { AddressForm } from '@/features/Address/ui';

import { normalizeAddress } from '@/entities/Address/model/validation';

import { useStack } from '@/shared/lib/stackflow/useStack';
import { BackButton } from '@/shared/ui/button';
import { AppLayout } from '@/shared/ui/layout';

import * as styles from './index.css';

export function AddressRegisterPage() {
  const { push } = useFlow();
  const { pop } = useStack();
  const mutation = useCreateAddress();
  const submitting = useRef(false);
  const { formValues, setFormValues, isValidForm, formKey } = useAddressForm();
  const formId = `address-register-${formKey}`;
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValidForm || submitting.current) return;
    submitting.current = true;
    mutation.mutate(normalizeAddress(formValues), {
      onSuccess: () => pop('AddressSettingPage'),
      onSettled: () => {
        submitting.current = false;
      },
    });
  };
  return (
    <AppScreen backgroundColor={vars.colors.background_sub}>
      <AppLayout>
        <div className={styles.headerWrapper}>
          <Header
            left={
              <BackButton
                onClick={() => pop('AddressSettingPage')}
                disabled={mutation.isPending}
              />
            }
            center="배송지 등록"
          />
        </div>
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
            등록하기
          </Button>
        </div>
      </AppLayout>
    </AppScreen>
  );
}
