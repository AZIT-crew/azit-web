import { create } from 'zustand';

import { postLogout } from '@/shared/api/handlers/postLogout';
import type { ReissueTokenResult } from '@/shared/api/models/auth';

type Session = Pick<ReissueTokenResult, 'accessToken' | 'status'>;
export type AuthDestination =
  | 'HomePage'
  | 'OnboardingTermAgreePage'
  | 'OnboardingPage'
  | 'LoginPage';
interface AuthState {
  accessToken?: string;
  status?: ReissueTokenResult['status'];
  isInitialized: boolean;
  generation: number;
  destination?: AuthDestination;
  setSession: (session: Session, destination?: AuthDestination) => void;
  acknowledgeDestination: () => void;
  clearSession: () => void;
  setIsInitialized: (value: boolean) => void;
  logout: () => Promise<void>;
}
export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: undefined,
  status: undefined,
  isInitialized: false,
  generation: 0,
  setSession: ({ accessToken, status }, destination) =>
    set((state) => ({
      accessToken:
        status === 'ACTIVE' || status === 'PENDING_TERMS'
          ? accessToken
          : undefined,
      status,
      destination,
      isInitialized: true,
      generation: state.generation + 1,
    })),
  acknowledgeDestination: () => set({ destination: undefined }),
  clearSession: () =>
    set((state) => ({
      accessToken: undefined,
      status: undefined,
      destination: undefined,
      isInitialized: true,
      generation: state.generation + 1,
    })),
  setIsInitialized: (isInitialized) => set({ isInitialized }),
  logout: async () => {
    await postLogout();
    get().clearSession();
  },
}));
