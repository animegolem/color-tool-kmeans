import { describe, expect, it } from 'vitest';
import {
  buildOklchGamutOutline,
  linearSrgbToOklab,
  oklabToOklch,
  srgbToLinear,
} from '../polar-chart';

const SAMPLE_COUNT = 1000;
const EPSILON = 1e-3;

describe('oklch gamut boundary', () => {
  it('contains all sampled sRGB points', () => {
    const outline = buildOklchGamutOutline(24);
    const maxChromaLut = buildHueChromaLut(outline, 360);
    const rng = mulberry32(0xdeadbeef);

    for (let i = 0; i < SAMPLE_COUNT; i += 1) {
      const rgb: [number, number, number] = [
        Math.floor(rng() * 256),
        Math.floor(rng() * 256),
        Math.floor(rng() * 256),
      ];
      const lch = rgbToOklch(rgb);
      const maxChroma = maxChromaLut[wrapHueIndex(lch[2])];
      expect(lch[1]).toBeLessThanOrEqual(maxChroma + EPSILON);
    }
  });
});

function rgbToOklch(rgb: [number, number, number]): [number, number, number] {
  const linear = rgb.map((value) => srgbToLinear(value / 255)) as [
    number,
    number,
    number,
  ];
  const lab = linearSrgbToOklab(linear);
  return oklabToOklch(lab);
}

function buildHueChromaLut(
  points: Array<{ h: number; c: number }>,
  bins: number
): number[] {
  const lut = new Array(bins).fill(0);
  for (const point of points) {
    const idx = wrapHueIndex(point.h) % bins;
    lut[idx] = Math.max(lut[idx], point.c);
  }
  let last = 0;
  for (let i = 0; i < bins; i += 1) {
    if (lut[i] === 0) {
      lut[i] = last;
    } else {
      last = lut[i];
    }
  }
  for (let i = bins - 1; i >= 0; i -= 1) {
    if (lut[i] === 0) {
      lut[i] = last;
    } else {
      last = lut[i];
    }
  }
  return lut.map((value) => (value <= 0 ? 0 : value));
}

function wrapHueIndex(hue: number): number {
  const normalized = ((hue % 360) + 360) % 360;
  return Math.round(normalized) % 360;
}

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;
    let result = Math.imul(t ^ (t >>> 15), 1 | t);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}
