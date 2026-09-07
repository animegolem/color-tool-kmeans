import type { ImageEntry, SelectionAuthority } from '../stores/ui';
import {
  beginSelection,
  isCurrentSelection,
  setFile,
  setVideoState,
} from '../stores/ui';
import { tauriInvoke } from '../bridges/tauri';
import { setActivePath } from './active-image';
import { clipboardImageExtensionForMimeType } from './clipboard-image';

export interface ClipboardIngestionDeps {
  beginSelection: (mediaId: string | null) => SelectionAuthority;
  isCurrentSelection: (selection: SelectionAuthority) => boolean;
  appCacheDir: () => Promise<string>;
  convertFileSrc: (path: string) => Promise<string>;
  readBlob: (blob: File | Blob) => Promise<ArrayBuffer>;
  saveFile: (path: string, data: number[]) => Promise<void>;
  setFile: typeof setFile;
  setVideoState: typeof setVideoState;
  setActivePath: typeof setActivePath;
  now: () => number;
  createId: () => string;
}

export type ClipboardIngestionResult =
  | { status: 'accepted'; selection: SelectionAuthority }
  | { status: 'stale'; selection: SelectionAuthority };

const productionDeps: ClipboardIngestionDeps = {
  beginSelection,
  isCurrentSelection,
  appCacheDir: async () => {
    const { appCacheDir } = await import('@tauri-apps/api/path');
    return appCacheDir();
  },
  convertFileSrc: async (path) => {
    const { convertFileSrc } = await import('@tauri-apps/api/core');
    return convertFileSrc(path);
  },
  readBlob: (blob) => blob.arrayBuffer(),
  saveFile: async (path, data) => {
    await tauriInvoke('save_file', { req: { path, data } });
  },
  setFile,
  setVideoState,
  setActivePath,
  now: () => Date.now(),
  createId: () =>
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
};

export async function ingestClipboardImage(
  blob: File | Blob,
  deps: ClipboardIngestionDeps = productionDeps
): Promise<ClipboardIngestionResult> {
  const extension = clipboardImageExtensionForMimeType(blob.type);
  if (!extension) {
    throw new Error(
      `Unsupported clipboard image MIME type: ${blob.type || '(missing)'}`
    );
  }

  const selection = deps.beginSelection(null);
  const stale = (): ClipboardIngestionResult => ({
    status: 'stale',
    selection,
  });

  try {
    const cacheDir = await deps.appCacheDir();
    if (!deps.isCurrentSelection(selection)) return stale();
    const timestamp = deps.now();
    const path = `${cacheDir}/clipboard/paste-${timestamp}.${extension}`;
    const buffer = await deps.readBlob(blob);
    if (!deps.isCurrentSelection(selection)) return stale();
    const data = Array.from(new Uint8Array(buffer));
    await deps.saveFile(path, data);
    if (!deps.isCurrentSelection(selection)) return stale();
    const previewUrl = await deps.convertFileSrc(path);
    if (!deps.isCurrentSelection(selection)) return stale();
    const entryId = deps.createId();

    const entry: ImageEntry = {
      id: entryId,
      name: `paste-${new Date(timestamp).toISOString().slice(11, 19).replace(/:/g, '')}.${extension}`,
      path,
      size: blob.size,
      source: { kind: 'path', path },
      previewUrl,
    };
    const dataset = { width: 0, height: 0, pixels: new Uint8Array(0) };
    if (!deps.setFile(entry, dataset, { selection })) return stale();
    if (!deps.isCurrentSelection(selection)) return stale();
    deps.setVideoState(null);
    deps.setActivePath(path);
    return { status: 'accepted', selection };
  } catch (error) {
    if (!deps.isCurrentSelection(selection)) return stale();
    throw error;
  }
}
