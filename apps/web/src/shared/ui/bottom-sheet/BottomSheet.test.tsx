import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { BottomSheet } from './BottomSheet';

vi.mock('./BottomSheet.css', () => ({
  overlay: () => 'sheet-overlay',
  container: () => 'sheet-container',
  content: 'sheet-content',
  dragHandleArea: 'sheet-handle',
  dragHandle: 'sheet-handle-bar',
}));

let root: Root;
let container: HTMLDivElement;
let bodyStyle: string | null;

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  bodyStyle = document.body.getAttribute('style');
  document.body.removeAttribute('style');
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  if (bodyStyle === null) document.body.removeAttribute('style');
  else document.body.setAttribute('style', bodyStyle);
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('열린 시트를 남겨두고 페이지가 사라지면 기존 overflow 값을 복구한다', async () => {
  document.body.style.overflow = 'auto';
  document.body.style.setProperty('pointer-events', 'auto');
  await act(async () =>
    root.render(<BottomSheet isOpen>프로필 이미지 선택</BottomSheet>)
  );
  expect(document.body.style.overflow).toBe('hidden');

  await act(async () => root.render(null));

  expect(document.querySelector('.sheet-overlay')).toBeNull();
  expect(document.body.style.overflow).toBe('auto');
  expect(document.body.style.pointerEvents).toBe('auto');
});

it('닫힌 시트의 마운트와 언마운트는 다른 곳에서 설정한 잠금을 건드리지 않는다', async () => {
  document.body.style.overflow = 'hidden';
  await act(async () =>
    root.render(<BottomSheet isOpen={false}>닫힘</BottomSheet>)
  );
  expect(document.body.style.overflow).toBe('hidden');
  await act(async () => root.render(null));
  expect(document.body.style.overflow).toBe('hidden');
});

it.each([0, 1])(
  '여러 시트 중 %i번이 먼저 사라져도 마지막 시트까지 잠금을 유지한다',
  async (firstToClose) => {
    const sheets = (openIds: number[]) =>
      openIds.map((id) => (
        <BottomSheet key={id} isOpen>
          시트 {id}
        </BottomSheet>
      ));
    await act(async () => root.render(sheets([0, 1])));
    await act(async () => root.render(sheets([1 - firstToClose])));
    expect(document.body.style.overflow).toBe('hidden');
    await act(async () => root.render(null));
    expect(document.body.style.overflow).toBe('');
  }
);

it('닫힘 애니메이션이 끝나 오버레이가 제거될 때 잠금을 해제한다', async () => {
  await act(async () => root.render(<BottomSheet isOpen>열림</BottomSheet>));
  await act(async () =>
    root.render(<BottomSheet isOpen={false}>닫힘</BottomSheet>)
  );
  await act(async () => vi.advanceTimersByTime(299));
  expect(document.querySelector('.sheet-overlay')).not.toBeNull();
  expect(document.body.style.overflow).toBe('hidden');
  await act(async () => vi.advanceTimersByTime(1));
  expect(document.querySelector('.sheet-overlay')).toBeNull();
  expect(document.body.style.overflow).toBe('');
});

it('닫힘 도중 다시 열어도 이전 타이머가 잠금을 풀지 않는다', async () => {
  await act(async () => root.render(<BottomSheet isOpen>열림</BottomSheet>));
  await act(async () =>
    root.render(<BottomSheet isOpen={false}>닫힘</BottomSheet>)
  );
  await act(async () => vi.advanceTimersByTime(150));
  await act(async () =>
    root.render(<BottomSheet isOpen>다시 열림</BottomSheet>)
  );
  await act(async () => vi.advanceTimersByTime(500));
  expect(document.querySelector('.sheet-overlay')).not.toBeNull();
  expect(document.body.style.overflow).toBe('hidden');
  await act(async () => root.render(null));
  expect(document.body.style.overflow).toBe('');
});

it('StrictMode의 effect 재실행 후에도 마지막 언마운트에서 잠금을 정리한다', async () => {
  await act(async () =>
    root.render(
      <StrictMode>
        <BottomSheet isOpen>열림</BottomSheet>
      </StrictMode>
    )
  );
  expect(document.body.style.overflow).toBe('hidden');
  await act(async () => root.render(null));
  expect(document.body.style.overflow).toBe('');
});
