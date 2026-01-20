import { writable, derived } from 'svelte/store';
import type { ImageDataset } from '../compute/image-loader';

export type View = 'home' | 'graphs' | 'exports';

export interface AnalysisParams {
  clusters: number;
  quality: number;
  ignoreTopN: number;
  symbolScale: number;
  showClusterOutline: boolean;
  showAxisLabels: boolean;
  showGamutBackground: boolean;
  showPaletteMask: boolean;
  useHslPolar: boolean;
  hueLightnessSizeMode: 'frequency' | 'chroma';
  histogramSort: 'frequency' | 'hue' | 'lightness';
  useGradientOverlay: boolean;
}

export const currentView = writable<View>('home');

export type ImageSource = { kind: 'path'; path: string } | { kind: 'blob' };

export interface ImageEntry {
  id: string;
  name: string;
  path?: string;
  size: number;
  source: ImageSource;
  previewUrl: string | null;
}

export interface SelectedImage extends ImageEntry {
  dataset: ImageDataset;
}

export const images = writable<ImageEntry[]>([]);
export const activeImageId = writable<string | null>(null);

const imageDatasets = new Map<string, ImageDataset>();
const objectUrls = new Map<string, string>();

export const selectedFile = derived([images, activeImageId], ([$images, $activeId]) => {
  if (!$activeId) return null;
  const entry = $images.find((item) => item.id === $activeId);
  if (!entry) return null;
  const dataset = imageDatasets.get(entry.id);
  if (!dataset) return null;
  return { ...entry, dataset };
});

export const params = writable<AnalysisParams>({
  clusters: 120,
  quality: 2,
  ignoreTopN: 0,
  symbolScale: 1,
  showClusterOutline: false,
  showAxisLabels: true,
  showGamutBackground: false,
  showPaletteMask: false,
  useHslPolar: true,
  hueLightnessSizeMode: 'chroma',
  histogramSort: 'frequency',
  useGradientOverlay: false
});

export const hasFile = derived(selectedFile, ($file) => $file !== null);

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

function revokeObjectUrl(url: string) {
  if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url);
  }
}

function trackPreviewUrl(entry: ImageEntry) {
  if (entry.source.kind !== 'blob') return;
  if (!entry.previewUrl) return;
  const existing = objectUrls.get(entry.id);
  if (existing && existing !== entry.previewUrl) {
    revokeObjectUrl(existing);
  }
  objectUrls.set(entry.id, entry.previewUrl);
}

function releaseImage(entry: ImageEntry) {
  imageDatasets.delete(entry.id);
  const url = objectUrls.get(entry.id);
  if (url) {
    revokeObjectUrl(url);
    objectUrls.delete(entry.id);
  }
}

export function setFile(entry: ImageEntry, dataset: ImageDataset) {
  imageDatasets.set(entry.id, dataset);
  trackPreviewUrl(entry);
  images.update((list) => {
    const index = list.findIndex((item) => item.id === entry.id);
    if (index === -1) {
      return [...list, entry];
    }
    const next = list.slice();
    next[index] = entry;
    return next;
  });
  activeImageId.set(entry.id);
  resetAnalysis();
}

export function clearFile() {
  images.update((list) => {
    list.forEach((entry) => releaseImage(entry));
    return [];
  });
  activeImageId.set(null);
  resetAnalysis();
  try {
    // Clear native path used by Tauri compute bridge to avoid stale state
    if ((globalThis as any).__ACTIVE_IMAGE_PATH__) {
      delete (globalThis as any).__ACTIVE_IMAGE_PATH__;
    }
  } catch {
    // ignore
  }
}
