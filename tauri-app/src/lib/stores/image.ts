import { writable, derived, get } from 'svelte/store';
import type { ImageDataset } from '../compute/image-loader';
import { devlog, registerResourceCounter } from '../utils/devlog';
import { setActivePath, clearActivePath, getActivePath } from '../services/active-image';
import { analysisState, analysisById, analysisError, resetAnalysis } from './analysis';
import {
  valueAnalysisByKey, valueAnalysisStateByKey, valueAnalysisErrorByKey,
  valueAnalysisKey, valueAnalysisLevels, valueAnalysisNotanMode
} from './value-analysis';
import { setVideoState, videoStateCache } from './video';

export type ImageSource = { kind: 'path'; path: string } | { kind: 'blob' };

export interface ImageEntry {
  id: string;
  name: string;
  path?: string;
  videoPath?: string;
  frameTimestamp?: number;
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

export const analysisResult = derived([analysisById, activeImageId], ([$analysisById, $activeId]) => {
  if (!$activeId) return null;
  return $analysisById[$activeId] ?? null;
});

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
    if (entry.path && list.some((item) => item.path === entry.path)) {
      matched = true;
      return list;
    }
    return [...list, entry];
  });
  devlog('store:appendFile', 'Append file', { id: entry.id, name: entry.name, matched, imagesAfter: get(images).length });
  devlog.resources('store:appendFile');
}

function removeKeysForImage(imageId: string) {
  return (cache: Record<string, any>) => {
    const next: typeof cache = {};
    for (const [key, val] of Object.entries(cache)) {
      if (!key.startsWith(imageId + ':')) next[key] = val;
    }
    return next;
  };
}

export function invalidateAnalysisForImage(imageId: string) {
  analysisById.update((cache) => {
    const next = { ...cache };
    delete next[imageId];
    return next;
  });
  const remover = removeKeysForImage(imageId);
  valueAnalysisByKey.update(remover);
  valueAnalysisStateByKey.update(remover);
  valueAnalysisErrorByKey.update(remover);
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
  const remover = removeKeysForImage(id);
  valueAnalysisByKey.update(remover);
  valueAnalysisStateByKey.update(remover);
  valueAnalysisErrorByKey.update(remover);
  if (get(activeImageId) === id) {
    const remaining = get(images);
    const successor = remaining.find(
      (item) => !item.videoPath || item.frameTimestamp != null
    );
    if (successor) {
      switchToFile(successor.id);
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
    setActivePath(entry.path);
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
    clearActivePath();
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
  if (getActivePath()) {
    clearActivePath();
  }
}
