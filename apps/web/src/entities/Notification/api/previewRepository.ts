import {
  mockNoticeDetails,
  mockNotificationList,
} from '../model/previewFixtures';
import type { NoticeDetail, NotificationItem } from '../model/types';

// 알림함/읽음/공지 API 계약이 없는 동안 사용하는 화면 미리보기 저장소다.
// HTTP 경로나 백엔드 응답 계약을 정의하지 않는다. 새로고침하면 초기화된다.
let notifications = structuredClone(mockNotificationList);
let notices = structuredClone(mockNoticeDetails);
let delayMs = 0;
let readError: string | null = null;
let writeError: string | null = null;

async function waitForPreview(write = false) {
  if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
  const message = write ? writeError : readError;
  if (message) throw new Error(message);
}
export async function getPreviewNotifications() {
  await waitForPreview();
  return structuredClone(notifications);
}
export async function markPreviewNotificationRead(id: string) {
  await waitForPreview(true);
  notifications = notifications.map((item) =>
    item.id === id ? { ...item, isRead: true } : item
  );
  return structuredClone(notifications);
}
export async function getPreviewNotices() {
  await waitForPreview();
  return structuredClone(Object.values(notices)).sort(
    (a, b) => b.noticeId - a.noticeId
  );
}
export async function getPreviewNotice(id: number) {
  await waitForPreview();
  return structuredClone(notices[id] ?? null);
}
export function resetNotificationPreview() {
  notifications = structuredClone(mockNotificationList);
  notices = structuredClone(mockNoticeDetails);
  delayMs = 0;
  readError = null;
  writeError = null;
}
// API 계약이 없는 미리보기 화면의 지연·실패·누락 데이터 QA에만 사용한다.
export function configureNotificationPreviewForQa(options: {
  notifications?: NotificationItem[];
  notices?: Record<number, NoticeDetail>;
  delayMs?: number;
  readError?: string | null;
  writeError?: string | null;
}) {
  if (options.notifications !== undefined)
    notifications = structuredClone(options.notifications);
  if (options.notices !== undefined) notices = structuredClone(options.notices);
  if (options.delayMs !== undefined) delayMs = options.delayMs;
  if (options.readError !== undefined) readError = options.readError;
  if (options.writeError !== undefined) writeError = options.writeError;
}
