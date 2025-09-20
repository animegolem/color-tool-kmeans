const EPS = 1e-9;

const WHITEPOINT = {
  X: 95.047,
  Y: 100.0,
  Z: 108.883
};

export function clamp(value, min = 0, max = 255) {
  return Math.max(min, Math.min(max, value));
}

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(v) {
  const x = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return clamp(Math.round(x * 255));
}

export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (Math.abs(max - min) > EPS) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0));
        break;
      case g:
        h = ((b - r) / d + 2);
        break;
      default:
        h = ((r - g) / d + 4);
    }
    h /= 6;
  }
  return { h: h * 360, s, l };
}

export function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s <= EPS) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: clamp(Math.round(r * 255)), g: clamp(Math.round(g * 255)), b: clamp(Math.round(b * 255)) };
}

export function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d > EPS) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0));
        break;
      case g:
        h = ((b - r) / d + 2);
        break;
      default:
        h = ((r - g) / d + 4);
    }
    h /= 6;
  }
  const s = max <= EPS ? 0 : d / max;
  return { h: h * 360, s, v: max };
}

export function rgbToYuv(r, g, b) {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const u = -0.168736 * r - 0.331264 * g + 0.5 * b + 128;
  const v = 0.5 * r - 0.418688 * g - 0.081312 * b + 128;
  return { y, u, v };
}

export function yuvToRgb(y, u, v) {
  const r = y + 1.402 * (v - 128);
  const g = y - 0.344136 * (u - 128) - 0.714136 * (v - 128);
  const b = y + 1.772 * (u - 128);
  return { r: clamp(Math.round(r)), g: clamp(Math.round(g)), b: clamp(Math.round(b)) };
}

export function rgbToXyz(r, g, b) {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  const X = R * 0.4124 + G * 0.3576 + B * 0.1805;
  const Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const Z = R * 0.0193 + G * 0.1192 + B * 0.9505;
  return { X: X * 100, Y: Y * 100, Z: Z * 100 };
}

export function xyzToRgb(X, Y, Z) {
  X /= 100; Y /= 100; Z /= 100;
  const R = X * 3.2406 + Y * -1.5372 + Z * -0.4986;
  const G = X * -0.9689 + Y * 1.8758 + Z * 0.0415;
  const B = X * 0.0557 + Y * -0.2040 + Z * 1.0570;
  return {
    r: linearToSrgb(R),
    g: linearToSrgb(G),
    b: linearToSrgb(B)
  };
}

function pivotLab(t) {
  return t > 0.008856 ? Math.cbrt(t) : (7.787 * t) + 16 / 116;
}

function pivotLabInv(t) {
  const cube = t ** 3;
  return cube > 0.008856 ? cube : (t - 16 / 116) / 7.787;
}

export function rgbToLab(r, g, b) {
  const { X, Y, Z } = rgbToXyz(r, g, b);
  const x = pivotLab(X / WHITEPOINT.X);
  const y = pivotLab(Y / WHITEPOINT.Y);
  const z = pivotLab(Z / WHITEPOINT.Z);
  return {
    L: (116 * y) - 16,
    a: 500 * (x - y),
    b: 200 * (y - z)
  };
}

export function labToRgb(L, a, b) {
  const y = (L + 16) / 116;
  const x = a / 500 + y;
  const z = y - b / 200;
  const X = WHITEPOINT.X * pivotLabInv(x);
  const Y = WHITEPOINT.Y * pivotLabInv(y);
  const Z = WHITEPOINT.Z * pivotLabInv(z);
  return xyzToRgb(X, Y, Z);
}

export function rgbToLuv(r, g, b) {
  const { X, Y, Z } = rgbToXyz(r, g, b);
  const denom = X + 15 * Y + 3 * Z;
  const uPrime = denom === 0 ? 0 : (4 * X) / denom;
  const vPrime = denom === 0 ? 0 : (9 * Y) / denom;

  const refDenom = WHITEPOINT.X + 15 * WHITEPOINT.Y + 3 * WHITEPOINT.Z;
  const refU = (4 * WHITEPOINT.X) / refDenom;
  const refV = (9 * WHITEPOINT.Y) / refDenom;

  const yr = Y / WHITEPOINT.Y;
  const L = yr > 0.008856 ? (116 * Math.cbrt(yr) - 16) : (903.3 * yr);
  const u = 13 * L * (uPrime - refU);
  const v = 13 * L * (vPrime - refV);
  return { L, u, v };
}

export function luvToRgb(L, u, v) {
  if (L <= 0) {
    return { r: 0, g: 0, b: 0 };
  }
  const refDenom = WHITEPOINT.X + 15 * WHITEPOINT.Y + 3 * WHITEPOINT.Z;
  const refU = (4 * WHITEPOINT.X) / refDenom;
  const refV = (9 * WHITEPOINT.Y) / refDenom;

  const a = u / (13 * L) + refU;
  const b = v / (13 * L) + refV;

  const Y = L > 8 ? WHITEPOINT.Y * Math.pow((L + 16) / 116, 3) : WHITEPOINT.Y * L / 903.3;
  const denom = (4 * b) - (a * b) - (5 * b);
  const X = denom === 0 ? 0 : Y * (9 * a) / (4 * b);
  const Z = b === 0 ? 0 : (Y * (12 - 3 * a - 20 * b)) / (4 * b);

  return xyzToRgb(X, Y, Z);
}

export function toRgb(space, c1, c2, c3) {
  switch (space) {
    case 'RGB':
      return { r: clamp(Math.round(c1)), g: clamp(Math.round(c2)), b: clamp(Math.round(c3)) };
    case 'HSL':
      return hslToRgb(c1, c2, c3);
    case 'YUV':
      return yuvToRgb(c1, c2, c3);
    case 'CIELAB':
      return labToRgb(c1, c2, c3);
    case 'CIELUV':
      return luvToRgb(c1, c2, c3);
    default:
      throw new Error(`Unsupported space ${space}`);
  }
}

export function fromRgb(space, r, g, b) {
  switch (space) {
    case 'RGB':
      return [r, g, b];
    case 'HSL': {
      const { h, s, l } = rgbToHsl(r, g, b);
      return [h, s, l];
    }
    case 'YUV': {
      const { y, u, v } = rgbToYuv(r, g, b);
      return [y, u, v];
    }
    case 'CIELAB': {
      const { L, a, b: bb } = rgbToLab(r, g, b);
      return [L, a, bb];
    }
    case 'CIELUV': {
      const { L, u, v } = rgbToLuv(r, g, b);
      return [L, u, v];
    }
    default:
      throw new Error(`Unsupported space ${space}`);
  }
}

export function ensureValidSpace(space) {
  const supported = ['RGB', 'HSL', 'YUV', 'CIELAB', 'CIELUV'];
  if (!supported.includes(space)) {
    throw new Error(`Unsupported color space: ${space}`);
  }
}
