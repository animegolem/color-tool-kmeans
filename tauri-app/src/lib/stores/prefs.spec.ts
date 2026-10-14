import { afterEach, describe, expect, it, vi } from 'vitest';
import { get, writable } from 'svelte/store';
import type { PreferenceAdapter } from '../bridges/preferences';
import { PreferencePersistenceError } from '../bridges/preferences';
import { PrefsSchemaError } from '../preferences/schema';
import { createPrefsPersistence, DEFAULTS } from './prefs';
import {
  dismissPreferenceWarning,
  persistStore,
  preferencePersistenceWarning,
} from './preferences';

function memoryAdapter(initial: unknown = null): PreferenceAdapter & {
  value: unknown;
} {
  return {
    id: 'tauri-store',
    value: initial,
    async read() {
      return this.value;
    },
    async write(prefs) {
      this.value = prefs;
    },
  };
}

describe('preference persistence facade', () => {
  afterEach(() => {
    dismissPreferenceWarning();
    vi.restoreAllMocks();
  });

  it('migrates an unversioned partial record onto complete v1 defaults', async () => {
    const adapter = memoryAdapter({
      analysis: { clusters: 23 },
      display: { compactSidebars: true },
    });
    const persistence = createPrefsPersistence(adapter);

    await expect(persistence.load()).resolves.toMatchObject({
      version: 1,
      analysis: { clusters: 23, quality: DEFAULTS.analysis.quality },
      display: { compactSidebars: true },
      exports: DEFAULTS.exports,
    });
  });

  it('rejects explicit future versions with a typed load failure', async () => {
    const persistence = createPrefsPersistence(
      memoryAdapter({ version: 2, analysis: {} })
    );

    const failure = await persistence.load().catch((error) => error);

    expect(failure).toBeInstanceOf(PreferencePersistenceError);
    expect(failure).toMatchObject({
      operation: 'load',
      adapterId: 'tauri-store',
      cause: expect.any(PrefsSchemaError),
    });
    expect(persistence.current()).toEqual(DEFAULTS);
  });

  it('rejects corrupt known fields instead of silently normalizing them', async () => {
    const persistence = createPrefsPersistence(
      memoryAdapter({
        version: 1,
        display: { videoStripMode: 'future-mode' },
      })
    );

    await expect(persistence.load()).rejects.toMatchObject({
      operation: 'load',
      cause: expect.any(PrefsSchemaError),
    });
    expect(persistence.current()).toEqual(DEFAULTS);
  });

  it('merges partial saves into one full object and verifies readback', async () => {
    const adapter = memoryAdapter();
    const write = vi.spyOn(adapter, 'write');
    const persistence = createPrefsPersistence(adapter);
    await persistence.load();

    await persistence.save({
      analysis: { ...DEFAULTS.analysis, clusters: 31 },
    });
    await persistence.save({
      display: { ...DEFAULTS.display, compactSidebars: true },
    });

    expect(write).toHaveBeenCalledTimes(2);
    expect(adapter.value).toMatchObject({
      version: 1,
      analysis: { clusters: 31 },
      display: { compactSidebars: true },
      exports: DEFAULTS.exports,
    });
    expect(persistence.current()).toMatchObject({
      analysis: { clusters: 31 },
      display: { compactSidebars: true },
    });
  });

  it('resets to a verified full default object', async () => {
    const adapter = memoryAdapter({
      version: 1,
      analysis: { clusters: 9 },
    });
    const persistence = createPrefsPersistence(adapter);
    await persistence.load();

    await persistence.reset();

    expect(adapter.value).toEqual(DEFAULTS);
    expect(persistence.current()).toEqual(DEFAULTS);
  });

  it('preserves prior in-memory state when write or readback fails', async () => {
    const denied = memoryAdapter();
    denied.write = vi.fn(async () => {
      throw new Error('quota');
    });
    const deniedPersistence = createPrefsPersistence(denied);
    await deniedPersistence.load();

    await expect(
      deniedPersistence.save({ exportScale: 4 })
    ).rejects.toMatchObject({ operation: 'save' });
    expect(deniedPersistence.current().exportScale).toBe(DEFAULTS.exportScale);

    const stale = memoryAdapter();
    stale.write = vi.fn(async () => undefined);
    const stalePersistence = createPrefsPersistence(stale);
    await stalePersistence.load();
    await expect(
      stalePersistence.save({ exportScale: 4 })
    ).rejects.toMatchObject({ operation: 'save' });
    expect(stalePersistence.current().exportScale).toBe(DEFAULTS.exportScale);
  });

  it('catches subscription write failures and clears them after a later success', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const source = writable(1);
    const persist = vi
      .fn<[Partial<typeof DEFAULTS>], Promise<void>>()
      .mockRejectedValueOnce(new Error('denied'))
      .mockResolvedValueOnce(undefined);
    const unsubscribe = persistStore(
      source,
      (exportScale) => ({ exportScale }),
      0,
      persist
    );

    source.set(2);
    await vi.waitFor(() => {
      expect(get(preferencePersistenceWarning)?.operation).toBe('save');
    });

    source.set(3);
    await vi.waitFor(() => {
      expect(get(preferencePersistenceWarning)).toBeNull();
    });
    expect(persist).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});
