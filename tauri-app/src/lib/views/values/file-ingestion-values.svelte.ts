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
  beginSelection,
  isCurrentSelection,
} from '../../stores/ui';
import type { SelectionAuthority, VideoState } from '../../stores/ui';

export interface ValuesFileIngestionDeps {
  cancelPending: () => void;
}

export function createValuesFileIngestion(deps: ValuesFileIngestionDeps) {
  let videoRequestGeneration = 0;
  let pendingVideoRequest: {
    path: string;
    generation: number;
    selection: SelectionAuthority;
  } | null = null;
  let disposed = false;

  function ownsRequest(
    generation: number,
    selection: SelectionAuthority
  ): boolean {
    return (
      !disposed &&
      generation === videoRequestGeneration &&
      isCurrentSelection(selection)
    );
  }

  async function probeAndSetVideoState(
    videoPath: string,
    name: string,
    generation: number,
    selection: SelectionAuthority
  ) {
    const cached = getCachedVideoState(videoPath);
    if (cached) {
      if (!ownsRequest(generation, selection)) return;
      const current = get(videoState);
      if (
        !current ||
        current.path !== videoPath ||
        current.selection.epoch !== selection.epoch
      )
        return;
      setVideoState({
        ...current,
        duration: cached.duration,
        fps: cached.fps ?? current.fps,
        stripPath: current.stripPath ?? cached.stripPath ?? null,
        stripId: current.stripId ?? cached.stripId ?? null,
        posterPath: current.posterPath ?? cached.posterPath ?? null,
      });
      return;
    }
    try {
      const probe = await probeVideo(videoPath);
      if (!ownsRequest(generation, selection)) return;
      const current = get(videoState);
      if (
        !current ||
        current.path !== videoPath ||
        current.selection.epoch !== selection.epoch
      )
        return;
      setVideoState({
        ...current,
        duration:
          Number.isFinite(probe.duration) && probe.duration > 0
            ? probe.duration
            : current.duration,
        fps:
          Number.isFinite(probe.fps ?? NaN) && (probe.fps ?? 0) > 0
            ? (probe.fps ?? null)
            : current.fps,
      });
    } catch (err) {
      if (!ownsRequest(generation, selection)) return;
      console.error('[values] Video probe failed', err);
    }
  }

  function handleVideoFile(
    videoPath: string,
    name: string,
    capturedSelection?: SelectionAuthority
  ) {
    if (disposed) return;
    const vs = get(videoState);
    if (capturedSelection && !isCurrentSelection(capturedSelection)) return;
    if (
      !capturedSelection &&
      ((vs?.path === videoPath && isCurrentSelection(vs.selection)) ||
        (pendingVideoRequest?.path === videoPath &&
          isCurrentSelection(pendingVideoRequest.selection)))
    )
      return;
    const selection =
      capturedSelection ??
      beginSelection(
        get(images).find((item) => item.videoPath === videoPath)?.id ?? null
      );
    if (
      pendingVideoRequest?.path === videoPath &&
      pendingVideoRequest.selection.epoch === selection.epoch
    )
      return;
    const generation = ++videoRequestGeneration;
    pendingVideoRequest = { path: videoPath, generation, selection };
    deps.cancelPending();
    const cached = getCachedVideoState(videoPath);
    setVideoState({
      selection,
      path: videoPath,
      name,
      duration: cached?.duration ?? 0,
      fps: cached?.fps ?? null,
      currentTime: cached?.currentTime ?? 0,
      settledFrame: null,
      stripPath: cached?.stripPath ?? null,
      stripId: cached?.stripId ?? null,
      posterPath: cached?.posterPath ?? null,
    });
    void probeAndSetVideoState(videoPath, name, generation, selection).finally(
      () => {
        if (pendingVideoRequest?.generation === generation)
          pendingVideoRequest = null;
      }
    );
  }

  function handleImageFile(sel: FileSelection) {
    if (disposed) return;
    const selection = beginSelection(null);
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

    if (!setFile(entry, dataset, { selection })) return;
    if (nativeMode && sel.path) setActivePath(sel.path);
  }

  async function processBatch(selections: FileSelection[]) {
    if (disposed) return;
    let videoProcessed = false;
    let firstActivated = false;

    for (const sel of selections) {
      if (disposed) return;
      if (isVideoFile(sel)) {
        if (!videoProcessed && sel.path) {
          videoProcessed = true;
          firstActivated = true;
          const existing = get(images).find(
            (item) => item.videoPath === sel.path
          );
          handleVideoFile(
            sel.path,
            sel.name,
            beginSelection(existing?.id ?? null)
          );
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
    if (disposed) return;
    try {
      const bridge = await getFsBridge();
      const selections = await bridge.openMediaFiles('all');
      if (disposed) return;
      if (!selections?.length) return;
      await processBatch(selections);
    } catch (e) {
      if (disposed) return;
      console.error('[values] Upload failed', e);
    }
  }

  function setupDragDrop(): Promise<(() => void) | null> {
    if (disposed) return Promise.resolve(null);
    return setupTauriDragDrop((selections) => {
      if (!disposed) void processBatch(selections);
    });
  }

  function syncFromVideoState(state: VideoState | null) {
    if (
      disposed ||
      !state ||
      state.duration > 0 ||
      !isCurrentSelection(state.selection)
    )
      return;
    if (
      pendingVideoRequest?.path === state.path &&
      pendingVideoRequest.selection.epoch === state.selection.epoch
    )
      return;
    const generation = ++videoRequestGeneration;
    const selection = state.selection;
    const path = state.path;
    pendingVideoRequest = { path, generation, selection };
    void probeVideo(path)
      .then((probe) => {
        if (!ownsRequest(generation, selection)) return;
        const current = get(videoState);
        if (
          !current ||
          current.path !== path ||
          current.selection.epoch !== selection.epoch
        )
          return;
        setVideoState({
          ...current,
          duration:
            Number.isFinite(probe.duration) && probe.duration > 0
              ? probe.duration
              : current.duration,
          fps:
            Number.isFinite(probe.fps ?? NaN) && (probe.fps ?? 0) > 0
              ? (probe.fps ?? null)
              : current.fps,
        });
      })
      .catch((err) => {
        if (!ownsRequest(generation, selection)) return;
        console.error('[values] Video probe failed', err);
      })
      .finally(() => {
        if (!disposed && pendingVideoRequest?.generation === generation)
          pendingVideoRequest = null;
      });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    videoRequestGeneration += 1;
    pendingVideoRequest = null;
  }

  return {
    handleUpload,
    handleVideoFile,
    handleImageFile,
    processBatch,
    setupDragDrop,
    syncFromVideoState,
    dispose,
  };
}
