export function supportsOffscreenCanvas() {
  return typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap === 'function';
}

export async function svgToPngBlob(svgString, width, height, scale = 1) {
  if (!supportsOffscreenCanvas()) {
    throw new Error('OffscreenCanvas is not available in this environment');
  }
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
  const canvas = new OffscreenCanvas(width * scale, height * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  const bitmap = await createImageBitmap(svgBlob);
  ctx.drawImage(bitmap, 0, 0);
  return canvas.convertToBlob({ type: 'image/png' });
}
