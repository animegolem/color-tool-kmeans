import test from 'node:test';
import assert from 'node:assert/strict';
import {
  rgbToHsl,
  hslToRgb,
  rgbToYuv,
  yuvToRgb,
  rgbToLab,
  labToRgb,
  rgbToLuv,
  luvToRgb,
  rgbToHsv
} from '../src/worker/colorspaces.js';

function approxEqual(a, b, tol = 2) {
  assert.ok(Math.abs(a - b) <= tol, `Expected ${a} ≈ ${b} (±${tol})`);
}

test('HSL roundtrip maintains RGB within tolerance', () => {
  const samples = [
    [12, 34, 56],
    [0, 128, 255],
    [240, 120, 60],
    [255, 255, 255],
    [15, 200, 90]
  ];
  for (const [r, g, b] of samples) {
    const hsl = rgbToHsl(r, g, b);
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    approxEqual(rgb.r, r, 1);
    approxEqual(rgb.g, g, 1);
    approxEqual(rgb.b, b, 1);
  }
});

test('YUV roundtrip maintains RGB within tolerance', () => {
  const samples = [
    [20, 40, 80],
    [100, 150, 200],
    [200, 20, 40]
  ];
  for (const [r, g, b] of samples) {
    const yuv = rgbToYuv(r, g, b);
    const rgb = yuvToRgb(yuv.y, yuv.u, yuv.v);
    approxEqual(rgb.r, r, 2);
    approxEqual(rgb.g, g, 2);
    approxEqual(rgb.b, b, 2);
  }
});

test('CIELAB roundtrip maintains RGB', () => {
  const samples = [
    [12, 120, 230],
    [0, 0, 0],
    [255, 255, 255],
    [45, 178, 90]
  ];
  for (const [r, g, b] of samples) {
    const lab = rgbToLab(r, g, b);
    const rgb = labToRgb(lab.L, lab.a, lab.b);
    approxEqual(rgb.r, r, 2);
    approxEqual(rgb.g, g, 2);
    approxEqual(rgb.b, b, 2);
  }
});

test('CIELUV roundtrip maintains RGB', () => {
  const samples = [
    [12, 120, 230],
    [0, 0, 0],
    [255, 255, 255],
    [120, 200, 32]
  ];
  for (const [r, g, b] of samples) {
    const luv = rgbToLuv(r, g, b);
    const rgb = luvToRgb(luv.L, luv.u, luv.v);
    approxEqual(rgb.r, r, 4);
    approxEqual(rgb.g, g, 4);
    approxEqual(rgb.b, b, 4);
  }
});

test('rgbToHsv returns expected hue ordering', () => {
  const hsvRed = rgbToHsv(255, 0, 0);
  const hsvGreen = rgbToHsv(0, 255, 0);
  const hsvBlue = rgbToHsv(0, 0, 255);
  assert.ok(hsvRed.h < hsvGreen.h && hsvGreen.h < hsvBlue.h + 360);
});
