import { describe, it, expect, vi, beforeEach } from 'vitest';

import { authApi } from '@/shared/api/apiClient';
import { useAuthStore } from '@/shared/store/auth';

describe('shared/lib/ky', () => {
  beforeEach(() => {
    // 각 테스트 전에 store 초기화
    useAuthStore.getState().clearSession();
  });

  it('accessToken이 있으면 Authorization 헤더를 추가한다 (beforeRequest)', async () => {
    useAuthStore
      .getState()
      .setSession({ accessToken: 'ACCESS_TOKEN', status: 'ACTIVE' });

    global.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      ) as typeof fetch;

    await authApi.get('test').json();

    const request = vi.mocked(global.fetch).mock.calls[0]![0] as Request;
    expect(request.headers.get('Authorization')).toBe('Bearer ACCESS_TOKEN');
  });

  it('401 발생 시 토큰을 재발급하고 원 요청을 재시도한다 (afterResponse)', async () => {
    useAuthStore
      .getState()
      .setSession({ accessToken: 'OLD_TOKEN', status: 'ACTIVE' });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      // 새 토큰 발급
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            result: { accessToken: 'NEW_TOKEN', status: 'ACTIVE' },
          }),
          { status: 200 }
        )
      )
      // 재시도 요청 → 성공
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      );

    global.fetch = fetchMock as typeof fetch;

    const result = await authApi.get('retry-test').json();

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // reissue 호출 확인
    const reissueRequest = fetchMock.mock.calls[1][0] as Request;
    expect(reissueRequest.url).toContain('/auth/reissue');

    // 재시도 요청에 새 토큰이 들어갔는지
    const retryRequest = fetchMock.mock.calls[2][0] as Request;
    expect(retryRequest.headers.get('Authorization')).toBe('Bearer NEW_TOKEN');

    // 스토어에 새 토큰이 저장되었는지 확인
    expect(useAuthStore.getState().accessToken).toBe('NEW_TOKEN');
  });

  it('동시에 401이 발생해도 토큰 재발급은 한 번만 실행된다', async () => {
    useAuthStore
      .getState()
      .setSession({ accessToken: 'OLD_TOKEN', status: 'ACTIVE' });

    const fetchMock = vi
      .fn()
      // 요청 A: 401
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      // 요청 B: 401
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      // 재발급 요청 (한 번만)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            result: { accessToken: 'NEW_TOKEN', status: 'ACTIVE' },
          }),
          {
            status: 200,
          }
        )
      )
      // 요청 A 재시도: 성공
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      )
      // 요청 B 재시도: 성공
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      );

    global.fetch = fetchMock as typeof fetch;

    const [resultA, resultB] = await Promise.all([
      authApi.get('test-a').json(),
      authApi.get('test-b').json(),
    ]);

    expect(resultA).toEqual({ ok: true });
    expect(resultB).toEqual({ ok: true });

    // reissue 호출은 1번만
    const reissueCalls = fetchMock.mock.calls.filter(([req]: [Request]) =>
      req.url.includes('/auth/reissue')
    );
    expect(reissueCalls).toHaveLength(1);

    expect(useAuthStore.getState().accessToken).toBe('NEW_TOKEN');
  });
  it('재발급 후에도 401이면 세션을 종료하고 반복하지 않는다', async () => {
    useAuthStore
      .getState()
      .setSession({ accessToken: 'OLD_TOKEN', status: 'ACTIVE' });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            result: { accessToken: 'NEW_TOKEN', status: 'ACTIVE' },
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    global.fetch = fetchMock as typeof fetch;
    await expect(authApi.get('still-expired').json()).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(useAuthStore.getState().accessToken).toBeUndefined();
  });
  it('재발급 인증 거절과 서버 장애를 구분한다', async () => {
    useAuthStore
      .getState()
      .setSession({ accessToken: 'OLD_TOKEN', status: 'ACTIVE' });
    const denied = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ code: 'EXPIRED_TOKEN', message: '만료' }),
          { status: 401 }
        )
      );
    global.fetch = denied as typeof fetch;
    await expect(authApi.get('expired').json()).rejects.toThrow();
    expect(useAuthStore.getState().accessToken).toBeUndefined();
    useAuthStore
      .getState()
      .setSession({ accessToken: 'OLD_TOKEN', status: 'ACTIVE' });
    const outage = vi.fn().mockImplementation((request: Request) =>
      Promise.resolve(
        request.url.includes('/auth/reissue')
          ? new Response(
              JSON.stringify({
                code: 'INTERNAL_SERVER_ERROR',
                message: '일시 오류',
              }),
              { status: 503 }
            )
          : new Response(null, { status: 401 })
      )
    );
    global.fetch = outage as typeof fetch;
    await expect(authApi.get('outage').json()).rejects.toThrow('일시 오류');
    expect(useAuthStore.getState().accessToken).toBe('OLD_TOKEN');
  });
  it('회원 상태 403을 크루 방출로 해석하지 않고 회원 상태를 재조회한다', async () => {
    useAuthStore
      .getState()
      .setSession({ accessToken: 'OLD_TOKEN', status: 'ACTIVE' });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ code: 'INVALID_MEMBER_STATUS' }), {
          status: 403,
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            result: { accessToken: 'TERMS_TOKEN', status: 'PENDING_TERMS' },
          }),
          { status: 200 }
        )
      );
    global.fetch = fetchMock as typeof fetch;
    await expect(authApi.get('member-state').json()).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(useAuthStore.getState().status).toBe('PENDING_TERMS');
  });
  it('다른 요청의 재발급이 끝난 뒤 도착한 오래된 401은 새 토큰을 재사용한다', async () => {
    useAuthStore
      .getState()
      .setSession({ accessToken: 'OLD_TOKEN', status: 'ACTIVE' });
    let release!: (response: Response) => void;
    const slow = new Promise<Response>((resolve) => {
      release = resolve;
    });
    const fetchMock = vi.fn().mockImplementation((request: Request) => {
      if (request.url.includes('/auth/reissue'))
        return Promise.resolve(
          new Response(
            JSON.stringify({
              result: { accessToken: 'NEW_TOKEN', status: 'ACTIVE' },
            }),
            { status: 200 }
          )
        );
      if (request.headers.get('Authorization') === 'Bearer NEW_TOKEN')
        return Promise.resolve(
          new Response(JSON.stringify({ ok: true }), { status: 200 })
        );
      return request.url.endsWith('slow')
        ? slow
        : Promise.resolve(new Response(null, { status: 401 }));
    });
    global.fetch = fetchMock as typeof fetch;
    const pending = authApi.get('slow').json();
    await authApi.get('fast').json();
    release(new Response(null, { status: 401 }));
    await expect(pending).resolves.toEqual({ ok: true });
    expect(
      fetchMock.mock.calls.filter(([request]: [Request]) =>
        request.url.includes('/auth/reissue')
      )
    ).toHaveLength(1);
  });
});
