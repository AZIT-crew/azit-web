import { useFlow } from '@/app/routes/stackflow';

import { postWithdraw } from '@/shared/auth/api/postWithdraw';
import { useAuthStore } from '@/shared/store/auth';

export const useWithdraw = () => {
  const { clearSession } = useAuthStore();
  const { replace } = useFlow();

  const handleWithdraw = async () => {
    await postWithdraw();
    clearSession();
    replace('LoginPage', {}, { animate: false });
  };

  return { handleWithdraw };
};
