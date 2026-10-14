import { LazyStore } from '@tauri-apps/plugin-store';
import { clonePrefsV1, type PrefsV1 } from '../preferences/schema';
import { getRuntimeTarget, type RuntimeTarget } from '../runtime/target';

export const BROWSER_PREFS_KEY = 'color-tool.preferences.v1';
const TAURI_PREFS_KEY = 'prefs';

export type PreferenceAdapterId = 'tauri-store' | 'browser-local-storage';
export type PreferenceOperation = 'load' | 'save' | 'reset';

export interface PreferenceAdapter {
  readonly id: PreferenceAdapterId;
  read(): Promise<unknown | null>;
  write(prefs: PrefsV1): Promise<void>;
}

export class PreferencePersistenceError extends Error {
  readonly operation: PreferenceOperation;
  readonly adapterId: PreferenceAdapterId;
  override readonly cause: unknown;

  constructor(
    operation: PreferenceOperation,
    adapterId: PreferenceAdapterId,
    cause: unknown
  ) {
    super(`Could not ${operation} preferences (${adapterId}).`);
    this.name = 'PreferencePersistenceError';
    this.operation = operation;
    this.adapterId = adapterId;
    this.cause = cause;
  }
}

interface TauriStoreLike {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  save(): Promise<void>;
}

interface BrowserStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function createTauriPreferenceAdapter(
  createStore: () => TauriStoreLike = () => new LazyStore('settings.json')
): PreferenceAdapter {
  let store: TauriStoreLike | null = null;
  const getStore = () => (store ??= createStore());
  return {
    id: 'tauri-store',
    async read() {
      return (await getStore().get<unknown>(TAURI_PREFS_KEY)) ?? null;
    },
    async write(prefs) {
      const target = getStore();
      await target.set(TAURI_PREFS_KEY, clonePrefsV1(prefs));
      await target.save();
    },
  };
}

export function createBrowserPreferenceAdapter(
  getStorage: () => BrowserStorageLike = () => globalThis.localStorage
): PreferenceAdapter {
  return {
    id: 'browser-local-storage',
    async read() {
      const serialized = getStorage().getItem(BROWSER_PREFS_KEY);
      if (serialized === null) return null;
      const parsed: unknown = JSON.parse(serialized);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        return { ...(parsed as Record<string, unknown>), exportDir: null };
      }
      return parsed;
    },
    async write(prefs) {
      const browserPrefs = { ...clonePrefsV1(prefs), exportDir: null };
      getStorage().setItem(BROWSER_PREFS_KEY, JSON.stringify(browserPrefs));
    },
  };
}

export function normalizePrefsForAdapter(
  adapter: PreferenceAdapter,
  prefs: PrefsV1
): PrefsV1 {
  const normalized = clonePrefsV1(prefs);
  if (adapter.id === 'browser-local-storage') normalized.exportDir = null;
  return normalized;
}

export function createPreferenceAdapterForTarget(
  target: RuntimeTarget
): PreferenceAdapter {
  return target.kind === 'tauri'
    ? createTauriPreferenceAdapter()
    : createBrowserPreferenceAdapter();
}

let cachedPreferenceAdapter: PreferenceAdapter | null = null;

export function initializePreferenceAdapter(
  target: RuntimeTarget
): PreferenceAdapter {
  const expected = target.capabilities.preferenceAdapter;
  if (cachedPreferenceAdapter && cachedPreferenceAdapter.id !== expected) {
    throw new Error(
      `Preference adapter already initialized as ${cachedPreferenceAdapter.id}; expected ${expected}`
    );
  }
  cachedPreferenceAdapter ??= createPreferenceAdapterForTarget(target);
  return cachedPreferenceAdapter;
}

export function getPreferenceAdapter(): PreferenceAdapter {
  return (
    cachedPreferenceAdapter ?? initializePreferenceAdapter(getRuntimeTarget())
  );
}
