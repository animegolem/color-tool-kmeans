// sRGB <-> OKLab (Ottosson 2021). Pure; shared by the page, the bench, and the shader's JS reference.

const LUT = new Float32Array(256); // sRGB byte -> linear
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  LUT[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function rgbToOklab(r, g, b, out, o) {
  const lr = LUT[r],
    lg = LUT[g],
    lb = LUT[b];
  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
  );
  out[o] = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  out[o + 1] = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  out[o + 2] = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
}

const enc = (x) => {
  const c = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(c * 255)));
};

// OKLab -> sRGB bytes, clipped to the gamut.
export function oklabToRgb(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    enc(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    enc(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    enc(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

export const hex = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

// Up to maxSamples pixels spread evenly over an RGBA buffer (a fractional step, so the whole
// buffer is covered), as packed OKLab triples.
export function sampleRGBA(data, pixels, maxSamples) {
  const n = Math.min(maxSamples, pixels);
  const X = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const p = Math.floor((i * pixels) / n) * 4;
    rgbToOklab(data[p], data[p + 1], data[p + 2], X, i * 3);
  }
  return X;
}
