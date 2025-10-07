export interface ImageDataset {
  width: number;
  height: number;
  pixels: Uint8Array;
}

function getCanvas(width: number, height: number): OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D {
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

async function drawToContext(blob: Blob): Promise<{ ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D; width: number; height: number }>
{
  // Prefer ImageBitmap when available, but fall back to HTMLImageElement if it fails
  const forceHtml = typeof localStorage !== 'undefined' && localStorage.getItem('imageLoader.forceHtmlImage') === '1';
  const size = (blob as Blob).size ?? 0;
  const type = (blob as Blob).type ?? 'unknown';
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
    } catch (err) {
      console.warn('[image-loader] createImageBitmap failed; falling back to <img>', err);
    }
  } else {
    if (forceHtml) {
      console.info('[image-loader] forceHtmlImage enabled; skipping ImageBitmap', { type, size });
    }
  }

  const url = URL.createObjectURL(blob);
  try {
    const img = document.createElement('img');
    img.decoding = 'async';
    img.src = url;
    await (img.decode ? img.decode() : new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to decode image'));
    }));
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const ctx = getCanvas(width, height);
    ctx.drawImage(img, 0, 0);
    return { ctx, width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function loadImageDataset(blob: Blob): Promise<ImageDataset> {
  const { ctx, width, height } = await drawToContext(blob);
  if (!width || !height) {
    console.error('[image-loader] decoded zero-sized image', { type: (blob as Blob).type, size: (blob as Blob).size });
    throw new Error('Decoded image is empty');
  }

  const imageData = (ctx as CanvasRenderingContext2D).getImageData(0, 0, width, height) as ImageData;
  const pixels = new Uint8Array(imageData.data.buffer.slice(0));
  return { width, height, pixels };
}

export async function fileToDataset(file: File): Promise<ImageDataset> {
  return loadImageDataset(file);
}

export async function bufferToDataset(buffer: ArrayBuffer, mimeType: string): Promise<ImageDataset> {
  const blob = new Blob([buffer], { type: mimeType });
  return loadImageDataset(blob);
}
