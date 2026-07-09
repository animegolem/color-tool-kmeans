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

export function setValueAnalysisPending(
  imageId: string,
  levels: number,
  notanMode: boolean
) {
  const key = valueAnalysisKey(imageId, levels, notanMode);
  valueAnalysisStateByKey.update((state) => ({ ...state, [key]: 'pending' }));
  valueAnalysisErrorByKey.update((errors) => ({ ...errors, [key]: null }));
}

export function setValueAnalysisSuccess(
  imageId: string,
  levels: number,
  notanMode: boolean,
  result: ValueAnalysisResult
) {
  const key = valueAnalysisKey(imageId, levels, notanMode);
  valueAnalysisByKey.update((cache) => ({ ...cache, [key]: result }));
  valueAnalysisStateByKey.update((state) => ({ ...state, [key]: 'ready' }));
  valueAnalysisErrorByKey.update((errors) => ({ ...errors, [key]: null }));
}

export function setValueAnalysisError(
  imageId: string,
  levels: number,
  notanMode: boolean,
  message: string
) {
  const key = valueAnalysisKey(imageId, levels, notanMode);
  valueAnalysisStateByKey.update((state) => ({ ...state, [key]: 'error' }));
  valueAnalysisErrorByKey.update((errors) => ({ ...errors, [key]: message }));
}
