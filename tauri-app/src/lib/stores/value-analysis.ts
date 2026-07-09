import { writable, derived } from 'svelte/store';

export type ValueAnalysisState = 'idle' | 'pending' | 'ready' | 'error';

export interface ValueAnalysisResult {
  neutral: string;
  neutralWidth: number;
  neutralHeight: number;
  preview: string;
  previewWidth: number;
  previewHeight: number;
  bucketMap: string;
  bucketMapData: number[];
  p10: number;
  p90: number;
  p01: number;
  p99: number;
  centroids: number[];
  boundaries: number[];
  bucketValues: number[];
  counts: number[];
  histogramBins: number[];
  levels: number;
  notanMode: boolean;
}

export const valueAnalysisLevels = writable<number>(3);
export const valueAnalysisNotanMode = derived(
  valueAnalysisLevels,
  ($l) => $l === 2
);

export function valueAnalysisKey(
  imageId: string,
  levels: number,
  notanMode: boolean
) {
  const mode = notanMode && levels === 2 ? 'notan' : 'kmeans';
  return `${imageId}:${levels}:${mode}`;
}

export const valueAnalysisByKey = writable<Record<string, ValueAnalysisResult>>(
  {}
);
export const valueAnalysisStateByKey = writable<
  Record<string, ValueAnalysisState>
>({});
export const valueAnalysisErrorByKey = writable<Record<string, string | null>>(
  {}
);

let nextValueAnalysisRequestToken = 0;
const pendingValueAnalysisTokenByKey = new Map<string, number>();

function removeKeysForImage<T>(cache: Record<string, T>, imageId: string) {
  const next: Record<string, T> = {};
  for (const [key, value] of Object.entries(cache)) {
    if (!key.startsWith(`${imageId}:`)) next[key] = value;
  }
  return next;
}

export function invalidateValueAnalysisForImage(imageId: string) {
  // Drop pending request tokens too: a stale in-flight completion must not
  // pass the ownership check and land after invalidation.
  for (const key of pendingValueAnalysisTokenByKey.keys()) {
    if (key.startsWith(`${imageId}:`))
      pendingValueAnalysisTokenByKey.delete(key);
  }
  valueAnalysisByKey.update((cache) => removeKeysForImage(cache, imageId));
  valueAnalysisStateByKey.update((state) => removeKeysForImage(state, imageId));
  valueAnalysisErrorByKey.update((errors) =>
    removeKeysForImage(errors, imageId)
  );
}

export function setValueAnalysisPending(
  imageId: string,
  levels: number,
  notanMode: boolean
): number {
  const key = valueAnalysisKey(imageId, levels, notanMode);
  const requestToken = ++nextValueAnalysisRequestToken;
  pendingValueAnalysisTokenByKey.set(key, requestToken);
  valueAnalysisStateByKey.update((state) => ({ ...state, [key]: 'pending' }));
  valueAnalysisErrorByKey.update((errors) => ({ ...errors, [key]: null }));
  return requestToken;
}

export function resetValueAnalysisPending(
  imageId: string,
  levels: number,
  notanMode: boolean,
  requestToken: number
) {
  const key = valueAnalysisKey(imageId, levels, notanMode);
  if (pendingValueAnalysisTokenByKey.get(key) !== requestToken) return;
  pendingValueAnalysisTokenByKey.delete(key);
  valueAnalysisStateByKey.update((state) => {
    if (state[key] !== 'pending') return state;
    const next = { ...state };
    delete next[key];
    return next;
  });
  valueAnalysisErrorByKey.update((errors) => {
    if (!(key in errors)) return errors;
    const next = { ...errors };
    delete next[key];
    return next;
  });
}

export function setValueAnalysisSuccess(
  imageId: string,
  levels: number,
  notanMode: boolean,
  result: ValueAnalysisResult,
  requestToken?: number
) {
  const key = valueAnalysisKey(imageId, levels, notanMode);
  if (
    requestToken !== undefined &&
    pendingValueAnalysisTokenByKey.get(key) !== requestToken
  ) {
    return;
  }
  pendingValueAnalysisTokenByKey.delete(key);
  valueAnalysisByKey.update((cache) => ({ ...cache, [key]: result }));
  valueAnalysisStateByKey.update((state) => ({ ...state, [key]: 'ready' }));
  valueAnalysisErrorByKey.update((errors) => ({ ...errors, [key]: null }));
}

export function setValueAnalysisError(
  imageId: string,
  levels: number,
  notanMode: boolean,
  message: string,
  requestToken?: number
) {
  const key = valueAnalysisKey(imageId, levels, notanMode);
  if (
    requestToken !== undefined &&
    pendingValueAnalysisTokenByKey.get(key) !== requestToken
  ) {
    return;
  }
  pendingValueAnalysisTokenByKey.delete(key);
  valueAnalysisStateByKey.update((state) => ({ ...state, [key]: 'error' }));
  valueAnalysisErrorByKey.update((errors) => ({ ...errors, [key]: message }));
}
