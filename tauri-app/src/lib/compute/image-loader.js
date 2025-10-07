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
    if ('createImageBitmap' in window) {
        const bitmap = await createImageBitmap(blob);
        const ctx = getCanvas(bitmap.width, bitmap.height);
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close?.();
        return { ctx, width: bitmap.width, height: bitmap.height };
    }
    const img = document.createElement('img');
    img.src = URL.createObjectURL(blob);
    await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to decode image'));
    });
    const ctx = getCanvas(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(img.src);
    return { ctx, width: img.naturalWidth, height: img.naturalHeight };
}
export async function loadImageDataset(blob) {
    const { ctx, width, height } = await drawToContext(blob);
    if (!width || !height) {
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
