import { loadImageDataset } from '../../compute/image-loader';
import { getFsBridge, type FileSelection } from '../../bridges/fs';
import { getBridgeOverride, isTauriEnv } from '../../bridges/tauri';
import type { AnalysisParams, SelectedImage } from '../../stores/ui';
import type { DevBannerDetails } from './dev-banner-types';

interface FileIngestionDeps {
  updateNativeMode: () => void;
  setDragging: (value: boolean) => void;
  setDraggingWindow: (value: boolean) => void;
  setBannerMessage: (value: string | null) => void;
  setFile: (file: SelectedImage) => void;
  getParamsSnapshot: () => AnalysisParams;
  scheduleAnalysisWith: (file: SelectedImage, params: AnalysisParams) => void;
  setAnalysisError: (message: string) => void;
  cancelPending: () => void;
  recordDevEvent: (update: Partial<DevBannerDetails>, type: 'file') => void;
}

export function createFileIngestionHandlers(deps: FileIngestionDeps) {
  let dropRef: HTMLElement | null = null;
  let loadToken = 0;

  async function chooseFile() {
    try {
      const bridge = await getFsBridge();
      deps.updateNativeMode();
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

  function handleDropzoneKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      void chooseFile();
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    deps.setDragging(true);
  }

  function handleDragLeave(event: DragEvent) {
    if (!dropRef) return;
    if (!event.relatedTarget || !dropRef.contains(event.relatedTarget as Node)) {
      deps.setDragging(false);
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    deps.setDragging(false);
    deps.setDraggingWindow(false);
    deps.updateNativeMode();
    if (isTauriEnv() || getBridgeOverride() === 'tauri') {
      return;
    }
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const fileHandle = files[0];
    if (files.length > 1) {
      deps.setBannerMessage('Multiple files dropped — using the first file; others skipped.');
    }
    const selection: FileSelection = {
      name: fileHandle.name,
      blob: fileHandle,
      size: fileHandle.size,
      path: (fileHandle as unknown as { path?: string }).path ?? fileHandle.name,
      lastModified: fileHandle.lastModified,
      mimeType: fileHandle.type || undefined
    };
    void ingestSelection(selection);
  }

  function setDropTarget(node: HTMLElement | null) {
    dropRef = node;
  }

  function dropTargetAction(node: HTMLElement) {
    setDropTarget(node);
    return {
      destroy() {
        if (dropRef === node) {
          setDropTarget(null);
        }
      }
    };
  }

  async function ingestSelection(fileSelection: FileSelection) {
    loadToken += 1;
    const token = loadToken;
    deps.cancelPending();
    try {
      deps.updateNativeMode();
      let dataset;
      const nativeMode = (isTauriEnv() || getBridgeOverride() === 'tauri') && !!fileSelection.path;
      if (nativeMode) {
        (globalThis as any).__ACTIVE_IMAGE_PATH__ = fileSelection.path;
        dataset = { width: 0, height: 0, pixels: new Uint8Array(0) };
      } else {
        dataset = await loadImageDataset(fileSelection.blob);
      }
      if (token !== loadToken) return;
      const selected: SelectedImage = {
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        name: fileSelection.name || fileSelection.path || 'image',
        path: fileSelection.path,
        size: fileSelection.size,
        dataset
      };
      deps.setBannerMessage(null);
      deps.setFile(selected);
      const snapshot = deps.getParamsSnapshot();
      deps.scheduleAnalysisWith(selected, snapshot);
    } catch (error) {
      console.error('[home] Failed to decode image', error);
      if (token === loadToken) {
        deps.setAnalysisError('Failed to decode the selected image. Please try another file.');
      }
    }
  }

  function createWindowDragHandlers() {
    let dragDepth = 0;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const showOverlay = () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      deps.setDraggingWindow(true);
    };

    const hideOverlay = () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
      hideTimer = setTimeout(() => {
        if (dragDepth <= 0) {
          deps.setDraggingWindow(false);
          deps.setDragging(false);
        }
        hideTimer = null;
      }, 60);
    };

    const onDragEnter = (event: DragEvent) => {
      event.preventDefault();
      dragDepth += 1;
      showOverlay();
    };

    const onDragLeave = (event: DragEvent) => {
      event.preventDefault();
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) hideOverlay();
    };

    const onDrop = (event: DragEvent) => {
      dragDepth = 0;
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      deps.setDraggingWindow(false);
      deps.setDragging(false);
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);

    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }

  return {
    chooseFile,
    handleDropzoneKeydown,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    dropTargetAction,
    createWindowDragHandlers
  };
}
