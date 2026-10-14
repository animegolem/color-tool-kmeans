import { describe, expect, it, vi } from 'vitest';
import { clonePrefsV1, DEFAULT_PREFS } from '../preferences/schema';
import {
  BROWSER_PREFS_KEY,
  createBrowserPreferenceAdapter,
  createTauriPreferenceAdapter,
} from './preferences';

function memoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set(BROWSER_PREFS_KEY, initial);
  return {
    values,
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
  };
}

describe('preference adapters', () => {
  it('round-trips the full v1 object through localStorage and clears exportDir', async () => {
    const storage = memoryStorage();
    const adapter = createBrowserPreferenceAdapter(() => storage);
    const prefs = clonePrefsV1(DEFAULT_PREFS);
    prefs.analysis.clusters = 17;
    prefs.exportDir = '/native-only';

    await adapter.write(prefs);
    const stored = JSON.parse(storage.values.get(BROWSER_PREFS_KEY) ?? '{}');

    expect(storage.setItem).toHaveBeenCalledOnce();
    expect(stored).toMatchObject({
      version: 1,
      analysis: { clusters: 17 },
      exportDir: null,
    });
    await expect(adapter.read()).resolves.toMatchObject({
      version: 1,
      analysis: { clusters: 17 },
      exportDir: null,
    });
  });

  it('reports corrupt JSON and storage denial instead of falling back silently', async () => {
    const corrupt = createBrowserPreferenceAdapter(() => memoryStorage('{bad'));
    const denied = createBrowserPreferenceAdapter(() => ({
      getItem: () => null,
      setItem: () => {
        throw new DOMException('denied', 'SecurityError');
      },
    }));

    await expect(corrupt.read()).rejects.toBeInstanceOf(SyntaxError);
    await expect(denied.write(DEFAULT_PREFS)).rejects.toMatchObject({
      name: 'SecurityError',
    });
  });

  it('uses one lazy Tauri store and saves a full object', async () => {
    const values = new Map<string, unknown>();
    const store = {
      async get<T>(key: string): Promise<T | undefined> {
        return values.get(key) as T | undefined;
      },
      set: vi.fn(async (key: string, value: unknown) => {
        values.set(key, value);
      }),
      save: vi.fn(async () => undefined),
    };
    const createStore = vi.fn(() => store);
    const adapter = createTauriPreferenceAdapter(createStore);

    await adapter.write(DEFAULT_PREFS);

    expect(createStore).toHaveBeenCalledOnce();
    expect(store.set).toHaveBeenCalledWith(
      'prefs',
      expect.objectContaining({ version: 1 })
    );
    expect(store.save).toHaveBeenCalledOnce();
    await expect(adapter.read()).resolves.toMatchObject({ version: 1 });
    expect(createStore).toHaveBeenCalledOnce();
  });
});
