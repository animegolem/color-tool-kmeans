import { writable, derived, get } from 'svelte/store';
import type { ImageDataset } from '../compute/image-loader';

export type View = 'home' | 'values' | 'exports';

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
export const analysisById = writable<Record<string, AnalysisResult>>({});
export const analysisResult = derived([analysisById, activeImageId], ([$analysisById, $activeId]) => {
  if (!$activeId) return null;
  return $analysisById[$activeId] ?? null;
});
export const analysisError = writable<string | null>(null);

export type ValueStudyState = 'idle' | 'pending' | 'ready' | 'error';

export interface ValueStudyResult {
  tiles: string[];
  neutral: string;
  width: number;
  height: number;
  percentileLow: number;
  percentileHigh: number;
}

export const valueStudyById = writable<Record<string, ValueStudyResult>>({});
export const valueStudyStateById = writable<Record<string, ValueStudyState>>({});
export const valueStudyErrorById = writable<Record<string, string | null>>({});
export const valueStudyResult = derived([valueStudyById, activeImageId], ([$valueStudyById, $activeId]) => {
  if (!$activeId) return null;
  return $valueStudyById[$activeId] ?? null;
});
export const valueStudyState = derived(
  [valueStudyStateById, activeImageId],
  ([$valueStudyStateById, $activeId]) => ($activeId ? $valueStudyStateById[$activeId] ?? 'idle' : 'idle')
);
export const valueStudyError = derived(
  [valueStudyErrorById, activeImageId],
  ([$valueStudyErrorById, $activeId]) => ($activeId ? $valueStudyErrorById[$activeId] ?? null : null)
);

export type ValueAnalysisState = 'idle' | 'pending' | 'ready' | 'error';

export interface ValueAnalysisResult {
  neutral: string;
  neutralWidth: number;
  neutralHeight: number;
  preview: string;
  previewWidth: number;
  previewHeight: number;
  bucketMap: string;
  p10: number;
  p90: number;
  p01: number;
  p99: number;
  centroids: number[];
  boundaries: number[];
  bucketValues: number[];
  counts: number[];
  levels: number;
  notanMode: boolean;
}

export const valueAnalysisLevels = writable<number>(3);
export const valueAnalysisNotanMode = writable<boolean>(true);

function valueAnalysisKey(imageId: string, levels: number, notanMode: boolean) {
  const mode = notanMode && levels === 2 ? 'notan' : 'kmeans';
  return `${imageId}:${levels}:${mode}`;
}

export const valueAnalysisByKey = writable<Record<string, ValueAnalysisResult>>({});
export const valueAnalysisStateByKey = writable<Record<string, ValueAnalysisState>>({});
export const valueAnalysisErrorByKey = writable<Record<string, string | null>>({});
export const valueAnalysisResult = derived(
  [valueAnalysisByKey, activeImageId, valueAnalysisLevels, valueAnalysisNotanMode],
  ([$valueAnalysisByKey, $activeId, $levels, $notanMode]) => {
    if (!$activeId) return null;
    return $valueAnalysisByKey[valueAnalysisKey($activeId, $levels, $notanMode)] ?? null;
  }
);
export const valueAnalysisState = derived(
  [valueAnalysisStateByKey, activeImageId, valueAnalysisLevels, valueAnalysisNotanMode],
  ([$valueAnalysisStateByKey, $activeId, $levels, $notanMode]) => {
    if (!$activeId) return 'idle';
    return $valueAnalysisStateByKey[valueAnalysisKey($activeId, $levels, $notanMode)] ?? 'idle';
  }
);
export const valueAnalysisError = derived(
  [valueAnalysisErrorByKey, activeImageId, valueAnalysisLevels, valueAnalysisNotanMode],
  ([$valueAnalysisErrorByKey, $activeId, $levels, $notanMode]) => {
    if (!$activeId) return null;
    return $valueAnalysisErrorByKey[valueAnalysisKey($activeId, $levels, $notanMode)] ?? null;
  }
);

export function setValueStudyPending(imageId: string) {
  valueStudyStateById.update((state) => ({ ...state, [imageId]: 'pending' }));
  valueStudyErrorById.update((errors) => ({ ...errors, [imageId]: null }));
}

export function setValueStudySuccess(imageId: string, result: ValueStudyResult) {
  valueStudyById.update((cache) => ({ ...cache, [imageId]: result }));
  valueStudyStateById.update((state) => ({ ...state, [imageId]: 'ready' }));
  valueStudyErrorById.update((errors) => ({ ...errors, [imageId]: null }));
}

export function setValueStudyError(imageId: string, message: string) {
  valueStudyStateById.update((state) => ({ ...state, [imageId]: 'error' }));
  valueStudyErrorById.update((errors) => ({ ...errors, [imageId]: message }));
}

export function setValueAnalysisPending(imageId: string, levels: number, notanMode: boolean) {
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
  const cached = get(analysisById)[entry.id] ?? null;
  if (cached) {
    analysisState.set('ready');
    analysisError.set(null);
  } else {
    resetAnalysis();
  }
}

export function clearFile() {
  images.update((list) => {
    list.forEach((entry) => releaseImage(entry));
    return [];
  });
  activeImageId.set(null);
  analysisById.set({});
  valueStudyById.set({});
  valueStudyStateById.set({});
  valueStudyErrorById.set({});
  valueAnalysisByKey.set({});
  valueAnalysisStateByKey.set({});
  valueAnalysisErrorByKey.set({});
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

export type ZoomContent =
  | { kind: 'image'; src: string; alt?: string; width?: number; height?: number }
  | { kind: 'svg'; svg: string; width: number; height: number };

export interface ZoomOverlayState {
  content: ZoomContent;
}

export const zoomOverlay = writable<ZoomOverlayState | null>(null);

export function openZoomOverlay(content: ZoomContent) {
  zoomOverlay.set({ content });
}

export function closeZoomOverlay() {
  zoomOverlay.set(null);
}
