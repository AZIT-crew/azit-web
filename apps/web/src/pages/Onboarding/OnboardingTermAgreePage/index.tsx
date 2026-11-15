import { Button } from '@azit/design-system/button';
import { Checkbox } from '@azit/design-system/checkbox';
import { Divider } from '@azit/design-system/divider';
import { AppScreen } from '@stackflow/plugin-basic-ui';
import { useMutation } from '@tanstack/react-query';
import { useState, useMemo, useRef } from 'react';

import { useFlow } from '@/app/routes/stackflow';

import { fetchUserPosition } from '@/widgets/ScheduleAttendance/model/location';

import { postTermAgree } from '@/features/Onboarding/api/postTermAgree';
import { TermAgreeItem } from '@/features/Onboarding/ui';

import { ServerError } from '@/shared/api/apiHandler';
import { postReissueToken } from '@/shared/api/handlers/postReissueToken';
import { isAuthenticationError } from '@/shared/auth/model/session';
import { useAuthStore } from '@/shared/store/auth';
import { AppLayout } from '@/shared/ui/layout';

import * as styles from './index.css';

type TermsState = {
  serviceTermsAgreed: boolean;
  privacyPolicyAgreed: boolean;
  locationServiceAgreed: boolean;
  thirdPartyInfoAgreed: boolean;
  marketingTermsAgreed: boolean;
  notificationTermsAgreed: boolean;
};

const TERM_LIST = [
  {
    id: 'serviceTermsAgreed',
    label: '서비스 이용약관',
    required: true,
  },
  {
    id: 'privacyPolicyAgreed',
    label: '개인정보 처리방침',
    required: true,
  },
  {
    id: 'locationServiceAgreed',
    label: '위치 기반 서비스 이용약관',
    required: true,
  },
  {
    id: 'thirdPartyInfoAgreed',
    label: '제 3자 정보제공 동의',
    required: true,
  },
  // {
  //   id: 'marketingTermsAgreed',
  //   label: '마케팅 정보 수신 동의',
  //   required: false,
  // },
  // {
  //   id: 'notificationTermsAgreed',
  //   label: '알림 수신 동의',
  //   required: false,
  // },
] as const;

const TERM_ID_TO_TERM_TYPE: Record<string, string> = {
  serviceTermsAgreed: 'terms-of-service',
  privacyPolicyAgreed: 'privacy-policy',
  thirdPartyInfoAgreed: 'third-party-info-agreement',
  locationServiceAgreed: 'location-service-agreement',
};

export function OnboardingTermAgreePage() {
  const { push } = useFlow();
  const submittingRef = useRef(false);
  const [termsSaved, setTermsSaved] = useState(false);
  const agreementMutation = useMutation({
    mutationFn: async () => {
      if (!termsSaved) {
        await postTermAgree({
          ...terms,
          marketingTermsAgreed: false,
          notificationTermsAgreed: false,
        });
        setTermsSaved(true);
      }
      try {
        const response = await postReissueToken();
        if (response.result.status !== 'ACTIVE' || !response.result.accessToken)
          throw new ServerError(
            '가입 상태를 확인하지 못했어요. 다시 시도해주세요.',
            500
          );
        return response;
      } catch (error) {
        if (isAuthenticationError(error))
          useAuthStore.getState().clearSession();
        throw error;
      }
    },
    onSuccess: ({ result }) => {
      // 회원 상태와 이동을 함께 반영해 초기화의 기본 이동과 경쟁하지 않게 한다.
      useAuthStore.getState().setSession(result, 'OnboardingPage');
      void fetchUserPosition({ showErrorToast: false });
    },
    onSettled: () => {
      submittingRef.current = false;
    },
  });
  const [terms, setTerms] = useState<TermsState>(
    () =>
      Object.fromEntries(
        TERM_LIST.map((term) => [term.id, false])
      ) as TermsState
  );

  const isAllChecked = useMemo(() => {
    return TERM_LIST.every((term) => terms[term.id] === true);
  }, [terms]);

  const isRequiredChecked = useMemo(() => {
    return TERM_LIST.filter((term) => term.required).every(
      (term) => terms[term.id] === true
    );
  }, [terms]);

  const handleAllAgreeChange = (checked: boolean) => {
    setTerms(
      Object.fromEntries(
        TERM_LIST.map((term) => [term.id, checked])
      ) as TermsState
    );
  };

  const handleTermChange = (id: keyof TermsState, checked: boolean) => {
    setTerms((prev) => ({
      ...prev,
      [id]: checked,
    }));
  };

  const handleTermAgree = () => {
    if (!isRequiredChecked || submittingRef.current) return;
    submittingRef.current = true;
    agreementMutation.mutate();
  };

  const handleDetailClick = (id: string) => {
    const termType = TERM_ID_TO_TERM_TYPE[id];

    if (termType) {
      push('SettingsTermDetailPage', { termType }, { animate: true });
    }
  };

  return (
    <AppScreen>
      <AppLayout>
        <div className={styles.mainContainer}>
          <div className={styles.headerSection}>
            <h1 className={styles.title}>AZIT에 오신 걸 환영해요!</h1>
            <p className={styles.subtitle}>
              서비스 이용을 위해 약관 동의가 필요해요
            </p>
          </div>
          <div
            className={styles.termsSection}
            inert={agreementMutation.isPending || termsSaved}
          >
            <div className={styles.allAgreeItem}>
              <Checkbox
                id="all-agree"
                checked={isAllChecked}
                onCheckedChange={(checked) =>
                  handleAllAgreeChange(checked === true)
                }
              />
              <label htmlFor="all-agree" className={styles.allAgreeLabel}>
                전체 동의
              </label>
            </div>
            <Divider />
            <div className={styles.termsList}>
              {TERM_LIST.map((term) => (
                <TermAgreeItem
                  key={term.id}
                  id={term.id}
                  label={term.label}
                  required={term.required}
                  checked={terms[term.id]}
                  onCheckedChange={(checked) =>
                    handleTermChange(term.id, checked)
                  }
                  onDetailClick={() => handleDetailClick(term.id)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.buttonWrapper}>
          <Button
            state={isRequiredChecked ? 'active' : 'disabled'}
            disabled={!isRequiredChecked}
            isLoading={agreementMutation.isPending}
            onClick={handleTermAgree}
          >
            다음
          </Button>
        </div>
      </AppLayout>
    </AppScreen>
  );
}
