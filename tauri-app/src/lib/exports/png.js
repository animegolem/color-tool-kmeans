function supportsOffscreen() {
    return typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap === 'function';
}
export async function svgToPngBlob(svg, width, height, scale = 1) {
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
    if (supportsOffscreen()) {
        const canvas = new OffscreenCanvas(width * scale, height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx)
            throw new Error('Unable to acquire OffscreenCanvas 2D context');
        ctx.scale(scale, scale);
        const bitmap = await createImageBitmap(svgBlob);
        ctx.drawImage(bitmap, 0, 0);
        return canvas.convertToBlob({ type: 'image/png' });
    }
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width * scale;
            canvas.height = height * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Unable to acquire CanvasRenderingContext2D'));
                URL.revokeObjectURL(url);
                return;
            }
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
                URL.revokeObjectURL(url);
                if (blob) {
                    resolve(blob);
                }
                else {
                    reject(new Error('Failed to convert canvas to PNG blob'));
                }
            }, 'image/png');
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load SVG for PNG conversion'));
        };
        img.src = url;
    });
}
