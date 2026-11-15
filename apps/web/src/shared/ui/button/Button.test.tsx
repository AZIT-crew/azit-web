import { Button } from '@azit/design-system/button';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

// 동작 테스트에서는 Vanilla Extract의 빌드 결과 대신 클래스 이름만 사용한다.
vi.mock(
  '../../../../../../packages/design-system/src/components/button/Button.css.ts',
  () => ({
    buttonVariant: () => 'button',
    loadingButton: 'loading-button',
    loadingContent: 'loading-content',
    loadingSpinner: 'loading-spinner',
  })
);

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});
afterAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: false });
});
beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
});

async function render(node: ReactNode) {
  await act(async () => {
    root.render(node);
  });
  return container.querySelector('button')!;
}

describe('공통 Button 요청 상태', () => {
  it('active 스타일이어도 전달받은 disabled가 클릭을 차단한다', async () => {
    const onClick = vi.fn();
    const button = await render(
      <Button state="active" disabled onClick={onClick}>
        등록하기
      </Button>
    );
    button.click();
    expect(button).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('isLoading이면 이름을 유지한 채 스피너와 busy 상태를 표시하고 클릭을 차단한다', async () => {
    const onClick = vi.fn();
    const button = await render(
      <Button isLoading onClick={onClick}>
        등록하기
      </Button>
    );
    button.click();
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleName('등록하기');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('.loading-spinner')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
    expect(onClick).not.toHaveBeenCalled();
  });

  it('로딩 종료 후 버튼이 다시 활성화되어 재시도할 수 있다', async () => {
    const onClick = vi.fn();
    await render(
      <Button isLoading onClick={onClick}>
        수정하기
      </Button>
    );
    const button = await render(
      <Button isLoading={false} onClick={onClick}>
        수정하기
      </Button>
    );
    button.click();
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('.loading-spinner')).toBeNull();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('로딩이 끝나도 폼이 유효하지 않으면 disabled를 유지한다', async () => {
    await render(
      <Button isLoading disabled>
        등록하기
      </Button>
    );
    const button = await render(
      <Button isLoading={false} disabled>
        등록하기
      </Button>
    );
    expect(button).toBeDisabled();
    expect(button.querySelector('.loading-spinner')).toBeNull();
  });

  it('disabled 스타일은 차단하고 필터에 쓰는 disabled_outline은 클릭할 수 있다', async () => {
    const onClick = vi.fn();
    const disabled = await render(
      <Button state="disabled" onClick={onClick}>
        전체
      </Button>
    );
    disabled.click();
    expect(onClick).not.toHaveBeenCalled();
    const inactiveFilter = await render(
      <Button state="disabled_outline" onClick={onClick}>
        전체
      </Button>
    );
    inactiveFilter.click();
    expect(inactiveFilter).toBeEnabled();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('폼 바깥의 submit 버튼도 로딩 중에는 제출되지 않는다', async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const form = (loading: boolean) => (
      <>
        <form id="test-form" onSubmit={onSubmit} />
        <Button type="submit" form="test-form" isLoading={loading}>
          등록하기
        </Button>
      </>
    );
    (await render(form(false))).click();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    (await render(form(true))).click();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    (await render(form(false))).click();
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });
});
