import { beforeEach, expect, it, vi } from 'vitest';

import { useStack } from './useStack';
const { pop, replace, activities } = vi.hoisted(() => ({
  pop: vi.fn(),
  replace: vi.fn(),
  activities: [] as { exitedBy?: object }[],
}));
vi.mock('@/app/routes/stackflow', () => ({
  actions: { getStack: () => ({ activities }) },
  useFlow: () => ({ pop, replace }),
}));
beforeEach(() => {
  pop.mockReset();
  replace.mockReset();
  activities.splice(0);
});
it('직접 진입한 단일 화면은 대체 경로로 교체해 뒤로 가기 순환을 만들지 않는다', () => {
  activities.push({});
  useStack().pop('HomePage');
  expect(replace).toHaveBeenCalledWith('HomePage', {});
  expect(pop).not.toHaveBeenCalled();
});
it('이전 화면이 남아 있으면 원래의 뒤로 가기를 유지한다', () => {
  activities.push({}, {});
  useStack().pop('HomePage');
  expect(pop).toHaveBeenCalledTimes(1);
  expect(replace).not.toHaveBeenCalled();
});
it('퇴장한 화면은 돌아갈 이전 화면으로 세지 않는다', () => {
  activities.push({ exitedBy: {} }, {});
  useStack().pop('HomePage');
  expect(replace).toHaveBeenCalledWith('HomePage', {});
  expect(pop).not.toHaveBeenCalled();
});
