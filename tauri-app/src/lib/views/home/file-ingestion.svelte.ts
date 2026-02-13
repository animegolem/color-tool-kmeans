import { convertFileSrc } from '@tauri-apps/api/core';
import type { AnalysisParams, ImageEntry, SelectedImage } from '../../stores/ui';
import type { FileSelection } from '../../bridges/fs';
import { getFsBridge } from '../../bridges/fs';
import { isTauriEnv, getBridgeOverride } from '../../bridges/tauri';
import { loadImageDataset } from '../../compute/image-loader';
import { logEvent } from '../../bridges/log';

export interface FileIngestionDeps {
  setFile: (entry: ImageEntry, dataset: { width: number; height: number; pixels: Uint8Array }) => void;
  setAnalysisError: (message: string) => void;
  resetAnalysis: () => void;
  cancelPending: () => void;
  scheduleAnalysisWith: (file: SelectedImage, params: AnalysisParams, status: string) => void;
  recordDevEvent: (update: { fsBridge?: string }, type: 'file') => void;
  setBannerMessage: (msg: string | null) => void;
  getParams: () => AnalysisParams;
  getStatus: () => string;
  clearVideoSelection: () => void;
}

export function createFileIngestion(deps: FileIngestionDeps) {
  let dragging = $state(false);
  let draggingWindow = $state(false);
  let loadToken = 0;
  let dropRef: HTMLElement | null = $state(null);

  function buildPreviewUrl(
    selection: FileSelection,
    nativeMode: boolean
  ): string | null {
    if (nativeMode && selection.path) {
      return convertFileSrc(selection.path);
    }
    if (selection.blob && selection.blob.size > 0) {
      return URL.createObjectURL(selection.blob);
    }
    return null;
  }

  function maxDimensionForQuality(quality: number): number {
    const step = Math.round(quality);
    if (step <= 0) return 1200;
    if (step === 1) return 1600;
    if (step === 2) return 2200;
    if (step === 3) return 2600;
    return 3200;
  }

  async function chooseFile() {
    try {
      const bridge = await getFsBridge();
      const selection = await bridge.openImageFile();
      if (!selection) {
        return;
      }
      deps.recordDevEvent({ fsBridge: bridge.id }, 'file');
      await ingestSelection(selection);
    } catch (error) {
      console.error('[home] Failed to open native dialog', error);
      deps.setBannerMessage(
        'Could not open the native file dialog. Restart the app or verify Tauri is running.'
      );
    }
  }

  async function chooseVideo() {
    try {
      const bridge = await getFsBridge();
      const selection = await bridge.openVideoFile();
      if (!selection) {
        return;
      }
      deps.recordDevEvent({ fsBridge: bridge.id }, 'file');
      void logEvent(`video:file:loaded name=${selection.name}`);
      return selection;
    } catch (error) {
      console.error('[home] Failed to open video dialog', error);
      deps.setBannerMessage(
        'Could not open the video file dialog. Restart the app or verify Tauri is running.'
      );
      return null;
    }
  }

  async function ingestSelection(fileSelection: FileSelection) {
    deps.clearVideoSelection();
    loadToken += 1;
    const token = loadToken;
    deps.cancelPending();
    try {
      let dataset;
      const nativeMode =
        (isTauriEnv() || getBridgeOverride() === 'tauri') && !!fileSelection.path;
      if (nativeMode) {
        (globalThis as any).__ACTIVE_IMAGE_PATH__ = fileSelection.path;
        dataset = { width: 0, height: 0, pixels: new Uint8Array(0) };
      } else {
        dataset = await loadImageDataset(fileSelection.blob);
      }
      if (token !== loadToken) return;
      const previewUrl = buildPreviewUrl(fileSelection, nativeMode);
      const source: ImageEntry['source'] =
        nativeMode && fileSelection.path
          ? { kind: 'path', path: fileSelection.path }
          : { kind: 'blob' };
      const selected: ImageEntry = {
        id:
          globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        name: fileSelection.name || fileSelection.path || 'image',
        path: fileSelection.path,
        size: fileSelection.size,
        source,
        previewUrl
      };
      deps.setBannerMessage(null);
      deps.setFile(selected, dataset);
      const snapshot = deps.getParams();
      deps.scheduleAnalysisWith(
        { ...selected, dataset },
        snapshot,
        deps.getStatus()
      );
    } catch (error) {
      console.error('[home] Failed to decode image', error);
      if (token === loadToken) {
        deps.setAnalysisError(
          'Failed to decode the selected image. Please try another file.'
        );
      }
    }
  }

  function handleDropzoneKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      void chooseFile();
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragging = true;
  }

  function handleDragLeave(event: DragEvent) {
    if (!dropRef) return;
    if (
      !event.relatedTarget ||
      !dropRef.contains(event.relatedTarget as Node)
    ) {
      dragging = false;
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragging = false;
    draggingWindow = false;
    if (isTauriEnv() || getBridgeOverride() === 'tauri') {
      return;
    }
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const fileHandle = files[0];
    if (files.length > 1) {
      deps.setBannerMessage(
        'Multiple files dropped — using the first file; others skipped.'
      );
    }
    const selection: FileSelection = {
      name: fileHandle.name,
      blob: fileHandle,
      size: fileHandle.size,
      path:
        (fileHandle as unknown as { path?: string }).path ?? fileHandle.name,
      lastModified: fileHandle.lastModified,
      mimeType: fileHandle.type || undefined
    };
    void ingestSelection(selection);
  }

  return {
    get dragging() { return dragging; },
    set dragging(v: boolean) { dragging = v; },
    get draggingWindow() { return draggingWindow; },
    set draggingWindow(v: boolean) { draggingWindow = v; },
    get dropRef() { return dropRef; },
    set dropRef(v: HTMLElement | null) { dropRef = v; },
    chooseFile,
    chooseVideo,
    ingestSelection,
    handleDropzoneKeydown,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    buildPreviewUrl,
    maxDimensionForQuality
  };
}
