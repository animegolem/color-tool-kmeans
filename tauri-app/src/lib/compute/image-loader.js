function getCanvas(width, height) {
    if (typeof OffscreenCanvas !== 'undefined') {
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Unable to acquire OffscreenCanvas context');
        }
        return ctx;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Unable to acquire canvas context');
    }
    return ctx;
}
async function drawToContext(blob) {
    // Prefer ImageBitmap when available, but fall back to HTMLImageElement if it fails
    const forceHtml = typeof localStorage !== 'undefined' && localStorage.getItem('imageLoader.forceHtmlImage') === '1';
    const size = blob.size ?? 0;
    const type = blob.type ?? 'unknown';
    if (!forceHtml && 'createImageBitmap' in window) {
        try {
            console.info('[image-loader] trying createImageBitmap', { type, size });
            const bitmap = await createImageBitmap(blob);
            const width = bitmap.width;
            const height = bitmap.height;
            if (width && height) {
                const ctx = getCanvas(width, height);
                ctx.drawImage(bitmap, 0, 0);
                bitmap.close?.();
                return { ctx, width, height };
            }
            bitmap.close?.();
            console.warn('[image-loader] ImageBitmap has zero dimensions; falling back to <img>', { type, size });
        }
        catch (err) {
            console.warn('[image-loader] createImageBitmap failed; falling back to <img>', err);
        }
    }
    else {
        if (forceHtml) {
            console.info('[image-loader] forceHtmlImage enabled; skipping ImageBitmap', { type, size });
        }
    }
    const url = URL.createObjectURL(blob);
    try {
        const img = document.createElement('img');
        img.decoding = 'async';
        img.src = url;
        await (img.decode ? img.decode() : new Promise((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to decode image'));
        }));
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const ctx = getCanvas(width, height);
        ctx.drawImage(img, 0, 0);
        return { ctx, width, height };
    }
    finally {
        URL.revokeObjectURL(url);
    }
}
export async function loadImageDataset(blob) {
    const { ctx, width, height } = await drawToContext(blob);
    if (!width || !height) {
        console.error('[image-loader] decoded zero-sized image', { type: blob.type, size: blob.size });
        throw new Error('Decoded image is empty');
    }
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = new Uint8Array(imageData.data.buffer.slice(0));
    return { width, height, pixels };
}
export async function fileToDataset(file) {
    return loadImageDataset(file);
}
export async function bufferToDataset(buffer, mimeType) {
    const blob = new Blob([buffer], { type: mimeType });
    return loadImageDataset(blob);
}
