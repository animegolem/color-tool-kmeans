import { get } from 'svelte/store';
import { open, save } from '@tauri-apps/plugin-dialog';
import { isTauriEnv, tauriInvoke } from './tauri';
import { exportDir } from '../stores/ui';

const TAURI_ID = 'tauri' as const;
const BROWSER_ID = 'browser-file' as const;
const BROWSER_IMAGE_ACCEPT =
  'image/png,image/jpeg,image/webp,image/bmp,image/gif,image/tiff,.png,.jpg,.jpeg,.webp,.bmp,.gif,.tif,.tiff';
const BROWSER_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/bmp',
  'image/gif',
  'image/tiff',
]);

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
  readonly id: typeof TAURI_ID | typeof BROWSER_ID;
  openMediaFiles(
    mode?: 'images' | 'videos' | 'all'
  ): Promise<FileSelection[] | null>;
  saveBlob(blob: Blob, defaultName: string): Promise<SaveResult>;
  saveTextFile(text: string, defaultName: string): Promise<SaveResult>;
}

export class FsBridgeUnavailableError extends Error {
  readonly code = 'FS_OPERATION_UNAVAILABLE';

  constructor(readonly operation: 'open-video' | 'unsupported-file' | 'save') {
    super(
      operation === 'save'
        ? 'Saving files is not available in the browser yet.'
        : operation === 'open-video'
          ? 'Video selection is not available in the browser yet.'
          : 'That file type is not supported for browser images.'
    );
    this.name = 'FsBridgeUnavailableError';
  }
}

export function sourceImageExtension(name: string): string {
  const extension = name
    .match(/\.(jpe?g|png|webp|bmp|gif|tiff?)$/i)?.[1]
    ?.toLowerCase();
  if (!extension) return 'png';
  if (extension === 'tiff') return 'tif';
  return extension === 'jpeg' ? 'jpg' : extension;
}

export function sourceImageExportName(
  sourceName: string,
  baseName: string
): string {
  return `${baseName}-source.${sourceImageExtension(sourceName)}`;
}

function extLabel(ext: string): string {
  const map: Record<string, string> = {
    png: 'PNG Image',
    svg: 'SVG Image',
    csv: 'CSV File',
    ase: 'Adobe Swatch',
    json: 'JSON File',
  };
  return map[ext.toLowerCase()] ?? 'File';
}

async function nativeSaveBlob(
  blob: Blob,
  defaultName: string
): Promise<SaveResult> {
  const dir = get(exportDir);
  const defaultPath = dir ? `${dir}/${defaultName}` : defaultName;
  const ext = defaultName.split('.').pop() ?? '';
  const filePath = await save({
    title: 'Save export',
    defaultPath,
    filters: [{ name: extLabel(ext), extensions: [ext] }],
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
    filters: [{ name: extLabel(ext), extensions: [ext] }],
  });
  if (!filePath) return { canceled: true };
  await tauriInvoke('copy_file', {
    req: { source: sourcePath, dest: filePath },
  });
  const savedDir = filePath.replace(/[\\/][^\\/]+$/, '');
  if (savedDir !== get(exportDir)) exportDir.set(savedDir);
  return { canceled: false, path: filePath };
}

function buildFilters(mode: 'images' | 'videos' | 'all') {
  const IMG = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tiff'];
  const VID = ['mp4', 'mov', 'webm'];
  if (mode === 'images') return [{ name: 'Images', extensions: IMG }];
  if (mode === 'videos') return [{ name: 'Videos', extensions: VID }];
  return [
    { name: 'All Media', extensions: [...IMG, ...VID] },
    { name: 'Images', extensions: IMG },
    { name: 'Videos', extensions: VID },
  ];
}

export function isSupportedBrowserImage(file: Pick<File, 'name' | 'type'>) {
  if (file.type && file.type !== 'application/octet-stream') {
    return BROWSER_IMAGE_MIME_TYPES.has(file.type.toLowerCase());
  }
  return /\.(png|jpe?g|webp|bmp|gif|tiff?)$/i.test(file.name);
}

export function pickBrowserImage(
  documentRef: Document = document,
  windowRef: Window = window
): Promise<File | null> {
  return new Promise((resolve) => {
    const input = documentRef.createElement('input');
    input.type = 'file';
    input.accept = BROWSER_IMAGE_ACCEPT;
    input.multiple = false;
    input.hidden = true;
    let settled = false;

    const finish = (file: File | null) => {
      if (settled) return;
      settled = true;
      windowRef.removeEventListener('focus', handleFocus);
      input.removeEventListener('change', handleChange);
      input.removeEventListener('cancel', handleCancel);
      input.remove();
      resolve(file);
    };
    const handleChange = () => finish(input.files?.[0] ?? null);
    const handleCancel = () => finish(null);
    const handleFocus = () => {
      windowRef.setTimeout(() => {
        if (!input.files?.length) finish(null);
      }, 0);
    };

    input.addEventListener('change', handleChange);
    input.addEventListener('cancel', handleCancel);
    windowRef.addEventListener('focus', handleFocus);
    documentRef.body.append(input);
    input.click();
  });
}

export function isVideoFile(sel: FileSelection): boolean {
  if (sel.mimeType?.startsWith('video/')) return true;
  return /\.(mp4|mov|webm)$/i.test(sel.name ?? '');
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
          mimeType: inferMimeType(name),
        } satisfies FileSelection;
      });
    },
    async saveBlob(blob, defaultName) {
      return nativeSaveBlob(blob, defaultName);
    },
    async saveTextFile(text, defaultName) {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      return nativeSaveBlob(blob, defaultName);
    },
  } satisfies FsBridge;
}

export function createBrowserFsBridge(
  pickImage: () => Promise<File | null> = () => pickBrowserImage()
): FsBridge {
  return {
    id: BROWSER_ID,
    async openMediaFiles(mode = 'all') {
      if (mode === 'videos') throw new FsBridgeUnavailableError('open-video');
      const file = await pickImage();
      if (!file) return null;
      if (!isSupportedBrowserImage(file)) {
        throw new FsBridgeUnavailableError(
          file.type.startsWith('video/') ? 'open-video' : 'unsupported-file'
        );
      }
      return [
        {
          name: file.name,
          blob: file,
          size: file.size,
          lastModified: file.lastModified,
          mimeType: file.type || inferMimeType(file.name),
        },
      ];
    },
    async saveBlob() {
      throw new FsBridgeUnavailableError('save');
    },
    async saveTextFile() {
      throw new FsBridgeUnavailableError('save');
    },
  };
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
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.webm')) return 'video/webm';
  return 'application/octet-stream';
}

function logSelection(label: string, id: FsBridge['id']) {
  console.info(`[bridges] ${label} bridge selected: ${id}`);
}

function selectFsBridge(): FsBridge {
  const tauri = createTauriFsBridge();
  if (tauri) {
    logSelection('fs', tauri.id);
    return tauri;
  }
  const browser = createBrowserFsBridge();
  logSelection('fs', browser.id);
  return browser;
}

let cachedFsBridge: FsBridge | null = null;

export function getFsBridge(): FsBridge {
  if (!cachedFsBridge) {
    cachedFsBridge = selectFsBridge();
  }
  return cachedFsBridge;
}
