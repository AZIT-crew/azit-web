import { Button } from '@azit/design-system/button';
import { Header } from '@azit/design-system/header';
import { AppScreen } from '@stackflow/plugin-basic-ui';
import { useActivityParams } from '@stackflow/react';
import { useCallback } from 'react';

import type { KakaoPostcodeResult } from '@/features/Address/model/useKakaoPostcode';
import { KakaoPostcode } from '@/features/Address/ui';

import { useStack } from '@/shared/lib/stackflow/useStack';
import { useAddressSelectionStore } from '@/shared/store/addressSelection';
import { BackButton } from '@/shared/ui/button';
import { PageErrorFallback } from '@/shared/ui/error';
import { AppLayout } from '@/shared/ui/layout';

import * as styles from './index.css';

export function AddressSearchPage() {
  const { formKey } = useActivityParams<{ formKey?: string }>();
  const { pop } = useStack();
  const setSelectedAddress = useAddressSelectionStore(
    (state) => state.setSelectedAddress
  );
  const handleComplete = useCallback(
    (data: KakaoPostcodeResult) => {
      if (!formKey) return;
      setSelectedAddress({
        formKey,
        zipcode: data.zonecode,
        baseAddress: data.baseAddress,
        extraAddress: data.extraAddress,
      });
      pop('AddressRegisterPage');
    },
    [formKey, setSelectedAddress, pop]
  );
  return (
    <AppScreen>
      <AppLayout>
        <Header
          sticky
          left={<BackButton onClick={() => pop('AddressRegisterPage')} />}
          center="우편번호 검색"
        />
        <div className={styles.mainContainer}>
          {formKey ? (
            <KakaoPostcode onComplete={handleComplete} />
          ) : (
            <>
              <PageErrorFallback message="배송지 입력 화면에서 주소 찾기를 선택해주세요" />
              <Button
                state="outline"
                onClick={() => pop('AddressRegisterPage')}
              >
                배송지 입력으로
              </Button>
            </>
          )}
        </div>
      </AppLayout>
    </AppScreen>
  );
}
