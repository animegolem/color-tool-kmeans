import { listen } from '@tauri-apps/api/event';
import type { AnalysisParams, ImageEntry, SelectedImage } from '../../stores/ui';
import type { FileSelection } from '../../bridges/fs';
import { getFsBridge, isVideoFile, inferMimeType } from '../../bridges/fs';
import { isTauriEnv } from '../../bridges/tauri';
import { loadImageDataset } from '../../compute/image-loader';
import { logEvent } from '../../bridges/log';
import { ingestFileAsEntry, maxDimensionForQuality, buildPreviewUrl } from '../../services/media-ingestion';
import { setActivePath } from '../../services/active-image';

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
      const nativeMode = isTauriEnv() && !!fileSelection.path;
      let dataset;
      if (nativeMode) {
        dataset = { width: 0, height: 0, pixels: new Uint8Array(0) };
      } else {
        dataset = await loadImageDataset(fileSelection.blob);
      }
      if (token !== loadToken) return;

      const { entry } = ingestFileAsEntry(fileSelection, deps.updateEntryPreview);

      if (activate && nativeMode && fileSelection.path) {
        setActivePath(fileSelection.path);
      }
      deps.setBannerMessage(null);
      if (activate) {
        deps.setFile(entry, dataset);
        const snapshot = deps.getParams();
        deps.scheduleAnalysisWith(
          { ...entry, dataset },
          snapshot,
          deps.getStatus()
        );
      } else {
        deps.appendFile(entry, dataset);
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
    maxDimensionForQuality,
    ingestFileAsEntry
  };
}
