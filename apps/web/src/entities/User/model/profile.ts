import { z } from 'zod';

export const MAX_NICKNAME_LENGTH = 10;

const HANGUL_JAMO_REGEX = /[ㄱ-ㆎ]/;
const ALLOWED_NICKNAME_REGEX = /^[a-zA-Z0-9가-힣]*$/;

export const nicknameSchema = z
  .string()
  .min(1, '닉네임을 입력해주세요')
  .max(
    MAX_NICKNAME_LENGTH,
    `닉네임은 ${MAX_NICKNAME_LENGTH}자 이내로 입력해주세요`
  )
  .superRefine((value, ctx) => {
    if (HANGUL_JAMO_REGEX.test(value)) {
      ctx.addIssue({
        code: 'custom',
        message: '초성은 사용할 수 없어요.',
      });
      return;
    }
    if (!ALLOWED_NICKNAME_REGEX.test(value)) {
      ctx.addIssue({
        code: 'custom',
        message: '특수문자는 사용할 수 없어요.',
      });
    }
  });
