import {
  getPreferenceAdapter,
  normalizePrefsForAdapter,
  PreferencePersistenceError,
  type PreferenceAdapter,
  type PreferenceOperation,
} from '../bridges/preferences';
import {
  clonePrefsV1,
  DEFAULT_PREFS,
  mergePrefsPatch,
  mergePrefsV1,
  prefsEqual,
  type PrefsV1,
} from '../preferences/schema';

export type { PrefsV1 } from '../preferences/schema';
export const DEFAULTS = DEFAULT_PREFS;

export interface PrefsPersistence {
  readonly adapterId: PreferenceAdapter['id'];
  load(): Promise<PrefsV1>;
  save(partial: Partial<PrefsV1>): Promise<void>;
  reset(): Promise<void>;
  current(): PrefsV1;
}

export function createPrefsPersistence(
  adapter: PreferenceAdapter
): PrefsPersistence {
  let current = normalizePrefsForAdapter(adapter, DEFAULT_PREFS);
  let queue: Promise<void> = Promise.resolve();

  function wrap(operation: PreferenceOperation, cause: unknown): never {
    if (cause instanceof PreferencePersistenceError) throw cause;
    throw new PreferencePersistenceError(operation, adapter.id, cause);
  }

  function serialize<T>(
    operation: PreferenceOperation,
    task: () => Promise<T>
  ) {
    const result = queue
      .then(task, task)
      .catch((cause) => wrap(operation, cause));
    queue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }

  async function writeAndVerify(next: PrefsV1): Promise<void> {
    const expected = normalizePrefsForAdapter(adapter, next);
    await adapter.write(expected);
    const raw = await adapter.read();
    if (raw === null) throw new Error('Preference readback was empty.');
    const readback = normalizePrefsForAdapter(adapter, mergePrefsV1(raw));
    if (!prefsEqual(readback, expected)) {
      throw new Error('Preference readback did not match the written value.');
    }
    current = expected;
  }

  return {
    adapterId: adapter.id,
    load() {
      return serialize('load', async () => {
        const raw = await adapter.read();
        current =
          raw === null
            ? normalizePrefsForAdapter(adapter, DEFAULT_PREFS)
            : normalizePrefsForAdapter(adapter, mergePrefsV1(raw));
        return clonePrefsV1(current);
      });
    },
    save(partial) {
      return serialize('save', async () => {
        await writeAndVerify(mergePrefsPatch(current, partial));
      });
    },
    reset() {
      return serialize('reset', async () => {
        await writeAndVerify(DEFAULT_PREFS);
      });
    },
    current() {
      return clonePrefsV1(current);
    },
  };
}

let defaultPersistence: PrefsPersistence | null = null;

function persistence(): PrefsPersistence {
  return (defaultPersistence ??= createPrefsPersistence(
    getPreferenceAdapter()
  ));
}

export function loadPrefs(): Promise<PrefsV1> {
  return persistence().load();
}

export function savePrefs(partial: Partial<PrefsV1>): Promise<void> {
  return persistence().save(partial);
}

export function resetPrefs(): Promise<void> {
  return persistence().reset();
}
