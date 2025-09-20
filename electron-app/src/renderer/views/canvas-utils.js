const DEFAULT_FONT = "16px 'Fira Sans', sans-serif";

export function createHiDPICanvas(width, height, dpr = window.devicePixelRatio || 1) {
  const canvas = document.createElement('canvas');
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.font = DEFAULT_FONT;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  return { canvas, ctx, dpr };
}

export function withScale(ctx, dpr, fn) {
  ctx.save();
  ctx.scale(dpr, dpr);
  try {
    fn();
  } finally {
    ctx.restore();
  }
}

export function measureText(ctx, text, font = DEFAULT_FONT) {
  const prev = ctx.font;
  ctx.font = font;
  const metrics = ctx.measureText(text);
  ctx.font = prev;
  return metrics;
}

export function drawCircle(ctx, x, y, radius, options = {}) {
  const { fillStyle, strokeStyle, lineWidth = 1 } = options;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle && lineWidth > 0) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

export function computeContrastStroke(rgb) {
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)';
}

export function clearCanvas(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
}
