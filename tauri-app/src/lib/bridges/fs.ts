import { get } from 'svelte/store';
import { isTauriEnv, tauriInvoke, getBridgeOverride } from './tauri';
import { exportDir } from '../stores/ui';

const BROWSER_ID = 'browser' as const;
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
  readonly id: typeof BROWSER_ID | typeof TAURI_ID;
  openImageFile(): Promise<FileSelection | null>;
  openVideoFile(): Promise<FileSelection | null>;
  saveBlob(blob: Blob, defaultName: string): Promise<SaveResult>;
  saveTextFile(text: string, defaultName: string): Promise<SaveResult>;
}

function extLabel(ext: string): string {
  const map: Record<string, string> = {
    png: 'PNG Image',
    svg: 'SVG Image',
    csv: 'CSV File',
    ase: 'Adobe Swatch'
  };
  return map[ext.toLowerCase()] ?? 'File';
}

async function nativeSaveBlob(blob: Blob, defaultName: string): Promise<SaveResult> {
  const { save } = await import('@tauri-apps/plugin-dialog');
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

function createTauriFsBridge(): FsBridge | null {
  if (!isTauriEnv()) return null;
  return {
    id: TAURI_ID,
    async openImageFile() {
      const path = await tauriInvoke('open_image_dialog');
      if (!path) return null;
      const name = String(path).split(/[\\/]/).pop() ?? 'image';
      return {
        name,
        path: String(path),
        size: 0,
        blob: new Blob([], { type: inferMimeType(name) }),
        mimeType: inferMimeType(name)
      } satisfies FileSelection;
    },
    async openVideoFile() {
      try {
        const path = await tauriInvoke('open_video_dialog');
        if (!path) return null;
        const name = String(path).split(/[\\/]/).pop() ?? 'video';
        return {
          name,
          path: String(path),
          size: 0,
          blob: new Blob([], { type: inferMimeType(name) }),
          mimeType: inferMimeType(name)
        } satisfies FileSelection;
      } catch {
        return null;
      }
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

function createBrowserFsBridge(): FsBridge {
  if (typeof document === 'undefined') {
    throw new Error('Browser FS bridge requires document context');
  }

  return {
    id: BROWSER_ID,
    async openImageFile() {
      return new Promise<FileSelection | null>((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg,image/webp';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) {
            resolve(null);
            return;
          }
          resolve({
            name: file.name,
            blob: file,
            size: file.size,
            path: (file as unknown as { path?: string }).path,
            lastModified: file.lastModified,
            mimeType: file.type || inferMimeType(file.name)
          });
        };
        input.click();
      });
    },
    async openVideoFile() {
      return new Promise<FileSelection | null>((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/mp4';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) {
            resolve(null);
            return;
          }
          resolve({
            name: file.name,
            blob: file,
            size: file.size,
            path: (file as unknown as { path?: string }).path,
            lastModified: file.lastModified,
            mimeType: file.type || inferMimeType(file.name)
          });
        };
        input.click();
      });
    },
    // Browser bridge uses anchor.click() download hack — fire-and-forget,
    // cannot detect save failure. Acceptable for dev/preview mode only.
    async saveBlob(blob, defaultName) {
      browserSaveBlob(blob, defaultName);
      return { canceled: false } satisfies SaveResult;
    },
    async saveTextFile(text, defaultName) {
      return browserSaveText(text, defaultName);
    }
  } satisfies FsBridge;
}

function browserSaveBlob(blob: Blob, defaultName: string): SaveResult {
  const url = URL.createObjectURL(blob);
  try {
    triggerDownload(url, defaultName);
    return { canceled: false } satisfies SaveResult;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function browserSaveText(text: string, defaultName: string): SaveResult {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  return browserSaveBlob(blob, defaultName);
}

function triggerDownload(href: string, filename: string) {
  if (typeof document === 'undefined') return;
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

function inferMimeType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.bmp')) return 'image/bmp';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  return 'application/octet-stream';
}

function logSelection(label: string, id: FsBridge['id']) {
  console.info(`[bridges] ${label} bridge selected: ${id}`);
}

export function selectFsBridge(): FsBridge {
  if (typeof window === 'undefined') {
    throw new Error('fsBridge requires a browser environment');
  }
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
let fsBridgeReadyPromise: Promise<void> | null = null;

async function ensureFsBridgeReady(): Promise<void> {
  if (fsBridgeReadyPromise) return fsBridgeReadyPromise;

  fsBridgeReadyPromise = (async () => {
    const forced = getBridgeOverride() === 'tauri';
    if (!forced && !isTauriEnv()) {
      const start = Date.now();
      while (Date.now() - start < 300) {
        if (isTauriEnv()) break;
        await new Promise((r) => setTimeout(r, 20));
      }
    }
    console.info('[bridges] ensureFsBridgeReady complete; proceeding to bridge selection');
  })();

  return fsBridgeReadyPromise;
}

export async function getFsBridge(): Promise<FsBridge> {
  console.info('[bridges] getFsBridge called, awaiting ready...');
  await ensureFsBridgeReady();

  if (!cachedFsBridge) {
    console.info('[bridges] cache miss, selecting fs bridge now');
    cachedFsBridge = selectFsBridge();
  } else {
    console.info('[bridges] cache hit, returning existing fs bridge:', cachedFsBridge.id);
  }
  return cachedFsBridge;
}
