export interface GradientPoint {
  x: number;
  y: number;
  radius: number;
  r: number;
  g: number;
  b: number;
}

export interface GradientOptions {
  alphaScale?: number;
  opacity?: number;
}

export function buildGradientLayer(
  width: number,
  height: number,
  points: GradientPoint[],
  options: GradientOptions = {}
): string | null {
  if (typeof document === 'undefined') return null;
  if (points.length === 0) return null;
  if ((globalThis as any).__DEBUG_GRADIENT__) {
    console.info('[gradient] building layer', { width, height, points: points.length });
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const w = canvas.width;
  const h = canvas.height;
  const total = w * h;
  const accR = new Float32Array(total);
  const accG = new Float32Array(total);
  const accB = new Float32Array(total);
  const accA = new Float32Array(total);

  for (const point of points) {
    const rad = Math.max(1, point.radius);
    const radInt = Math.ceil(rad);
    const cx = Math.round(point.x);
    const cy = Math.round(point.y);
    for (let dy = -radInt; dy <= radInt; dy += 1) {
      const py = cy + dy;
      if (py < 0 || py >= h) continue;
      for (let dx = -radInt; dx <= radInt; dx += 1) {
        const px = cx + dx;
        if (px < 0 || px >= w) continue;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > rad) continue;
        const weight = Math.pow(1 - dist / rad, 2);
        const idx = py * w + px;
        accR[idx] += point.r * weight;
        accG[idx] += point.g * weight;
        accB[idx] += point.b * weight;
        accA[idx] += weight;
      }
    }
  }

  const alphaScale = options.alphaScale ?? 0.08;
  const image = ctx.createImageData(w, h);
  for (let i = 0; i < total; i += 1) {
    const a = accA[i];
    if (a <= 0) continue;
    const base = i * 4;
    image.data[base] = Math.min(255, Math.round(accR[i] / a));
    image.data[base + 1] = Math.min(255, Math.round(accG[i] / a));
    image.data[base + 2] = Math.min(255, Math.round(accB[i] / a));
    const alpha = Math.min(1, a * alphaScale);
    image.data[base + 3] = Math.round(alpha * 255);
  }
  ctx.putImageData(image, 0, 0);
  const opacity = options.opacity ?? 0.9;
  const url = canvas.toDataURL('image/png');
  return `<image href="${url}" xlink:href="${url}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" opacity="${opacity}" />`;
}
