import { Button } from '@azit/design-system/button';
import { Header } from '@azit/design-system/header';
import { Input } from '@azit/design-system/input';
import { useRef, useState } from 'react';

import * as styles from '@/features/Onboarding/styles/OnboardingCrewJoin.css';

import { getCrewInfo } from '@/entities/Crew/api/getCrewInfo';
import type { CrewInfoResult } from '@/entities/Crew/model';

import { BusinessError } from '@/shared/api/apiHandler';
import { BottomSheet } from '@/shared/ui/bottom-sheet/BottomSheet';
import { BackButton } from '@/shared/ui/button';
import { toastError } from '@/shared/ui/toast';

import { OnboardingCrewJoinBottomSheetContent } from './OnboardingCrewJoinBottomSheetContent';

export interface OnboardingCrewJoinProps {
  defaultValue?: string;
  isSubmitting?: boolean;
  onNext: (
    inviteCode: string,
    crewId: number,
    crewName: string,
    crewImageUrl: string
  ) => void;
  onPrev: () => void;
}

const INVITE_CODE_LENGTH = 6;
const normalizeCode = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, INVITE_CODE_LENGTH);

export function OnboardingCrewJoin({
  defaultValue = '',
  isSubmitting = false,
  onNext,
  onPrev,
}: OnboardingCrewJoinProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState(() =>
    normalizeCode(defaultValue)
  );
  const [preview, setPreview] = useState<{
    code: string;
    info: CrewInfoResult;
  } | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const fetchingRef = useRef(false);
  const isBusy = isFetching || isSubmitting;
  const isActive = inviteCode.length === INVITE_CODE_LENGTH;

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const handleInviteCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isBusy) return;
    if (errorMessage) {
      setErrorMessage(null);
    }
    setInviteCode(normalizeCode(e.target.value));
    setPreview(null);
  };

  const handleSubmit = async () => {
    if (!isActive || fetchingRef.current || isSubmitting) return;
    fetchingRef.current = true;
    setIsFetching(true);
    setErrorMessage(null);
    try {
      const response = await getCrewInfo(inviteCode);
      setPreview({ code: inviteCode, info: response.result });
      setIsBottomSheetOpen(true);
    } catch (error) {
      if (error instanceof BusinessError) {
        if (
          error.code === 'INVALID_INVITATION_CODE' ||
          error.code === 'CREW_NOT_FOUND'
        ) {
          setErrorMessage('유효하지 않거나 이미 만료된 초대 코드입니다');
        } else if (
          error.code === 'EXIT_REJOINING_COOLDOWN' ||
          error.code === 'EXPELLED_REJOINING_COOLDOWN' ||
          error.code === 'CANCEL_REJOINING_COOLDOWN'
        ) {
          setErrorMessage(error.message);
        } else {
          toastError(error.message);
        }
      } else {
        toastError('크루 정보를 불러오지 못했습니다. 다시 시도해주세요.');
      }
    } finally {
      fetchingRef.current = false;
      setIsFetching(false);
    }
  };

  return (
    <>
      <Header sticky left={<BackButton onClick={onPrev} disabled={isBusy} />} />
      <div className={styles.stepContainer}>
        <div className={styles.headerSection}>
          <h1 className={styles.title}>초대 코드 입력하기</h1>
          <p className={styles.subtitle}>
            크루의 초대 코드 6자리를 입력해주세요
          </p>
        </div>
        <div className={styles.inputContainer}>
          <Input
            className={styles.inputField}
            state={errorMessage ? 'error' : 'default'}
            value={inviteCode}
            onChange={handleInviteCodeChange}
            readOnly={isBusy}
            onRemove={
              isBusy
                ? undefined
                : () => {
                    setInviteCode('');
                    setErrorMessage(null);
                    setPreview(null);
                  }
            }
            placeholder="초대 코드 6자리"
          >
            {errorMessage && <Input.Description left={errorMessage} />}
          </Input>
        </div>
      </div>
      <div className={styles.buttonWrapper}>
        <Button
          state={isActive ? 'active' : 'disabled'}
          disabled={!isActive || isSubmitting}
          isLoading={isFetching}
          onClick={handleSubmit}
        >
          다음
        </Button>
      </div>
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onOutsideClick={() => {
          if (!isSubmitting) setIsBottomSheetOpen(false);
        }}
      >
        {preview && (
          <OnboardingCrewJoinBottomSheetContent
            onRequestJoin={() => {
              onNext(
                preview.code,
                preview.info.crewId,
                preview.info.name,
                preview.info.crewImageUrl ?? '/azit.png'
              );
            }}
            crewInfo={preview.info}
            isSubmitting={isSubmitting}
          />
        )}
      </BottomSheet>
    </>
  );
}
