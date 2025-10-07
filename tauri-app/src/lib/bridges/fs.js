import { z } from 'zod';
const ELECTRON_ID = 'electron';
const BROWSER_ID = 'browser';
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
function createElectronFsBridge() {
    if (typeof window === 'undefined' || typeof window.electronAPI === 'undefined') {
        return null;
    }
    const api = window.electronAPI;
    const hasOpen = typeof api.openImageFile === 'function';
    const hasSaveBinary = typeof api.saveBinaryFile === 'function';
    const hasSaveText = typeof api.saveTextFile === 'function';
    if (!hasOpen && !hasSaveBinary && !hasSaveText) {
        return null;
    }
    return {
        id: ELECTRON_ID,
        async openImageFile() {
            if (typeof api.openImageFile !== 'function') {
                return null;
            }
            const raw = await api.openImageFile();
            const parsed = electronOpenResponseSchema.parse(raw);
            if (parsed.canceled || !parsed.file) {
                return null;
            }
            const bytes = normalizeBinary(parsed.file.data);
            const mimeType = parsed.file.mimeType ?? inferMimeType(parsed.file.name);
            const copy = bytes.slice();
            const blob = copy.length > 0 ? new Blob([copy.buffer], { type: mimeType }) : new Blob([], { type: mimeType });
            return {
                name: parsed.file.name,
                blob,
                size: parsed.file.size ?? copy.byteLength,
                path: parsed.file.path,
                lastModified: parsed.file.lastModified,
                mimeType
            };
        },
        async saveBlob(blob, defaultName) {
            if (typeof api.saveBinaryFile !== 'function') {
                return browserSaveBlob(blob, defaultName);
            }
            const uint8 = new Uint8Array(await blob.arrayBuffer());
            const response = await api.saveBinaryFile(uint8, { defaultPath: defaultName });
            const parsed = electronSaveResponseSchema.parse(response);
            return { canceled: parsed.canceled, path: parsed.filePath };
        },
        async saveTextFile(text, defaultName) {
            if (typeof api.saveTextFile !== 'function') {
                return browserSaveText(text, defaultName);
            }
            const response = await api.saveTextFile(text, { defaultPath: defaultName });
            const parsed = electronSaveResponseSchema.parse(response);
            return { canceled: parsed.canceled, path: parsed.filePath };
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
    const electron = createElectronFsBridge();
    if (electron) {
        logSelection('fs', electron.id);
        return electron;
    }
    const browser = createBrowserFsBridge();
    logSelection('fs', browser.id);
    return browser;
}
let cachedFsBridge = null;
export function getFsBridge() {
    if (!cachedFsBridge) {
        cachedFsBridge = selectFsBridge();
    }
    return cachedFsBridge;
}
export const fsBridge = typeof window === 'undefined'
    ? {
        id: BROWSER_ID,
        async openImageFile() {
            throw new Error('fsBridge unavailable in non-browser context');
        },
        async saveBlob() {
            throw new Error('fsBridge unavailable in non-browser context');
        },
        async saveTextFile() {
            throw new Error('fsBridge unavailable in non-browser context');
        }
    }
    : getFsBridge();
