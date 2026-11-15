import { beforeEach, describe, expect, it } from 'vitest';

import {
  configureNotificationPreviewForQa,
  getPreviewNotifications,
  getPreviewNotice,
  getPreviewNotices,
  markPreviewNotificationRead,
  resetNotificationPreview,
} from './previewRepository';

beforeEach(() => resetNotificationPreview());
describe('API 미연동 알림 화면의 미리보기 상태', () => {
  it('읽음 변경이 재조회에도 유지되고 다른 알림은 바뀌지 않는다', async () => {
    expect((await getPreviewNotifications())[0]!.isRead).toBe(false);
    await markPreviewNotificationRead('1');
    const list = await getPreviewNotifications();
    expect(list[0]!.isRead).toBe(true);
    expect(list[1]!.isRead).toBe(false);
  });
  it('조회 결과를 바꿔도 저장소 원본을 변경하지 않는다', async () => {
    const list = await getPreviewNotifications();
    list[0]!.isRead = true;
    expect((await getPreviewNotifications())[0]!.isRead).toBe(false);
    const notice = await getPreviewNotice(1);
    notice!.title = '변경';
    expect((await getPreviewNotice(1))!.title).not.toBe('변경');
  });
  it('읽음 처리 실패 시 기존 값을 유지하고 재시도할 수 있다', async () => {
    configureNotificationPreviewForQa({ writeError: 'QA 읽음 저장 실패' });
    await expect(markPreviewNotificationRead('1')).rejects.toThrow(
      'QA 읽음 저장 실패'
    );
    expect((await getPreviewNotifications())[0]!.isRead).toBe(false);
    configureNotificationPreviewForQa({ writeError: null });
    expect((await markPreviewNotificationRead('1'))[0]!.isRead).toBe(true);
  });
  it('조회 실패·빈 목록·존재하지 않는 공지를 구분한다', async () => {
    configureNotificationPreviewForQa({ readError: 'QA 조회 실패' });
    await expect(getPreviewNotifications()).rejects.toThrow('QA 조회 실패');
    await expect(getPreviewNotices()).rejects.toThrow('QA 조회 실패');
    configureNotificationPreviewForQa({
      readError: null,
      notifications: [],
      notices: {},
    });
    expect(await getPreviewNotifications()).toEqual([]);
    expect(await getPreviewNotices()).toEqual([]);
    expect(await getPreviewNotice(999)).toBeNull();
  });
  it('알림과 공지 상세가 같은 공지 ID를 가리키고 초기화하면 읽음 상태가 복원된다', async () => {
    const notice = (await getPreviewNotices())[0]!;
    expect(await getPreviewNotice(notice.noticeId)).toEqual(notice);
    await markPreviewNotificationRead('1');
    resetNotificationPreview();
    expect((await getPreviewNotifications())[0]!.isRead).toBe(false);
  });
});
