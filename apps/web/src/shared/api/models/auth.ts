import type { components, operations } from '@/shared/api/apiTypes';

export type AuthProvider =
  operations['socialLogin']['parameters']['path']['provider'];
export type SocialLoginRequest = components['schemas']['SocialLoginRequest'];
export type SocialLoginResult = Required<
  components['schemas']['SocialLoginResponse']
>;
export type ReissueTokenResult = Required<
  components['schemas']['SocialLoginResponse']
>;
export type TermAgreeRequest = Required<
  components['schemas']['AgreeToTermsRequest']
>;

export type LinkSocialAccountRequest =
  components['schemas']['LinkSocialAccountRequest'];
export type CreateAppleLinkSessionRequest = Required<
  components['schemas']['CreateAppleLinkSessionRequest']
>;
export type AppleLinkSessionResult = Required<
  components['schemas']['AppleLinkSessionResponse']
>;
