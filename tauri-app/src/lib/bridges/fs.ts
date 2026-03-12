import { get } from 'svelte/store';
import { open, save } from '@tauri-apps/plugin-dialog';
import { isTauriEnv, tauriInvoke } from './tauri';
import { exportDir } from '../stores/ui';

const TAURI_ID = 'tauri' as const;

export interface FileSelection {
  name: string;
  blob: Blob;
  size: number;
  path?: string;
  lastModified?: number;
  mimeType?: string;
}

export interface SaveResult {
  canceled: boolean;
  path?: string;
}

export interface FsBridge {
  readonly id: typeof TAURI_ID;
  openMediaFiles(mode?: 'images' | 'videos' | 'all'): Promise<FileSelection[] | null>;
  saveBlob(blob: Blob, defaultName: string): Promise<SaveResult>;
  saveTextFile(text: string, defaultName: string): Promise<SaveResult>;
}

function extLabel(ext: string): string {
  const map: Record<string, string> = {
    png: 'PNG Image',
    svg: 'SVG Image',
    csv: 'CSV File',
    ase: 'Adobe Swatch',
    json: 'JSON File'
  };
  return map[ext.toLowerCase()] ?? 'File';
}

async function nativeSaveBlob(blob: Blob, defaultName: string): Promise<SaveResult> {
  const dir = get(exportDir);
  const defaultPath = dir ? `${dir}/${defaultName}` : defaultName;
  const ext = defaultName.split('.').pop() ?? '';
  const filePath = await save({
    title: 'Save export',
    defaultPath,
    filters: [{ name: extLabel(ext), extensions: [ext] }]
  });
  if (!filePath) return { canceled: true };
  const buffer = await blob.arrayBuffer();
  const data = Array.from(new Uint8Array(buffer));
  await tauriInvoke('save_file', { req: { path: filePath, data } });
  const savedDir = filePath.replace(/[\\/][^\\/]+$/, '');
  if (savedDir !== get(exportDir)) exportDir.set(savedDir);
  return { canceled: false, path: filePath };
}

export async function saveFromPath(
  sourcePath: string,
  defaultName: string
): Promise<SaveResult> {
  const dir = get(exportDir);
  const defaultPath = dir ? `${dir}/${defaultName}` : defaultName;
  const ext = defaultName.split('.').pop() ?? '';
  const filePath = await save({
    title: 'Save export',
    defaultPath,
    filters: [{ name: extLabel(ext), extensions: [ext] }]
  });
  if (!filePath) return { canceled: true };
  await tauriInvoke('copy_file', { req: { source: sourcePath, dest: filePath } });
  const savedDir = filePath.replace(/[\\/][^\\/]+$/, '');
  if (savedDir !== get(exportDir)) exportDir.set(savedDir);
  return { canceled: false, path: filePath };
}

function buildFilters(mode: 'images' | 'videos' | 'all') {
  const IMG = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tiff'];
  const VID = ['mp4'];
  if (mode === 'images') return [{ name: 'Images', extensions: IMG }];
  if (mode === 'videos') return [{ name: 'Videos', extensions: VID }];
  return [
    { name: 'All Media', extensions: [...IMG, ...VID] },
    { name: 'Images', extensions: IMG },
    { name: 'Videos', extensions: VID }
  ];
}

export function isVideoFile(sel: FileSelection): boolean {
  if (sel.mimeType?.startsWith('video/')) return true;
  return /\.mp4$/i.test(sel.name ?? '');
}

function createTauriFsBridge(): FsBridge | null {
  if (!isTauriEnv()) return null;
  return {
    id: TAURI_ID,
    async openMediaFiles(mode?: 'images' | 'videos' | 'all') {
      const filters = buildFilters(mode ?? 'all');
      const result = await open({ multiple: true, filters });
      if (!result) return null;
      const paths = Array.isArray(result) ? result : [result];
      if (paths.length === 0) return null;
      return paths.map((p) => {
        const name = String(p).split(/[\\/]/).pop() ?? 'file';
        return {
          name,
          path: String(p),
          size: 0,
          blob: new Blob([], { type: inferMimeType(name) }),
          mimeType: inferMimeType(name)
        } satisfies FileSelection;
      });
    },
    async saveBlob(blob, defaultName) {
      return nativeSaveBlob(blob, defaultName);
    },
    async saveTextFile(text, defaultName) {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      return nativeSaveBlob(blob, defaultName);
    }
  } satisfies FsBridge;
}

export function inferMimeType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.bmp')) return 'image/bmp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.tiff') || lower.endsWith('.tif')) return 'image/tiff';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  return 'application/octet-stream';
}

function logSelection(label: string, id: FsBridge['id']) {
  console.info(`[bridges] ${label} bridge selected: ${id}`);
}

export function selectFsBridge(): FsBridge {
  const tauri = createTauriFsBridge();
  if (tauri) {
    logSelection('fs', tauri.id);
    return tauri;
  }
  throw new Error('Tauri environment not detected. Native FS requires Tauri runtime.');
}

let cachedFsBridge: FsBridge | null = null;

export function getFsBridge(): FsBridge {
  if (!cachedFsBridge) {
    cachedFsBridge = selectFsBridge();
  }
  return cachedFsBridge;
}
