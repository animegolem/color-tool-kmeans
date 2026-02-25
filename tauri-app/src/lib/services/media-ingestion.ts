import { convertFileSrc } from '@tauri-apps/api/core';
import type { ImageEntry } from '../stores/ui';
import type { FileSelection } from '../bridges/fs';
import { isVideoFile } from '../bridges/fs';
import { isTauriEnv } from '../bridges/tauri';
import { extractVideoFrame } from '../bridges/video';

export interface IngestResult {
  entry: ImageEntry;
  dataset: { width: number; height: number; pixels: Uint8Array };
}

/**
 * Create an ImageEntry from a FileSelection with correct preview URL.
 * For videos: extracts a 200px thumbnail async and calls updatePreview when ready.
 * For images: builds preview URL immediately (convertFileSrc or blob URL).
 */
export function ingestFileAsEntry(
  sel: FileSelection,
  updatePreview?: (id: string, url: string) => void
): IngestResult {
  const nativeMode = isTauriEnv() && !!sel.path;
  const isVideo = isVideoFile(sel);
  const entryId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

  const previewUrl = isVideo
    ? null
    : nativeMode && sel.path
      ? convertFileSrc(sel.path)
      : sel.blob && sel.blob.size > 0
        ? URL.createObjectURL(sel.blob)
        : null;

  const source: ImageEntry['source'] = nativeMode && sel.path
    ? { kind: 'path', path: sel.path }
    : { kind: 'blob' };

  const entry: ImageEntry = {
    id: entryId,
    name: sel.name || sel.path || 'file',
    path: sel.path,
    ...(isVideo && sel.path ? { videoPath: sel.path } : {}),
    size: sel.size,
    source,
    previewUrl
  };

  const dataset = { width: 0, height: 0, pixels: new Uint8Array(0) };

  // Async video thumbnail extraction (fire-and-forget)
  if (isVideo && sel.path && updatePreview) {
    const videoPath = sel.path;
    const frameId = `thumb-${entryId}`;
    extractVideoFrame({ path: videoPath, frameId, timestamp: 0, maxDimension: 200 })
      .then((res) => updatePreview(entryId, convertFileSrc(res.path)))
      .catch((err) => console.warn('[media-ingestion] Video thumbnail extraction failed', err));
  }

  return { entry, dataset };
}

export function buildPreviewUrl(
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

export function maxDimensionForQuality(quality: number): number {
  const step = Math.round(quality);
  if (step <= 0) return 1200;
  if (step === 1) return 1600;
  if (step === 2) return 2200;
  if (step === 3) return 2600;
  return 3200;
}
