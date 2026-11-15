import { http, HttpResponse, type HttpHandler, type StrictRequest } from 'msw';

import type { paths } from '@/shared/api/apiTypes';

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

type ApiPath<M extends Method> = {
  [P in keyof paths]: [NonNullable<paths[P][M]>] extends [never] ? never : P;
}[keyof paths];

type JsonContent<T> = T extends { content: infer Content }
  ? Content[keyof Content]
  : never;

type SuccessBody<M extends Method, P extends ApiPath<M>> =
  NonNullable<paths[P][M]> extends { responses: { 200: infer Response } }
    ? JsonContent<Response>
    : never;

const contractHandler = Symbol('OpenAPI mock handler');
export type MockHandler = HttpHandler & { [contractHandler]: true };

// 성공 응답의 envelope는 항상 채운다. Void API만 result 생략을 허용한다.
export type MockResponse<M extends Method, P extends ApiPath<M>> =
  SuccessBody<M, P> extends {
    code?: infer Code;
    message?: infer Message;
    result?: infer Result;
  }
    ? {
        code: NonNullable<Code>;
        message: NonNullable<Message>;
      } & (string extends keyof NonNullable<Result>
        ? { result?: Result }
        : { result: NonNullable<Result> })
    : never;

type RequestBody<M extends Method, P extends ApiPath<M>> =
  NonNullable<paths[P][M]> extends { requestBody: infer Body }
    ? JsonContent<Body>
    : never;

type PathParameters<P extends string> =
  P extends `${string}{${infer Param}}${infer Rest}`
    ? Param | PathParameters<Rest>
    : never;

type Resolver<M extends Method, P extends ApiPath<M>> = (info: {
  request: StrictRequest<RequestBody<M, P>>;
  params: { [Key in PathParameters<P>]: string };
}) => MockResponse<M, P> | Promise<MockResponse<M, P>>;

export class MockApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function method<M extends Method>(verb: M) {
  return <P extends ApiPath<M>>(
    path: P,
    resolver: Resolver<M, NoInfer<P>>
  ): MockHandler => {
    const handler = http[verb]<
      { [Key in PathParameters<P>]: string },
      RequestBody<M, P>
    >(`*${path.replace(/\{([^}]+)\}/g, ':$1')}`, async (info) => {
      try {
        return HttpResponse.json(await resolver(info));
      } catch (error) {
        if (!(error instanceof MockApiError)) throw error;
        return HttpResponse.json(
          { code: error.code, message: error.message },
          { status: error.status }
        );
      }
    });
    return Object.assign(handler, { [contractHandler]: true as const });
  };
}

/** URL·HTTP 메서드·요청/응답을 생성된 OpenAPI 계약에 연결한다. */
export const mockApi = {
  get: method('get'),
  post: method('post'),
  put: method('put'),
  patch: method('patch'),
  delete: method('delete'),
};
