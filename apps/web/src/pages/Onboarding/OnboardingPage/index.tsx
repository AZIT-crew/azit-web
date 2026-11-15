import { AppScreen } from '@stackflow/plugin-basic-ui';
import { useActivityParams } from '@stackflow/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { useFlow } from '@/app/routes/stackflow';

import {
  OnboardingCrewCategory,
  OnboardingCrewJoin,
  OnboardingCrewName,
  OnboardingCrewRegion,
  OnboardingRoleSelect,
} from '@/features/Onboarding/ui';
import type { CrewCategory } from '@/features/Onboarding/ui';

import { crewEntityQueries as crewQueries } from '@/entities/Crew/api/queries';
import { userQueries } from '@/entities/User/api/queries';

import { getQueryParam } from '@/shared/lib/url';
import { useFunnel } from '@/shared/lib/useFunnel';
import { AppLayout } from '@/shared/ui/layout';

type StepName =
  | 'role-select'
  | 'crew-name'
  | 'crew-category'
  | 'crew-region'
  | 'enter-invite-code';

const ONBOARDING_FLOW: Record<
  StepName,
  ((ctx: unknown) => StepName) | StepName | null
> = {
  'role-select': (ctx) =>
    ctx === 'leader' ? 'crew-name' : 'enter-invite-code',
  'crew-name': 'crew-category',
  'crew-category': 'crew-region',
  'crew-region': null,
  'enter-invite-code': null,
};

type OnboardingState = {
  role?: 'leader' | 'member';
  crewName?: string;
  crewCategory?: CrewCategory;
  crewRegion?: string;
};

export function OnboardingPage() {
  const { replace, pop } = useFlow();
  const { isExtra } = useActivityParams<{ isExtra?: string }>();
  const { Funnel } = useFunnel<StepName>('role-select', ONBOARDING_FLOW);
  const defaultInviteCode = getQueryParam('inviteCode');
  const queryClient = useQueryClient();

  const [onboardingState, setOnboardingState] = useState<OnboardingState>({});
  const joinCrewNameRef = useRef('');
  const joinCrewImageUrlRef = useRef('');
  const submittingRef = useRef(false);
  const release = () => {
    submittingRef.current = false;
  };
  const refreshCrews = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: userQueries.myCrewsKey() }),
      queryClient.invalidateQueries({ queryKey: userQueries.joinedCrewsKey() }),
    ]);

  const { mutate: joinCrew, isPending: isJoining } = useMutation({
    ...crewQueries.joinCrew,
    onSuccess: async () => {
      await refreshCrews();
      replace(
        'OnboardingCompletePage',
        {
          role: 'member',
          crewName: joinCrewNameRef.current,
          crewImageUrl: joinCrewImageUrlRef.current,
        },
        { animate: false }
      );
    },
    onSettled: release,
  });

  const { mutate: createCrew, isPending: isCreating } = useMutation({
    ...crewQueries.createCrew,
    onSuccess: async (response, variables) => {
      await refreshCrews();
      replace(
        'OnboardingCompletePage',
        {
          role: 'leader',
          crewName: variables.name,
          inviteCode: response.result.invitationCode,
          crewImageUrl: response.result.crewImageUrl,
        },
        { animate: false }
      );
    },
    onSettled: release,
  });

  return (
    <AppScreen>
      <AppLayout>
        <Funnel>
          <Funnel.Step
            name="role-select"
            render={(context) => (
              <OnboardingRoleSelect
                defaultValue={onboardingState.role}
                onNext={(role) => {
                  setOnboardingState((prev) => ({ ...prev, role }));
                  context.onNext(role);
                }}
                onPrev={isExtra === 'true' ? () => pop() : undefined}
              />
            )}
          />
          <Funnel.Step
            name="crew-name"
            render={(context) => (
              <OnboardingCrewName
                onNext={(crewName) => {
                  setOnboardingState((prev) => ({ ...prev, crewName }));
                  context.onNext();
                }}
                onPrev={() => {
                  setOnboardingState((prev) => ({
                    ...prev,
                    crewName: undefined,
                  }));
                  context.onPrev();
                }}
                defaultValue={onboardingState.crewName}
              />
            )}
          />
          <Funnel.Step
            name="crew-category"
            render={(context) => (
              <OnboardingCrewCategory
                defaultValue={onboardingState.crewCategory}
                onNext={(crewCategory) => {
                  setOnboardingState((prev) => ({ ...prev, crewCategory }));
                  context.onNext();
                }}
                onPrev={() => {
                  setOnboardingState((prev) => ({
                    ...prev,
                    crewCategory: undefined,
                  }));
                  context.onPrev();
                }}
              />
            )}
          />
          <Funnel.Step
            name="crew-region"
            render={(context) => (
              <OnboardingCrewRegion
                defaultValue={onboardingState.crewRegion}
                isLoading={isCreating}
                onNext={(crewRegion) => {
                  if (submittingRef.current) return;
                  submittingRef.current = true;
                  setOnboardingState((prev) => ({ ...prev, crewRegion }));
                  createCrew({
                    name: onboardingState.crewName ?? '',
                    category: onboardingState.crewCategory ?? 'RUNNING',
                    region: crewRegion,
                  });
                }}
                onPrev={() => {
                  if (submittingRef.current) return;
                  setOnboardingState((prev) => ({
                    ...prev,
                    crewRegion: undefined,
                  }));
                  context.onPrev();
                }}
              />
            )}
          />
          <Funnel.Step
            name="enter-invite-code"
            render={(context) => (
              <OnboardingCrewJoin
                defaultValue={defaultInviteCode}
                isSubmitting={isJoining}
                onNext={(inviteCode, _crewId, crewName, crewImageUrl) => {
                  if (submittingRef.current) return;
                  submittingRef.current = true;
                  joinCrewNameRef.current = crewName;
                  joinCrewImageUrlRef.current = crewImageUrl;
                  joinCrew({ invitationCode: inviteCode });
                }}
                onPrev={() => {
                  if (submittingRef.current) return;
                  context.onPrev();
                }}
              />
            )}
          />
        </Funnel>
      </AppLayout>
    </AppScreen>
  );
}
