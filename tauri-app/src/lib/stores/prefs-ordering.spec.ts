import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => ({ prefs: undefined as unknown }));
const storeMocks = vi.hoisted(() => ({
  get: vi.fn(async () => storage.prefs),
  set: vi.fn(async (_key: string, value: unknown) => {
    storage.prefs = structuredClone(value);
  }),
  save: vi.fn(async () => undefined),
}));

vi.mock('@tauri-apps/plugin-store', () => ({
  LazyStore: class {
    get = storeMocks.get;
    set = storeMocks.set;
    save = storeMocks.save;
  },
}));

import { DEFAULTS, resetPrefs, savePrefs, type PrefsV1 } from './prefs';

describe('preference write ordering', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    storage.prefs = structuredClone(DEFAULTS);
    await resetPrefs();
    vi.clearAllMocks();
  });

  it('SWEEP-016 serializes partial writes so concurrent updates are not lost', async () => {
    await Promise.all([
      savePrefs({ exportScale: 3 }),
      savePrefs({ display: { compactSidebars: true } } as Partial<PrefsV1>),
    ]);

    const persisted = storage.prefs as PrefsV1;
    expect(persisted.exportScale).toBe(3);
    expect(persisted.display.compactSidebars).toBe(true);
    expect(storeMocks.get).toHaveBeenCalledTimes(2);
    expect(storeMocks.save).toHaveBeenCalledTimes(2);
  });

  it('SWEEP-016 orders reset after already-started writes', async () => {
    await Promise.all([savePrefs({ exportScale: 4 }), resetPrefs()]);

    expect(storage.prefs).toEqual(DEFAULTS);
  });
});
