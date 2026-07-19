interface ScrollContainer {
  scrollTop: number;
}

export interface AnalysisScrollLockDeps {
  canUseDom: () => boolean;
  findContainer: () => ScrollContainer | null;
  scheduleRestore: (restore: () => void) => void;
}

function defaultCanUseDom() {
  return typeof document !== 'undefined';
}

function defaultFindContainer(): ScrollContainer | null {
  if (typeof document === 'undefined') return null;
  const element = document.querySelector('.view-container');
  return element instanceof HTMLElement ? element : null;
}

function defaultScheduleRestore(restore: () => void) {
  Promise.resolve().then(() => {
    requestAnimationFrame(restore);
  });
}

export function createAnalysisScrollLock(
  deps: AnalysisScrollLockDeps = {
    canUseDom: defaultCanUseDom,
    findContainer: defaultFindContainer,
    scheduleRestore: defaultScheduleRestore,
  }
) {
  let lock: { top: number; token: number | null } | null = null;

  function capture() {
    if (!deps.canUseDom()) return;
    const container = deps.findContainer();
    if (container) {
      lock = { top: container.scrollTop, token: null };
    }
  }

  function bind(token: number) {
    if (lock) lock.token = token;
  }

  function restore(token: number) {
    if (!lock || lock.token !== token) return;
    if (!deps.canUseDom()) return;
    const targetTop = lock.top;
    lock = null;
    deps.scheduleRestore(() => {
      const container = deps.findContainer();
      if (container) container.scrollTop = targetTop;
    });
  }

  function clear() {
    lock = null;
  }

  return { capture, bind, restore, clear };
}
