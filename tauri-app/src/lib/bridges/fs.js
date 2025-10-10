import { z } from 'zod';
import { isTauriEnv, tauriInvoke, getBridgeOverride } from './tauri';
const BROWSER_ID = 'browser';
const TAURI_ID = 'tauri';
const electronFileSchema = z.object({
    name: z.string().min(1),
    path: z.string().optional(),
    mimeType: z.string().optional(),
    size: z.number().nonnegative().optional(),
    lastModified: z.number().optional(),
    data: z
        .union([
        z.instanceof(Uint8Array),
        z.instanceof(ArrayBuffer),
        z.array(z.number().int().min(0).max(255))
    ])
        .optional()
});
const electronOpenResponseSchema = z.object({
    canceled: z.boolean(),
    file: electronFileSchema.optional()
});
const electronSaveResponseSchema = z.object({
    canceled: z.boolean(),
    filePath: z.string().optional()
});
function normalizeBinary(data) {
    if (data instanceof Uint8Array) {
        return new Uint8Array(data);
    }
    if (data instanceof ArrayBuffer) {
        return new Uint8Array(data.slice(0));
    }
    if (Array.isArray(data)) {
        return Uint8Array.from(data);
    }
    return new Uint8Array();
}
// Electron FS bridge removed: Tauri-only baseline.
function createTauriFsBridge() {
    if (!isTauriEnv())
        return null;
    return {
        id: TAURI_ID,
        async openImageFile() {
            try {
                const path = await tauriInvoke('open_image_dialog');
                if (!path)
                    return null;
                const name = String(path).split(/[\\/]/).pop() ?? 'image';
                return {
                    name,
                    path: String(path),
                    size: 0,
                    blob: new Blob([], { type: inferMimeType(name) }),
                    mimeType: inferMimeType(name)
                };
            }
            catch {
                return null;
            }
        },
        async saveBlob(blob, defaultName) {
            return browserSaveBlob(blob, defaultName);
        },
        async saveTextFile(text, defaultName) {
            return browserSaveText(text, defaultName);
        }
    };
}
function createBrowserFsBridge() {
    if (typeof document === 'undefined') {
        throw new Error('Browser FS bridge requires document context');
    }
    return {
        id: BROWSER_ID,
        async openImageFile() {
            return new Promise((resolve) => {
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
                        path: file.path,
                        lastModified: file.lastModified,
                        mimeType: file.type || inferMimeType(file.name)
                    });
                };
                input.click();
            });
        },
        async saveBlob(blob, defaultName) {
            browserSaveBlob(blob, defaultName);
            return { canceled: false };
        },
        async saveTextFile(text, defaultName) {
            return browserSaveText(text, defaultName);
        }
    };
}
function browserSaveBlob(blob, defaultName) {
    const url = URL.createObjectURL(blob);
    try {
        triggerDownload(url, defaultName);
        return { canceled: false };
    }
    finally {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}
function browserSaveText(text, defaultName) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    return browserSaveBlob(blob, defaultName);
}
function triggerDownload(href, filename) {
    if (typeof document === 'undefined')
        return;
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = filename;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
}
function inferMimeType(name) {
    const lower = name.toLowerCase();
    if (lower.endsWith('.png'))
        return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg'))
        return 'image/jpeg';
    if (lower.endsWith('.webp'))
        return 'image/webp';
    if (lower.endsWith('.bmp'))
        return 'image/bmp';
    return 'application/octet-stream';
}
function logSelection(label, id) {
    console.info(`[bridges] ${label} bridge selected: ${id}`);
}
export function selectFsBridge() {
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
let cachedFsBridge = null;
let fsBridgeReadyPromise = null;
async function ensureFsBridgeReady() {
    if (fsBridgeReadyPromise)
        return fsBridgeReadyPromise;
    fsBridgeReadyPromise = (async () => {
        const forced = getBridgeOverride() === 'tauri';
        if (!forced && !isTauriEnv()) {
            const start = Date.now();
            while (Date.now() - start < 300) {
                if (isTauriEnv())
                    break;
                await new Promise((r) => setTimeout(r, 20));
            }
        }
        console.info('[bridges] ensureFsBridgeReady complete; proceeding to bridge selection');
    })();
    return fsBridgeReadyPromise;
}
export async function getFsBridge() {
    console.info('[bridges] getFsBridge called, awaiting ready...');
    await ensureFsBridgeReady();
    if (!cachedFsBridge) {
        console.info('[bridges] cache miss, selecting fs bridge now');
        cachedFsBridge = selectFsBridge();
    }
    else {
        console.info('[bridges] cache hit, returning existing fs bridge:', cachedFsBridge.id);
    }
    return cachedFsBridge;
}
