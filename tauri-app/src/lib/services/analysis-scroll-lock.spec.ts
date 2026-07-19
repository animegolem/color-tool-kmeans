import { describe, expect, it, vi } from 'vitest';
import { createAnalysisScrollLock } from './analysis-scroll-lock';

function harness(initialTop = 0) {
  const container = { scrollTop: initialTop };
  const scheduled: Array<() => void> = [];
  const lock = createAnalysisScrollLock({
    canUseDom: () => true,
    findContainer: () => container,
    scheduleRestore: (restore) => scheduled.push(restore),
  });
  return { container, scheduled, lock };
}

describe('analysis scroll lock', () => {
  it('SWEEP-028: only the bound request token can restore the capture', () => {
    const { container, scheduled, lock } = harness(240);
    lock.capture();
    lock.bind(7);
    container.scrollTop = 0;

    lock.restore(6);
    expect(scheduled).toHaveLength(0);

    lock.restore(7);
    expect(scheduled).toHaveLength(1);
    expect(container.scrollTop).toBe(0);

    scheduled[0]();
    expect(container.scrollTop).toBe(240);
    lock.restore(7);
    expect(scheduled).toHaveLength(1);
  });

  it('SWEEP-028: a new capture or clear revokes older ownership', () => {
    const { scheduled, lock } = harness(100);
    lock.capture();
    lock.bind(1);

    lock.capture();
    lock.bind(2);
    lock.restore(1);
    expect(scheduled).toHaveLength(0);

    lock.clear();
    lock.restore(2);
    expect(scheduled).toHaveLength(0);
  });

  it('SWEEP-028: missing DOM access leaves capture and restore inert', () => {
    const findContainer = vi.fn();
    const scheduleRestore = vi.fn();
    const lock = createAnalysisScrollLock({
      canUseDom: () => false,
      findContainer,
      scheduleRestore,
    });

    lock.capture();
    lock.bind(1);
    lock.restore(1);

    expect(findContainer).not.toHaveBeenCalled();
    expect(scheduleRestore).not.toHaveBeenCalled();
  });
});
