import { writable, derived, get } from 'svelte/store';
import type { ImageDataset } from '../compute/image-loader';
import type { PrefsV1 } from './prefs';
import { savePrefs } from './prefs';

export type View = 'home' | 'values' | 'exports' | 'settings';

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
  showHistogram: boolean;
  showPolarChart: boolean;
  showHueLightness: boolean;
}

export const currentView = writable<View>('home');
export const libraryDrawerOpen = writable<boolean>(false);
export const navCollapsed = writable<boolean>(false);

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
  clusters: 25,
  quality: 2,
  ignoreTopN: 0,
  mergeThreshold: 0.04,
  symbolScale: 1,
  showClusterOutline: false,
  showAxisLabels: true,
  polarMode: 'hsv',
  hueLightnessSizeMode: 'chroma',
  histogramSort: 'frequency',
  showHistogram: true,
  showPolarChart: true,
  showHueLightness: true
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
export const valueAnalysisNotanMode = derived(valueAnalysisLevels, ($l) => $l === 2);

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

export const exportScale = writable<number>(2);
export const exportDir = writable<string | null>(null);

export const clusterMax = writable<number>(2000);
export const excludeTopMax = writable<number>(100);
export const showSimplifiedTones = writable<boolean>(true);
export type VideoStripMode = 'filmstrip' | 'barcode';
export const videoStripMode = writable<VideoStripMode>('filmstrip');

export function setView(view: View) {
  currentView.set(view);
  // Persist view, but restore to 'home' if it was 'settings'
  const persistView = view === 'settings' ? 'home' : view;
  void savePrefs({ view: persistView });
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
  valueAnalysisByKey.set({});
  valueAnalysisStateByKey.set({});
  valueAnalysisErrorByKey.set({});
  resetAnalysis();
  setVideoState(null);
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

export interface VideoState {
  path: string;
  name: string;
  duration: number;
  fps: number | null;
  currentTime: number;
  stripPath?: string | null;
  posterPath?: string | null;
}

export const videoState = writable<VideoState | null>(null);

export function setVideoState(state: VideoState | null) {
  videoState.set(state);
}

// --- Preferences hydration & write-back ---

export function hydrateFromPrefs(prefs: PrefsV1) {
  const view = prefs.view === 'settings' ? 'home' : prefs.view;
  currentView.set(view);
  params.set({
    clusters: prefs.analysis.clusters,
    quality: prefs.analysis.quality,
    ignoreTopN: prefs.analysis.ignoreTopN,
    mergeThreshold: prefs.analysis.mergeThreshold,
    symbolScale: prefs.analysis.symbolScale,
    showClusterOutline: prefs.analysis.showClusterOutline,
    showAxisLabels: prefs.analysis.showAxisLabels,
    polarMode: prefs.analysis.polarMode as AnalysisParams['polarMode'],
    hueLightnessSizeMode: prefs.analysis.hueLightnessSizeMode as AnalysisParams['hueLightnessSizeMode'],
    histogramSort: prefs.analysis.histogramSort as AnalysisParams['histogramSort'],
    showHistogram: prefs.display.showHistogram,
    showPolarChart: prefs.display.showPolarChart,
    showHueLightness: prefs.display.showHueLightness
  });
  valueAnalysisLevels.set(prefs.valueAnalysis.levels);
  exportScale.set(prefs.exportScale);
  exportDir.set(prefs.exportDir);
  clusterMax.set(prefs.limits.clusterMax);
  excludeTopMax.set(prefs.limits.excludeTopMax);
  showSimplifiedTones.set(prefs.display.showSimplifiedTones);
  videoStripMode.set(prefs.display.videoStripMode ?? 'filmstrip');
}

// Write-back: debounced subscriptions that persist store changes
let _debounceParams: ReturnType<typeof setTimeout> | null = null;
let _skipParamsFirst = true;
params.subscribe((val) => {
  if (_skipParamsFirst) { _skipParamsFirst = false; return; }
  if (_debounceParams) clearTimeout(_debounceParams);
  _debounceParams = setTimeout(() => void savePrefs({
    analysis: val,
    display: { showHistogram: val.showHistogram, showPolarChart: val.showPolarChart, showHueLightness: val.showHueLightness, showSimplifiedTones: get(showSimplifiedTones), videoStripMode: get(videoStripMode) }
  }), 500);
});

let _debounceVaLevels: ReturnType<typeof setTimeout> | null = null;
let _skipVaLevelsFirst = true;
valueAnalysisLevels.subscribe((val) => {
  if (_skipVaLevelsFirst) { _skipVaLevelsFirst = false; return; }
  if (_debounceVaLevels) clearTimeout(_debounceVaLevels);
  _debounceVaLevels = setTimeout(() => void savePrefs({ valueAnalysis: { levels: val } }), 500);
});

let _debounceExportScale: ReturnType<typeof setTimeout> | null = null;
let _skipExportScaleFirst = true;
exportScale.subscribe((val) => {
  if (_skipExportScaleFirst) { _skipExportScaleFirst = false; return; }
  if (_debounceExportScale) clearTimeout(_debounceExportScale);
  _debounceExportScale = setTimeout(() => void savePrefs({ exportScale: val }), 500);
});

let _skipExportDirFirst = true;
exportDir.subscribe((val) => {
  if (_skipExportDirFirst) { _skipExportDirFirst = false; return; }
  void savePrefs({ exportDir: val });
});

let _debounceClusterMax: ReturnType<typeof setTimeout> | null = null;
let _skipClusterMaxFirst = true;
clusterMax.subscribe((val) => {
  if (_skipClusterMaxFirst) { _skipClusterMaxFirst = false; return; }
  if (_debounceClusterMax) clearTimeout(_debounceClusterMax);
  _debounceClusterMax = setTimeout(() => void savePrefs({ limits: { clusterMax: val, excludeTopMax: get(excludeTopMax) } }), 500);
});

let _debounceExcludeTopMax: ReturnType<typeof setTimeout> | null = null;
let _skipExcludeTopMaxFirst = true;
excludeTopMax.subscribe((val) => {
  if (_skipExcludeTopMaxFirst) { _skipExcludeTopMaxFirst = false; return; }
  if (_debounceExcludeTopMax) clearTimeout(_debounceExcludeTopMax);
  _debounceExcludeTopMax = setTimeout(() => void savePrefs({ limits: { clusterMax: get(clusterMax), excludeTopMax: val } }), 500);
});

let _skipSimplifiedTonesFirst = true;
showSimplifiedTones.subscribe((val) => {
  if (_skipSimplifiedTonesFirst) { _skipSimplifiedTonesFirst = false; return; }
  void savePrefs({ display: { showHistogram: get(params).showHistogram, showPolarChart: get(params).showPolarChart, showHueLightness: get(params).showHueLightness, showSimplifiedTones: val, videoStripMode: get(videoStripMode) } });
});

let _skipVideoStripModeFirst = true;
videoStripMode.subscribe((val) => {
  if (_skipVideoStripModeFirst) { _skipVideoStripModeFirst = false; return; }
  void savePrefs({ display: { showHistogram: get(params).showHistogram, showPolarChart: get(params).showPolarChart, showHueLightness: get(params).showHueLightness, showSimplifiedTones: get(showSimplifiedTones), videoStripMode: val } });
});
