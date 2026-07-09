import { writable } from 'svelte/store';

export interface AnalysisParams {
  clusters: number;
  quality: number;
  ignoreTopN: number;
  mergeThreshold: number;
  symbolScale: number;
  showClusterOutline: boolean;
  showAxisLabels: boolean;
  polarMode: 'oklch' | 'okhsv' | 'hsv';
  hueLightnessSizeMode: 'frequency' | 'chroma';
  histogramSort: 'frequency' | 'hue' | 'lightness';
  snapToReal: boolean;
  showHistogram: boolean;
  showPolarChart: boolean;
  showHueLightness: boolean;
}

export const params = writable<AnalysisParams>({
  clusters: 45,
  quality: 2,
  ignoreTopN: 0,
  mergeThreshold: 0,
  symbolScale: 1,
  showClusterOutline: false,
  showAxisLabels: true,
  snapToReal: true,
  polarMode: 'okhsv',
  hueLightnessSizeMode: 'chroma',
  histogramSort: 'frequency',
  showHistogram: true,
  showPolarChart: true,
  showHueLightness: true
});

export type AnalysisState = 'idle' | 'pending' | 'ready' | 'error';

export interface AnalysisCluster {
  count: number;
  share: number;
  centroidSpace: [number, number, number];
  oklab: [number, number, number];
  oklch: [number, number, number];
  rgb: { r: number; g: number; b: number };
  hsv: [number, number, number];
}

export interface AnalysisResult {
  clusters: AnalysisCluster[];
  iterations: number;
  durationMs: number;
  totalSamples: number;
  variant: string;
}

export const analysisState = writable<AnalysisState>('idle');
export const analysisById = writable<Record<string, AnalysisResult>>({});
export const analysisError = writable<string | null>(null);

let nextAnalysisRequestToken = 0;
let pendingAnalysisRequestToken: number | null = null;

export function setAnalysisPending(): number {
  const requestToken = ++nextAnalysisRequestToken;
  pendingAnalysisRequestToken = requestToken;
  analysisState.set('pending');
  analysisError.set(null);
  return requestToken;
}

export function resetAnalysisPending(requestToken: number) {
  if (pendingAnalysisRequestToken !== requestToken) return;
  pendingAnalysisRequestToken = null;
  analysisState.update((state) => (state === 'pending' ? 'idle' : state));
  analysisError.set(null);
}

export function setAnalysisSuccess(
  result: AnalysisResult,
  imageId: string | null,
  requestToken?: number
) {
  if (requestToken !== undefined && pendingAnalysisRequestToken !== requestToken) return;
  pendingAnalysisRequestToken = null;
  if (imageId) {
    analysisById.update((cache) => ({ ...cache, [imageId]: result }));
  }
  analysisState.set('ready');
  analysisError.set(null);
}

export function setAnalysisError(message: string, requestToken?: number) {
  if (requestToken !== undefined && pendingAnalysisRequestToken !== requestToken) return;
  pendingAnalysisRequestToken = null;
  analysisError.set(message);
  analysisState.set('error');
}

export function resetAnalysis() {
  pendingAnalysisRequestToken = null;
  analysisState.set('idle');
  analysisError.set(null);
}

export function clearAnalysisError() {
  pendingAnalysisRequestToken = null;
  analysisError.set(null);
  analysisState.set('idle');
}
