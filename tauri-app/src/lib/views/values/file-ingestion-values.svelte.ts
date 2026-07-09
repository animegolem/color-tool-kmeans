import { get } from 'svelte/store';
import type { FileSelection } from '../../bridges/fs';
import { getFsBridge, isVideoFile } from '../../bridges/fs';
import { isTauriEnv } from '../../bridges/tauri';
import { probeVideo } from '../../bridges/video';
import { ingestFileAsEntry } from '../../services/media-ingestion';
import { setActivePath } from '../../services/active-image';
import { setupTauriDragDrop } from '../../services/drag-drop';
import {
  videoState,
  setVideoState,
  images,
  setFile,
  appendFile,
  libraryDrawerOpen,
  getCachedVideoState,
  updateEntryPreview,
} from '../../stores/ui';

export interface ValuesFileIngestionDeps {
  cancelPending: () => void;
}

export function createValuesFileIngestion(deps: ValuesFileIngestionDeps) {
  let videoRequestGeneration = 0;
  let pendingVideoRequest: { path: string; generation: number } | null = null;

  async function probeAndSetVideoState(
    videoPath: string,
    name: string,
    generation: number
  ) {
    const cached = getCachedVideoState(videoPath);
    if (cached) {
      if (generation !== videoRequestGeneration) return;
      const restoredState = {
        path: videoPath,
        name,
        duration: cached.duration,
        fps: cached.fps ?? null,
        currentTime: cached.currentTime ?? 0,
        stripPath: cached.stripPath ?? null,
        stripId: cached.stripId ?? null,
        posterPath: cached.posterPath ?? null,
      };
      setVideoState(restoredState);
      return;
    }
    try {
      const probe = await probeVideo(videoPath);
      if (generation !== videoRequestGeneration) return;
      setVideoState({
        path: videoPath,
        name,
        duration: probe.duration,
        fps: probe.fps ?? null,
        currentTime: 0,
        posterPath: null,
      });
    } catch (err) {
      console.error('[values] Video probe failed', err);
    }
  }

  function handleVideoFile(videoPath: string, name: string) {
    const vs = get(videoState);
    if (vs?.path === videoPath) return;
    if (pendingVideoRequest?.path === videoPath) return;
    const generation = ++videoRequestGeneration;
    pendingVideoRequest = { path: videoPath, generation };
    deps.cancelPending();
    void probeAndSetVideoState(videoPath, name, generation).finally(() => {
      if (pendingVideoRequest?.generation === generation)
        pendingVideoRequest = null;
    });
  }

  function handleImageFile(sel: FileSelection) {
    videoRequestGeneration += 1;
    pendingVideoRequest = null;
    setVideoState(null);
    const nativeMode = isTauriEnv() && !!sel.path;

    const existing =
      nativeMode && sel.path
        ? get(images).find((item) => item.path === sel.path && !item.videoPath)
        : null;

    const { entry, dataset } = ingestFileAsEntry(sel);

    if (existing) {
      entry.id = existing.id;
    }

    if (nativeMode && sel.path) {
      setActivePath(sel.path);
    }

    setFile(entry, dataset);
  }

  async function processBatch(selections: FileSelection[]) {
    let videoProcessed = false;
    let firstActivated = false;

    for (const sel of selections) {
      if (isVideoFile(sel)) {
        if (!videoProcessed && sel.path) {
          videoProcessed = true;
          firstActivated = true;
          handleVideoFile(sel.path, sel.name);
        } else {
          const { entry, dataset } = ingestFileAsEntry(sel, updateEntryPreview);
          appendFile(entry, dataset);
        }
      } else {
        if (!firstActivated) {
          firstActivated = true;
          handleImageFile(sel);
        } else {
          const { entry, dataset } = ingestFileAsEntry(sel, updateEntryPreview);
          appendFile(entry, dataset);
        }
      }
    }
    if (selections.length > 1) {
      libraryDrawerOpen.set(true);
    }
  }

  async function handleUpload() {
    try {
      const bridge = await getFsBridge();
      const selections = await bridge.openMediaFiles('all');
      if (!selections?.length) return;
      await processBatch(selections);
    } catch (e) {
      console.error('[values] Upload failed', e);
    }
  }

  function setupDragDrop(): Promise<(() => void) | null> {
    return setupTauriDragDrop((selections) => void processBatch(selections));
  }

  return {
    handleUpload,
    handleVideoFile,
    handleImageFile,
    processBatch,
    setupDragDrop,
  };
}
