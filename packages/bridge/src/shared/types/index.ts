export type GeoPosition = {
  latitude: number;
  longitude: number;
};

export type SocialLoginType = 'kakao' | 'apple';

export type ImagePickerSource = 'camera' | 'library';

export type ImagePickerResult =
  | { success: true; base64: string; fileName: string; mimeType: string }
  | { success: false; message: string };

export type SocialAuthResult =
  | { success: true; authorizationCode?: string; accessToken?: string }
  | { success: false; message: string };

export type AppBridge = {
  openExternalBrowser(url: string): Promise<void>;
  shareInviteCode(code: string, crewName: string): Promise<void>;
  shareSchedule(scheduleId: string): Promise<void>;
  openNaverMap(address: string, lat: number, lng: number): Promise<void>;
  getCurrentPosition(): Promise<GeoPosition>;
  getLocationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'>;
  openLocationSettings(): Promise<void>;
  socialLogin(type: SocialLoginType): Promise<SocialAuthResult>;
  pickProfileImage(source: ImagePickerSource): Promise<ImagePickerResult>;
  getAppVersion(): Promise<string>;
};
