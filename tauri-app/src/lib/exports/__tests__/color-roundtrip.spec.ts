import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { linearSrgbToOklab, rgbToHsv, srgbToLinear } from '../polar-chart';

const RGB_TOLERANCE = 2;

describe('color round-trip (TS)', () => {
  it('rgb -> oklab -> rgb stays within tolerance', () => {
    fc.assert(
      fc.property(fcRgb(), (rgb) => {
        const lab = rgbToOklab(rgb);
        const back = oklabToRgb8(lab);
        expect(maxDiff(rgb, back)).toBeLessThanOrEqual(RGB_TOLERANCE);
      }),
      { numRuns: 2000 }
    );
  });

  it('rgb -> hsv -> rgb stays within tolerance', () => {
    fc.assert(
      fc.property(fcRgb(), (rgb) => {
        const hsv = rgbToHsv({ r: rgb[0], g: rgb[1], b: rgb[2] });
        const back = hsvToRgb8(hsv);
        expect(maxDiff(rgb, back)).toBeLessThanOrEqual(RGB_TOLERANCE);
      }),
      { numRuns: 2000 }
    );
  });
});

function fcRgb() {
  return fc
    .tuple(fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 }))
    .filter((rgb) => Number.isFinite(rgb[0]) && Number.isFinite(rgb[1]) && Number.isFinite(rgb[2]));
}

function maxDiff(a: [number, number, number], b: [number, number, number]): number {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
}

function rgbToOklab(rgb: [number, number, number]): [number, number, number] {
  const linear = rgb.map((value) => srgbToLinear(value / 255)) as [number, number, number];
  return linearSrgbToOklab(linear);
}

function oklabToRgb8(lab: [number, number, number]): [number, number, number] {
  const linear = oklabToLinearSrgb(lab).map(clamp01) as [number, number, number];
  return linear.map((value) => toRgb8(linearToSrgb(value))) as [number, number, number];
}

function hsvToRgb8(hsv: [number, number, number]): [number, number, number] {
  const [hRaw, sRaw, vRaw] = hsv;
  const h = ((hRaw % 360) + 360) % 360;
  const s = clamp01(sRaw);
  const v = clamp01(vRaw);
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (h < 60) {
    r1 = c;
    g1 = x;
  } else if (h < 120) {
    r1 = x;
    g1 = c;
  } else if (h < 180) {
    g1 = c;
    b1 = x;
  } else if (h < 240) {
    g1 = x;
    b1 = c;
  } else if (h < 300) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }
  return [
    toRgb8(r1 + m),
    toRgb8(g1 + m),
    toRgb8(b1 + m)
  ];
}

function oklabToLinearSrgb(lab: [number, number, number]): [number, number, number] {
  const [l, a, b] = lab;
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;
  return [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3
  ];
}

function linearToSrgb(value: number): number {
  if (value <= 0.0031308) return value * 12.92;
  return 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
}

function toRgb8(value: number): number {
  return Math.floor(clamp01(value) * 255 + 0.5);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
