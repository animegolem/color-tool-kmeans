import { convertFileSrc } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { AnalysisParams, ImageEntry, SelectedImage } from '../../stores/ui';
import type { FileSelection } from '../../bridges/fs';
import { getFsBridge, isVideoFile, inferMimeType } from '../../bridges/fs';
import { isTauriEnv } from '../../bridges/tauri';
import { loadImageDataset } from '../../compute/image-loader';
import { extractVideoFrame } from '../../bridges/video';
import { logEvent } from '../../bridges/log';

export interface FileIngestionDeps {
  setFile: (entry: ImageEntry, dataset: { width: number; height: number; pixels: Uint8Array }) => void;
  appendFile: (entry: ImageEntry, dataset: { width: number; height: number; pixels: Uint8Array }) => void;
  setAnalysisError: (message: string) => void;
  cancelPending: () => void;
  scheduleAnalysisWith: (file: SelectedImage, params: AnalysisParams, status: string) => void;
  recordDevEvent: (update: { fsBridge?: string }, type: 'file') => void;
  setBannerMessage: (msg: string | null) => void;
  getParams: () => AnalysisParams;
  getStatus: () => string;
  clearVideoSelection: () => void;
  loadVideoSelection: (sel: FileSelection) => void;
  openLibraryDrawer: () => void;
  updateEntryPreview: (id: string, previewUrl: string) => void;
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

  async function chooseMedia() {
    try {
      const bridge = await getFsBridge();
      const selections = await bridge.openMediaFiles('all');
      if (!selections?.length) return;
      deps.recordDevEvent({ fsBridge: bridge.id }, 'file');
      await processBatch(selections);
    } catch (error) {
      console.error('[home] Failed to open native dialog', error);
      deps.setBannerMessage(
        'Could not open the native file dialog. Restart the app or verify Tauri is running.'
      );
    }
  }

  async function processBatch(selections: FileSelection[]) {
    deps.clearVideoSelection();
    let videoProcessed = false;
    let firstActivated = false;

    for (const sel of selections) {
      if (isVideoFile(sel)) {
        if (!videoProcessed) {
          videoProcessed = true;
          firstActivated = true;
          void logEvent(`video:file:loaded name=${sel.name}`);
          deps.loadVideoSelection(sel);
        } else {
          await ingestSelection(sel, false);
        }
      } else {
        const activate = !firstActivated;
        await ingestSelection(sel, activate);
        firstActivated = true;
      }
    }
    if (selections.length > 1) {
      deps.openLibraryDrawer();
    }
  }

  async function ingestSelection(fileSelection: FileSelection, activate = true) {
    loadToken += 1;
    const token = loadToken;
    deps.cancelPending();
    try {
      let dataset;
      const nativeMode = isTauriEnv() && !!fileSelection.path;
      if (nativeMode) {
        if (activate) {
          (globalThis as any).__ACTIVE_IMAGE_PATH__ = fileSelection.path;
        }
        dataset = { width: 0, height: 0, pixels: new Uint8Array(0) };
      } else {
        dataset = await loadImageDataset(fileSelection.blob);
      }
      if (token !== loadToken) return;
      const isVideo = isVideoFile(fileSelection);
      const previewUrl = isVideo ? null : buildPreviewUrl(fileSelection, nativeMode);
      const source: ImageEntry['source'] =
        nativeMode && fileSelection.path
          ? { kind: 'path', path: fileSelection.path }
          : { kind: 'blob' };
      const entryId =
        globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
      const selected: ImageEntry = {
        id: entryId,
        name: fileSelection.name || fileSelection.path || 'image',
        path: fileSelection.path,
        ...(isVideo && fileSelection.path ? { videoPath: fileSelection.path } : {}),
        size: fileSelection.size,
        source,
        previewUrl
      };
      // For video files, extract a static thumbnail asynchronously to avoid
      // WebKit auto-playing MP4 content inside <img> tags (causes renderer crash)
      if (isVideo && fileSelection.path) {
        const videoPath = fileSelection.path;
        const frameId = `thumb-${entryId}`;
        extractVideoFrame({ path: videoPath, frameId, timestamp: 0, maxDimension: 200 })
          .then((res) => {
            const thumbUrl = convertFileSrc(res.path);
            deps.updateEntryPreview(entryId, thumbUrl);
          })
          .catch((err) => {
            console.warn('[file-ingestion] Video thumbnail extraction failed', err);
          });
      }
      deps.setBannerMessage(null);
      if (activate) {
        deps.setFile(selected, dataset);
        const snapshot = deps.getParams();
        deps.scheduleAnalysisWith(
          { ...selected, dataset },
          snapshot,
          deps.getStatus()
        );
      } else {
        deps.appendFile(selected, dataset);
      }
    } catch (error) {
      console.error('[home] Failed to decode image', error);
      if (token === loadToken) {
        deps.setAnalysisError(
          'Failed to decode the selected image. Please try another file.'
        );
      }
    }
  }

  async function setupTauriDragDrop(): Promise<(() => void) | null> {
    if (!isTauriEnv()) return null;
    const unlisten = await listen<{ paths?: string[] }>('tauri://drag-drop', (event) => {
      const paths = event.payload?.paths;
      if (!paths?.length) return;
      const selections = paths.map((p) => ({
        name: p.split(/[\\/]/).pop() ?? 'file',
        path: p,
        size: 0,
        blob: new Blob([], { type: inferMimeType(p.split(/[\\/]/).pop() ?? '') }),
        mimeType: inferMimeType(p.split(/[\\/]/).pop() ?? '')
      } satisfies FileSelection));
      void processBatch(selections);
    });
    return unlisten;
  }

  function handleDropzoneKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      void chooseMedia();
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
    if (isTauriEnv()) {
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
    chooseMedia,
    ingestSelection,
    setupTauriDragDrop,
    handleDropzoneKeydown,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    buildPreviewUrl,
    maxDimensionForQuality
  };
}
