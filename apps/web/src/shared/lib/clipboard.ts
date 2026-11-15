import { hasFinalConsonant } from './hangul';
import { toastError, toastSuccess } from '../ui/toast';

export const copyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toastSuccess(
      `${label}${hasFinalConsonant(label) ? '이' : '가'} 복사되었습니다.`
    );
  } catch {
    toastError(
      `${label}${hasFinalConsonant(label) ? '을' : '를'} 복사하지 못했어요. 다시 시도해주세요.`
    );
  }
};
