import { writable, derived, get } from 'svelte/store';
import type { ImageDataset } from '../compute/image-loader';
import type { PrefsV1 } from './prefs';
import { DEFAULTS, savePrefs } from './prefs';
import { devlog, registerResourceCounter } from '../utils/devlog';

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
  snapToReal: boolean;
  showHistogram: boolean;
  showPolarChart: boolean;
  showHueLightness: boolean;
}

export const currentView = writable<View>('home');
export const libraryDrawerOpen = writable<boolean>(false);
export const navCollapsed = writable<boolean>(false);
export const narrowMode = writable<boolean>(false);

export type ImageSource = { kind: 'path'; path: string } | { kind: 'blob' };

export interface ImageEntry {
  id: string;
  name: string;
  path?: string;
  videoPath?: string;
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

export function getResourceCounts() {
  return {
    images: get(images).length,
    datasets: imageDatasets.size,
    objectUrls: objectUrls.size
  };
}
registerResourceCounter(getResourceCounts);

export const selectedFile = derived([images, activeImageId], ([$images, $activeId]) => {
  if (!$activeId) return null;
  const entry = $images.find((item) => item.id === $activeId);
  if (!entry) return null;
  const dataset = imageDatasets.get(entry.id);
  if (!dataset) return null;
  return { ...entry, dataset };
});

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

export function invalidateAnalysisForImage(imageId: string) {
  analysisById.update((cache) => {
    const next = { ...cache };
    delete next[imageId];
    return next;
  });
  const removeKeysForImage = (cache: Record<string, any>) => {
    const next: typeof cache = {};
    for (const [key, val] of Object.entries(cache)) {
      if (!key.startsWith(imageId + ':')) next[key] = val;
    }
    return next;
  };
  valueAnalysisByKey.update(removeKeysForImage);
  valueAnalysisStateByKey.update(removeKeysForImage);
  valueAnalysisErrorByKey.update(removeKeysForImage);
}

export const exportScale = writable<number>(2);
export const exportDir = writable<string | null>(null);

export type GraphExportFormat = 'png' | 'svg';
export const graphExportFormat = writable<GraphExportFormat>('svg');

export interface ExportChecks {
  colorsSourceImage: boolean;
  colorsPolarChart: boolean;
  colorsHistogram: boolean;
  colorsHueLightness: boolean;
  colorsPaletteStrip: boolean;
  colorsHistogramAll: boolean;
  colorsVideoBarcode: boolean;
  valuesNeutral: boolean;
  valuesIncludeOriginal: boolean;
  valuesRangeFinder: boolean;
  valuesHistogram: boolean;
  valuesSimplified: boolean;
  valuesAllStudies: boolean;
}
export const exportChecks = writable<ExportChecks>({ ...DEFAULTS.exports });

export const clusterMax = writable<number>(200);
export const excludeTopMax = writable<number>(10);
export const showSimplifiedTones = writable<boolean>(true);
export type VideoStripMode = 'filmstrip' | 'barcode';
export const videoStripMode = writable<VideoStripMode>('barcode');

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
  let matched = false;
  images.update((list) => {
    const index = list.findIndex((item) => item.id === entry.id);
    if (index !== -1) {
      matched = true;
      const next = list.slice();
      next[index] = entry;
      return next;
    }
    // Path-based dedup: reuse existing entry if same path
    if (entry.path) {
      const pathIndex = list.findIndex((item) => item.path === entry.path);
      if (pathIndex !== -1) {
        matched = true;
        entry.id = list[pathIndex].id;
        const next = list.slice();
        next[pathIndex] = entry;
        return next;
      }
    }
    return [...list, entry];
  });
  activeImageId.set(entry.id);
  devlog('store:setFile', 'Set file', { id: entry.id, name: entry.name, matched, imagesAfter: get(images).length });
  devlog.resources('store:setFile');
  const cached = get(analysisById)[entry.id] ?? null;
  if (cached) {
    analysisState.set('ready');
    analysisError.set(null);
  } else {
    resetAnalysis();
  }
}

export function updateEntryPreview(id: string, previewUrl: string) {
  images.update((list) =>
    list.map((item) => item.id === id ? { ...item, previewUrl } : item)
  );
}

export function appendFile(entry: ImageEntry, dataset: ImageDataset) {
  imageDatasets.set(entry.id, dataset);
  trackPreviewUrl(entry);
  let matched = false;
  images.update((list) => {
    const index = list.findIndex((item) => item.id === entry.id);
    if (index !== -1) {
      matched = true;
      const next = list.slice();
      next[index] = entry;
      return next;
    }
    // Path-based dedup: skip if an entry with the same path already exists
    if (entry.path && list.some((item) => item.path === entry.path)) {
      matched = true;
      return list;
    }
    return [...list, entry];
  });
  devlog('store:appendFile', 'Append file', { id: entry.id, name: entry.name, matched, imagesAfter: get(images).length });
  devlog.resources('store:appendFile');
}

export function removeFile(id: string) {
  const list = get(images);
  const entry = list.find((item) => item.id === id);
  const found = !!entry;
  if (entry) releaseImage(entry);
  images.update((items) => items.filter((item) => item.id !== id));
  devlog('store:removeFile', 'Remove file', { id, found, remaining: get(images).length });
  devlog.resources('store:removeFile');
  analysisById.update((cache) => {
    const next = { ...cache };
    delete next[id];
    return next;
  });
  valueAnalysisByKey.update((cache) => {
    const next: typeof cache = {};
    for (const [key, val] of Object.entries(cache)) {
      if (!key.startsWith(id + ':')) next[key] = val;
    }
    return next;
  });
  valueAnalysisStateByKey.update((cache) => {
    const next: typeof cache = {};
    for (const [key, val] of Object.entries(cache)) {
      if (!key.startsWith(id + ':')) next[key] = val;
    }
    return next;
  });
  valueAnalysisErrorByKey.update((cache) => {
    const next: typeof cache = {};
    for (const [key, val] of Object.entries(cache)) {
      if (!key.startsWith(id + ':')) next[key] = val;
    }
    return next;
  });
  if (get(activeImageId) === id) {
    const remaining = get(images);
    if (remaining.length > 0) {
      switchToFile(remaining[0].id);
    } else {
      clearActiveSelection();
    }
  }
}

export function switchToFile(id: string) {
  const list = get(images);
  const entry = list.find((item) => item.id === id);
  devlog('store:switchToFile', 'Switch to file', { id, found: !!entry });
  if (!entry) return;

  if (entry.path) {
    (globalThis as any).__ACTIVE_IMAGE_PATH__ = entry.path;
  }
  setVideoState(null);

  activeImageId.set(id);
  const cached = get(analysisById)[id] ?? null;
  if (cached) {
    analysisState.set('ready');
    analysisError.set(null);
  } else {
    resetAnalysis();
  }
}

export function clearActiveSelection() {
  const hadActiveId = get(activeImageId) !== null;
  devlog('store:clearActive', 'Clear active selection', { hadActiveId, imagesCount: get(images).length });
  activeImageId.set(null);
  resetAnalysis();
  setVideoState(null);
  try {
    delete (globalThis as any).__ACTIVE_IMAGE_PATH__;
  } catch {
    // ignore
  }
}

export interface PendingVideoSwitch {
  id: string;
  cid: string;
}

export const pendingVideoSwitch = writable<PendingVideoSwitch | null>(null);

let _videoSwitchTimer: ReturnType<typeof setTimeout> | null = null;

export function switchToVideo(id: string) {
  const cid = devlog.cid();
  devlog('store:switchToVideo', 'Switch to video (debounced)', { id, cid });
  if (_videoSwitchTimer) clearTimeout(_videoSwitchTimer);
  _videoSwitchTimer = setTimeout(() => {
    _videoSwitchTimer = null;
    pendingVideoSwitch.set({ id, cid });
  }, 150);
}

export const mediaLoadRequested = writable<number>(0);

export function requestMediaLoad() {
  mediaLoadRequested.update((n) => n + 1);
}

export function clearFile() {
  const count = get(images).length;
  devlog('store:clearFile', 'Clear all files', { count });
  images.update((list) => {
    list.forEach((entry) => releaseImage(entry));
    return [];
  });
  devlog.resources('store:clearFile');
  activeImageId.set(null);
  analysisById.set({});
  valueAnalysisByKey.set({});
  valueAnalysisStateByKey.set({});
  valueAnalysisErrorByKey.set({});
  videoStateCache.set({});
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

// --- Video state cache (session-scoped) ---

export interface VideoCacheEntry {
  duration: number;
  fps: number | null;
  currentTime: number;
  stripPath: string | null;
  stripId: string | null;
  posterPath: string | null;
  frameId: string;
}

export const videoStateCache = writable<Record<string, VideoCacheEntry>>({});

export function cacheVideoState(videoPath: string, entry: VideoCacheEntry) {
  videoStateCache.update((cache) => ({ ...cache, [videoPath]: entry }));
}

export function getCachedVideoState(videoPath: string): VideoCacheEntry | null {
  return get(videoStateCache)[videoPath] ?? null;
}

// --- Preferences hydration & write-back ---

export function hydrateFromPrefs(prefs: PrefsV1) {
  params.set({
    clusters: prefs.analysis.clusters,
    quality: prefs.analysis.quality,
    ignoreTopN: prefs.analysis.ignoreTopN,
    mergeThreshold: prefs.analysis.mergeThreshold,
    symbolScale: prefs.analysis.symbolScale,
    showClusterOutline: prefs.analysis.showClusterOutline,
    showAxisLabels: prefs.analysis.showAxisLabels,
    snapToReal: prefs.analysis.snapToReal,
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
  exportChecks.set({ ...prefs.exports });
  clusterMax.set(prefs.limits.clusterMax);
  excludeTopMax.set(prefs.limits.excludeTopMax);
  showSimplifiedTones.set(prefs.display.showSimplifiedTones);
  videoStripMode.set(prefs.display.videoStripMode ?? 'barcode');
  graphExportFormat.set(prefs.graphExportFormat ?? 'svg');
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

let _debounceExportChecks: ReturnType<typeof setTimeout> | null = null;
let _skipExportChecksFirst = true;
exportChecks.subscribe((val) => {
  if (_skipExportChecksFirst) { _skipExportChecksFirst = false; return; }
  if (_debounceExportChecks) clearTimeout(_debounceExportChecks);
  _debounceExportChecks = setTimeout(() => void savePrefs({ exports: val }), 500);
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

let _debounceGraphExportFormat: ReturnType<typeof setTimeout> | null = null;
let _skipGraphExportFormatFirst = true;
graphExportFormat.subscribe((val) => {
  if (_skipGraphExportFormatFirst) { _skipGraphExportFormatFirst = false; return; }
  if (_debounceGraphExportFormat) clearTimeout(_debounceGraphExportFormat);
  _debounceGraphExportFormat = setTimeout(() => void savePrefs({ graphExportFormat: val }), 500);
});
