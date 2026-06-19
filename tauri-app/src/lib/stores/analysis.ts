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

export function setAnalysisPending() {
  analysisState.set('pending');
  analysisError.set(null);
}

export function setAnalysisSuccess(result: AnalysisResult, imageId: string | null) {
  if (imageId) {
    analysisById.update((cache) => ({ ...cache, [imageId]: result }));
  }
  analysisState.set('ready');
  analysisError.set(null);
}

export function setAnalysisError(message: string) {
  analysisError.set(message);
  analysisState.set('error');
}

export function resetAnalysis() {
  analysisState.set('idle');
  analysisError.set(null);
}

export function clearAnalysisError() {
  analysisError.set(null);
  analysisState.set('idle');
}
