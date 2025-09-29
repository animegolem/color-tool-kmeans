import { writable, derived } from 'svelte/store';
import type { ImageDataset } from '../compute/image-loader';

export type View = 'home' | 'graphs' | 'exports';

export interface AnalysisParams {
  colorSpace: 'RGB' | 'HSL' | 'YUV' | 'CIELAB' | 'CIELUV';
  clusters: number;
  stride: number;
  minLum: number;
  axis: 'HSL' | 'HLS';
  symbolScale: number;
}

export const currentView = writable<View>('home');

export interface SelectedImage {
  id: string;
  name: string;
  path?: string;
  size: number;
  dataset: ImageDataset;
}

export const selectedFile = writable<SelectedImage | null>(null);

export const params = writable<AnalysisParams>({
  colorSpace: 'HSL',
  clusters: 10,
  stride: 4,
  minLum: 10,
  axis: 'HSL',
  symbolScale: 1
});

export const hasFile = derived(selectedFile, ($file) => $file !== null);

export type AnalysisState = 'idle' | 'pending' | 'ready' | 'error';

export interface AnalysisCluster {
  count: number;
  share: number;
  centroidSpace: [number, number, number];
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
export const analysisResult = writable<AnalysisResult | null>(null);
export const analysisError = writable<string | null>(null);

export function setAnalysisPending() {
  analysisState.set('pending');
  analysisError.set(null);
}

export function setAnalysisSuccess(result: AnalysisResult) {
  analysisResult.set(result);
  analysisState.set('ready');
  analysisError.set(null);
}

export function setAnalysisError(message: string) {
  analysisError.set(message);
  analysisState.set('error');
}

export function resetAnalysis() {
  analysisResult.set(null);
  analysisError.set(null);
  analysisState.set('idle');
}

export function clearAnalysisError() {
  analysisError.set(null);
  analysisState.set('idle');
}

export const topClusters = derived(analysisResult, ($result) => {
  if (!$result) return [] as AnalysisCluster[];
  return $result.clusters.slice(0, 8);
});

export function setView(view: View) {
  currentView.set(view);
}

export function setFile(image: SelectedImage) {
  selectedFile.set(image);
  resetAnalysis();
}

export function clearFile() {
  selectedFile.set(null);
  resetAnalysis();
}
