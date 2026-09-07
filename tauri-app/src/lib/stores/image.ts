import { writable, derived, get } from 'svelte/store';
import type { ImageDataset } from '../compute/image-loader';
import { devlog, registerResourceCounter } from '../utils/devlog';
import {
  setActivePath,
  clearActivePath,
  getActivePath,
} from '../services/active-image';
import {
  analysisState,
  analysisById,
  analysisError,
  resetAnalysis,
} from './analysis';
import {
  valueAnalysisByKey,
  valueAnalysisStateByKey,
  valueAnalysisErrorByKey,
  valueAnalysisKey,
  valueAnalysisLevels,
  valueAnalysisNotanMode,
  invalidateValueAnalysisForImage,
} from './value-analysis';
import { setVideoState, videoStateCache } from './video';
import {
  cleanupAllMediaArtifacts,
  cleanupMediaArtifacts,
} from '../services/artifact-cleanup';

export type ImageSource = { kind: 'path'; path: string } | { kind: 'blob' };

export interface ImageEntry {
  id: string;
  name: string;
  path?: string;
  videoPath?: string;
  frameTimestamp?: number;
  contentRevision?: number;
  size: number;
  source: ImageSource;
  previewUrl: string | null;
}

export interface SelectedImage extends ImageEntry {
  dataset: ImageDataset;
}

export const images = writable<ImageEntry[]>([]);
export const activeImageId = writable<string | null>(null);

export interface SelectionAuthority {
  readonly epoch: number;
  readonly mediaId: string | null;
}

export interface PendingVideoSwitch {
  id: string;
  cid: string;
  selection: SelectionAuthority;
}

export const pendingVideoSwitch = writable<PendingVideoSwitch | null>(null);

const imageDatasets = new Map<string, ImageDataset>();
const objectUrls = new Map<string, string>();
let nextContentRevision = 0;
let nextSelectionEpoch = 0;
let currentSelection: SelectionAuthority = Object.freeze({
  epoch: 0,
  mediaId: null,
});
let _videoSwitchTimer: ReturnType<typeof setTimeout> | null = null;

function allocateContentRevision(): number {
  if (nextContentRevision >= Number.MAX_SAFE_INTEGER)
    throw new Error('Content revision exhausted');
  return ++nextContentRevision;
}

function captureSelection(
  epoch: number,
  mediaId: string | null
): SelectionAuthority {
  return Object.freeze({ epoch, mediaId });
}

export function cancelPendingVideoSwitch() {
  if (_videoSwitchTimer) {
    clearTimeout(_videoSwitchTimer);
    _videoSwitchTimer = null;
  }
  pendingVideoSwitch.set(null);
}

export function beginSelection(
  mediaId: string | null = null
): SelectionAuthority {
  if (nextSelectionEpoch >= Number.MAX_SAFE_INTEGER)
    throw new Error('Selection epoch exhausted');
  cancelPendingVideoSwitch();
  currentSelection = captureSelection(++nextSelectionEpoch, mediaId);
  return currentSelection;
}

export function isCurrentSelection(selection: SelectionAuthority): boolean {
  return selection.epoch === currentSelection.epoch;
}

export function getCurrentSelection(): SelectionAuthority {
  return currentSelection;
}

function bindCurrentSelectionMedia(
  selection: SelectionAuthority,
  mediaId: string
): SelectionAuthority {
  if (!isCurrentSelection(selection)) return selection;
  currentSelection = captureSelection(selection.epoch, mediaId);
  return currentSelection;
}

export function getResourceCounts() {
  return {
    images: get(images).length,
    datasets: imageDatasets.size,
    objectUrls: objectUrls.size,
  };
}
registerResourceCounter(getResourceCounts);

export const selectedFile = derived(
  [images, activeImageId],
  ([$images, $activeId]) => {
    if (!$activeId) return null;
    const entry = $images.find((item) => item.id === $activeId);
    if (!entry) return null;
    const dataset = imageDatasets.get(entry.id);
    if (!dataset) return null;
    return { ...entry, dataset };
  }
);

export const analysisResult = derived(
  [analysisById, activeImageId],
  ([$analysisById, $activeId]) => {
    if (!$activeId) return null;
    return $analysisById[$activeId] ?? null;
  }
);

export const valueAnalysisResult = derived(
  [
    valueAnalysisByKey,
    activeImageId,
    valueAnalysisLevels,
    valueAnalysisNotanMode,
  ],
  ([$valueAnalysisByKey, $activeId, $levels, $notanMode]) => {
    if (!$activeId) return null;
    return (
      $valueAnalysisByKey[valueAnalysisKey($activeId, $levels, $notanMode)] ??
      null
    );
  }
);
export const valueAnalysisState = derived(
  [
    valueAnalysisStateByKey,
    activeImageId,
    valueAnalysisLevels,
    valueAnalysisNotanMode,
  ],
  ([$valueAnalysisStateByKey, $activeId, $levels, $notanMode]) => {
    if (!$activeId) return 'idle';
    return (
      $valueAnalysisStateByKey[
        valueAnalysisKey($activeId, $levels, $notanMode)
      ] ?? 'idle'
    );
  }
);
export const valueAnalysisError = derived(
  [
    valueAnalysisErrorByKey,
    activeImageId,
    valueAnalysisLevels,
    valueAnalysisNotanMode,
  ],
  ([$valueAnalysisErrorByKey, $activeId, $levels, $notanMode]) => {
    if (!$activeId) return null;
    return (
      $valueAnalysisErrorByKey[
        valueAnalysisKey($activeId, $levels, $notanMode)
      ] ?? null
    );
  }
);

function revokeObjectUrl(url: string) {
  if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url);
  }
}

function trackPreviewUrl(entry: ImageEntry) {
  const nextUrl = entry.source.kind === 'blob' ? entry.previewUrl : null;
  const existing = objectUrls.get(entry.id);
  if (existing && existing !== nextUrl) {
    revokeObjectUrl(existing);
    objectUrls.delete(entry.id);
  }
  if (nextUrl) objectUrls.set(entry.id, nextUrl);
}

function releaseRejectedPreviewUrl(entry: ImageEntry) {
  if (entry.source.kind !== 'blob' || !entry.previewUrl) return;
  const isTracked = [...objectUrls.values()].includes(entry.previewUrl);
  if (!isTracked) revokeObjectUrl(entry.previewUrl);
}

function releaseImage(entry: ImageEntry) {
  imageDatasets.delete(entry.id);
  const url = objectUrls.get(entry.id);
  if (url) {
    revokeObjectUrl(url);
    objectUrls.delete(entry.id);
  }
}

export interface SetFileOptions {
  selection?: SelectionAuthority;
}

export function setFile(
  entry: ImageEntry,
  dataset: ImageDataset,
  options: SetFileOptions = {}
): boolean {
  const current = get(images);
  const existingById = current.find((item) => item.id === entry.id);
  const existingByPath = entry.path
    ? current.find((item) => item.path === entry.path)
    : undefined;
  const existing = existingByPath ?? existingById;
  const normalizedId = existingByPath?.id ?? entry.id;
  let selection = options.selection;
  if (selection) {
    if (!isCurrentSelection(selection)) {
      releaseRejectedPreviewUrl(entry);
      return false;
    }
    if (currentSelection.mediaId === null) {
      selection = bindCurrentSelectionMedia(selection, normalizedId);
    }
  } else {
    selection = beginSelection(normalizedId);
  }

  const contentRevision = allocateContentRevision();
  entry.id = normalizedId;
  entry.contentRevision = contentRevision;

  const matched = existing !== undefined;
  if (matched) {
    invalidateAnalysisForImage(entry.id);
    resetAnalysis();
  }
  imageDatasets.set(entry.id, dataset);
  trackPreviewUrl(entry);
  images.update((list) => {
    const index = list.findIndex((item) => item.id === entry.id);
    if (index !== -1) {
      const next = list.slice();
      next[index] = entry;
      return next;
    }
    return [...list, entry];
  });
  activeImageId.set(entry.id);
  devlog('store:setFile', 'Set file', {
    id: entry.id,
    name: entry.name,
    matched,
    imagesAfter: get(images).length,
  });
  devlog.resources('store:setFile');
  const cached = get(analysisById)[entry.id] ?? null;
  if (cached) {
    analysisState.set('ready');
    analysisError.set(null);
  } else {
    resetAnalysis();
  }
  return true;
}

export function updateEntryPreview(id: string, previewUrl: string) {
  images.update((list) =>
    list.map((item) => (item.id === id ? { ...item, previewUrl } : item))
  );
}

export function appendFile(entry: ImageEntry, dataset: ImageDataset) {
  const current = get(images);
  const existingById = current.find((item) => item.id === entry.id);
  const duplicatePath = entry.path
    ? current.find((item) => item.path === entry.path && item.id !== entry.id)
    : undefined;
  if (duplicatePath) {
    releaseRejectedPreviewUrl(entry);
    devlog('store:appendFile', 'Append file', {
      id: entry.id,
      name: entry.name,
      matched: true,
      imagesAfter: current.length,
    });
    devlog.resources('store:appendFile');
    return;
  }

  if (existingById && currentSelection.mediaId === entry.id) {
    beginSelection(entry.id);
  }
  entry.contentRevision = allocateContentRevision();
  const matched = existingById !== undefined;
  if (matched) {
    invalidateAnalysisForImage(entry.id);
    if (get(activeImageId) === entry.id) resetAnalysis();
  }
  imageDatasets.set(entry.id, dataset);
  trackPreviewUrl(entry);
  images.update((list) => {
    const index = list.findIndex((item) => item.id === entry.id);
    if (index !== -1) {
      const next = list.slice();
      next[index] = entry;
      return next;
    }
    return [...list, entry];
  });
  devlog('store:appendFile', 'Append file', {
    id: entry.id,
    name: entry.name,
    matched,
    imagesAfter: get(images).length,
  });
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
  invalidateValueAnalysisForImage(imageId);
}

export function removeFile(id: string) {
  const list = get(images);
  const entry = list.find((item) => item.id === id);
  const found = !!entry;
  const removingCurrentIntent = currentSelection.mediaId === id;
  const remaining = list.filter((item) => item.id !== id);
  const successor = removingCurrentIntent
    ? remaining.find((item) => !item.videoPath || item.frameTimestamp != null)
    : undefined;
  const successorSelection = removingCurrentIntent
    ? beginSelection(successor?.id ?? null)
    : null;
  if (entry) void cleanupMediaArtifacts(entry);
  if (entry) releaseImage(entry);
  images.set(remaining);
  devlog('store:removeFile', 'Remove file', {
    id,
    found,
    remaining: get(images).length,
  });
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
  if (successorSelection && successor) {
    activateStoredFile(successor.id);
  } else if (successorSelection) {
    applyClearedSelection();
  } else if (get(activeImageId) === id) {
    activeImageId.set(null);
    resetAnalysis();
    try {
      clearActivePath();
    } catch {
      // ignore
    }
  }
}

function activateStoredFile(id: string): boolean {
  const list = get(images);
  const entry = list.find((item) => item.id === id);
  devlog('store:switchToFile', 'Switch to file', { id, found: !!entry });
  if (!entry) return false;

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
  return true;
}

export function switchToFile(id: string): boolean {
  const entry = get(images).find((item) => item.id === id);
  if (!entry) {
    devlog('store:switchToFile', 'Switch to file', { id, found: false });
    return false;
  }
  beginSelection(id);
  return activateStoredFile(id);
}

function applyClearedSelection() {
  const hadActiveId = get(activeImageId) !== null;
  devlog('store:clearActive', 'Clear active selection', {
    hadActiveId,
    imagesCount: get(images).length,
  });
  activeImageId.set(null);
  resetAnalysis();
  setVideoState(null);
  try {
    clearActivePath();
  } catch {
    // ignore
  }
}

export function clearActiveSelection() {
  beginSelection(null);
  applyClearedSelection();
}

export function switchToVideo(id: string): SelectionAuthority {
  const cid = devlog.cid();
  const selection = beginSelection(id);
  devlog('store:switchToVideo', 'Switch to video (debounced)', { id, cid });
  _videoSwitchTimer = setTimeout(() => {
    _videoSwitchTimer = null;
    if (isCurrentSelection(selection)) {
      pendingVideoSwitch.set({ id, cid, selection });
    }
  }, 150);
  return selection;
}

export const mediaLoadRequested = writable<number>(0);

export function requestMediaLoad() {
  mediaLoadRequested.update((n) => n + 1);
}

export function clearFile() {
  beginSelection(null);
  const count = get(images).length;
  void cleanupAllMediaArtifacts(get(images));
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
