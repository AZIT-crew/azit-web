import type { RefObject, MutableRefObject } from 'react';
import type {
  AppBridge,
  BridgeResponse,
  BridgeEvent,
  ImagePickerSource,
} from '@azit/bridge';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { Linking as RNLinking, Platform, Share } from 'react-native';
import type { WebView, WebViewMessageEvent } from 'react-native-webview';
import {
  AZIT_APP_NAME,
  NAVER_MAP_ANDROID_APP_STORE_URL,
  NAVER_MAP_APP_STORE_URL,
  WEBVIEW_URL,
} from '@/constants/url';
import { performKakaoLogin } from '@/api/performKakaoLogin';

type WebViewRef = RefObject<WebView | null> | MutableRefObject<WebView | null>;

export const appBridge: AppBridge = {
  async openExternalBrowser(url: string) {
    await Linking.openURL(url);
  },
  async shareInviteCode(code: string, crewName: string) {
    await Share.share({
      message: `[AZIT] '${crewName}' 크루에서 당신을 초대했어요! 초대 코드를 입력하고 크루에 가입하세요.\n\n초대 코드: ${code}\n\n${WEBVIEW_URL}/onboarding?inviteCode=${code}`,
    });
  },
  async shareSchedule(scheduleId: string) {
    await Share.share({
      message: `[AZIT 일정] 이번 주 정기런/번개런 일정 확정!
상세 일정을 확인하고, 지금 바로 AZIT 앱에서 신청해 주세요.\n${WEBVIEW_URL}/schedule/${scheduleId}`,
    });
  },
  async openNaverMap(address: string, lat: number, lng: number) {
    const naverMapAppURL = `nmap://place?lat=${lat}&lng=${lng}&name=${encodeURIComponent(address)}&appname=${AZIT_APP_NAME}`;

    try {
      await Linking.openURL(naverMapAppURL);
    } catch {
      try {
        await Linking.openURL(
          Platform.OS === 'ios'
            ? NAVER_MAP_APP_STORE_URL
            : NAVER_MAP_ANDROID_APP_STORE_URL
        );
      } catch (error) {
        console.error('Naver Map app not found or not installed', error);
      }
    }
  },
  async getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  },
  async getLocationPermissionStatus(): Promise<
    'granted' | 'denied' | 'undetermined'
  > {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status;
  },
  async openLocationSettings(): Promise<void> {
    await RNLinking.openSettings();
  },
  async pickProfileImage(source: ImagePickerSource) {
    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          return {
            success: false as const,
            message: '카메라 권한이 필요합니다.',
          };
        }
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          return {
            success: false as const,
            message: '갤러리 접근 권한이 필요합니다.',
          };
        }
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
              base64: true,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
              base64: true,
            });

      if (result.canceled || !result.assets[0]) {
        return {
          success: false as const,
          message: '이미지 선택이 취소되었습니다.',
        };
      }

      const asset = result.assets[0];
      if (!asset.base64) {
        return {
          success: false as const,
          message: '이미지 데이터를 읽을 수 없습니다.',
        };
      }

      const mimeType = asset.mimeType ?? 'image/jpeg';
      const ext = mimeType.split('/')[1] ?? 'jpg';
      const fileName = `profile_${Date.now()}.${ext}`;

      return {
        success: true as const,
        base64: asset.base64,
        fileName,
        mimeType,
      };
    } catch (error) {
      return {
        success: false as const,
        message:
          error instanceof Error
            ? error.message
            : '이미지 선택에 실패했습니다.',
      };
    }
  },
  async getAppVersion(): Promise<string> {
    return Constants.expoConfig?.version ?? '1.0.0';
  },
  async socialLogin(type) {
    try {
      if (type === 'kakao') {
        const credentials = await performKakaoLogin();
        return {
          success: true,
          accessToken: credentials.accessToken,
        };
      } else {
        return { success: false, message: '지원하지 않는 로그인 방식입니다.' };
      }
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : '로그인에 실패했습니다.',
      };
    }
  },
};

async function handleWebMessage(
  event: WebViewMessageEvent,
  webViewRef: WebViewRef
): Promise<void> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(event.nativeEvent.data);
  } catch {
    return;
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return;
  }

  const msg = parsed as {
    type?: string;
    method?: string;
    args?: unknown[];
    id?: string;
  };

  if (
    msg.type !== 'request' ||
    typeof msg.method !== 'string' ||
    typeof msg.id !== 'string'
  ) {
    return;
  }

  const { method, args = [], id } = msg;
  const fn = (appBridge as Record<string, unknown>)[method];

  if (typeof fn !== 'function') {
    const response: BridgeResponse = {
      type: 'response',
      id,
      error: `Method '${method}' not found`,
    };
    webViewRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(JSON.stringify(response))} }));`
    );
    return;
  }

  try {
    const result = await (fn as (...a: unknown[]) => Promise<unknown>)(...args);
    const response: BridgeResponse = { type: 'response', id, result };
    webViewRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(JSON.stringify(response))} }));`
    );
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const response: BridgeResponse = { type: 'response', id, error };
    webViewRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(JSON.stringify(response))} }));`
    );
  }
}

function postMessage(
  eventName: string,
  payload: unknown,
  webViewRef: WebViewRef
): void {
  const msg: BridgeEvent = { type: 'event', event: eventName, payload };
  webViewRef.current?.injectJavaScript(
    `window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(JSON.stringify(msg))} }));`
  );
}

export function createWebViewBridge(webViewRef: WebViewRef) {
  return {
    onMessage: (event: WebViewMessageEvent) =>
      handleWebMessage(event, webViewRef),
    postMessage: (eventName: string, payload: unknown) =>
      postMessage(eventName, payload, webViewRef),
  };
}
