import { AlertDialog } from '@azit/design-system/alert-dialog';
import { act } from 'react';
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

vi.mock(
  '../../../../../../packages/design-system/src/components/alert-dialog/AlertDialog.css.ts',
  () => ({
    overlay: 'overlay',
    content: 'content',
    textContainer: 'text',
    title: 'title',
    description: 'description',
    buttonContainer: 'buttons',
    cancelButton: 'cancel',
    actionButton: 'action',
    actionButtonDisabled: 'disabled',
    actionButtonDanger: 'danger',
    actionButtonFullWidth: 'full',
  })
);
vi.mock(
  '../../../../../../packages/design-system/src/components/button/Button.css.ts',
  () => ({ loadingContent: 'loading', loadingSpinner: 'spinner' })
);

let root: Root;
let container: HTMLDivElement;
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

const dialog = () => document.querySelector('[role="alertdialog"]');
const action = () => dialog()!.querySelector<HTMLButtonElement>('.action')!;

describe('확인창 비동기 처리', () => {
  it('기존 확인창은 액션 실행 후 닫힌다', async () => {
    const onAction = vi.fn();
    await act(async () => {
      root.render(
        <AlertDialog
          trigger={<button>열기</button>}
          title="확인"
          description="설명"
          onAction={onAction}
        />
      );
    });
    await act(async () => {
      container.querySelector('button')!.click();
    });
    expect(dialog()).not.toBeNull();
    await act(async () => {
      action().click();
    });
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(dialog()).toBeNull();
  });

  it('비동기 확인창은 열린 채 로딩을 표시하고 중복 실행과 취소를 막는다', async () => {
    const onAction = vi.fn();
    const render = async (loading: boolean) => {
      await act(async () => {
        root.render(
          <AlertDialog
            open
            title="확인"
            description="설명"
            closeOnAction={false}
            actionLoading={loading}
            onAction={onAction}
          />
        );
      });
    };
    await render(false);
    await act(async () => {
      action().click();
    });
    expect(dialog()).not.toBeNull();
    await render(true);
    expect(action()).toBeDisabled();
    expect(action()).toHaveAttribute('aria-busy', 'true');
    expect(action().querySelector('.spinner')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
    const cancel = dialog()!.querySelector<HTMLButtonElement>('.cancel')!;
    expect(cancel).toBeDisabled();
    await act(async () => {
      action().click();
      cancel.click();
    });
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('실패 후 같은 확인창에서 다시 시도할 수 있다', async () => {
    const onAction = vi.fn();
    const render = async (loading: boolean) => {
      await act(async () => {
        root.render(
          <AlertDialog
            open
            title="확인"
            description="설명"
            closeOnAction={false}
            actionLoading={loading}
            onAction={onAction}
          />
        );
      });
    };
    await render(true);
    await render(false);
    expect(action()).toBeEnabled();
    expect(action().querySelector('.spinner')).toBeNull();
    await act(async () => {
      action().click();
    });
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
