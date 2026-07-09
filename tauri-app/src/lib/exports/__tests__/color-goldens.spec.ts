import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  linearSrgbToOklab,
  oklabToOklch,
  rgbToHsv,
  srgbToLinear,
} from '../polar-chart';

const OKLAB_TOL = 2e-3;
const OKLCH_TOL = 2e-3;
const HUE_TOL = 0.5;
const HSV_TOL = 2e-3;
const CHROMA_EPS = 1e-3;

type FixtureSample = {
  rgb: [number, number, number];
  oklab: [number, number, number];
  oklch: [number, number, number];
  hsv: [number, number, number];
};

describe('color goldens (TS)', () => {
  it('matches reference fixture values', () => {
    const fixturePath = new URL(
      '../../../../src-tauri/tests/fixtures/color_golden.json',
      import.meta.url
    );
    const contents = readFileSync(fileURLToPath(fixturePath), 'utf-8');
    const data = JSON.parse(contents) as { samples: FixtureSample[] };
    for (const sample of data.samples) {
      const rgb = sample.rgb;
      const oklab = rgbToOklab(rgb);
      const oklch = oklabToOklch(oklab);
      const hsv = rgbToHsv({ r: rgb[0], g: rgb[1], b: rgb[2] });

      assertCloseVec(oklab, sample.oklab, OKLAB_TOL, 'oklab');
      assertClose(oklch[0], sample.oklch[0], OKLCH_TOL, 'oklch.l');
      assertClose(oklch[1], sample.oklch[1], OKLCH_TOL, 'oklch.c');
      if (sample.oklch[1] > CHROMA_EPS && oklch[1] > CHROMA_EPS) {
        assertHueClose(oklch[2], sample.oklch[2], HUE_TOL, 'oklch.h');
      }

      if (sample.hsv[1] > CHROMA_EPS && hsv[1] > CHROMA_EPS) {
        assertHueClose(hsv[0], sample.hsv[0], HUE_TOL, 'hsv.h');
      }
      assertClose(hsv[1], sample.hsv[1], HSV_TOL, 'hsv.s');
      assertClose(hsv[2], sample.hsv[2], HSV_TOL, 'hsv.v');
    }
  });
});

function rgbToOklab(rgb: [number, number, number]): [number, number, number] {
  const linear = rgb.map((value) => srgbToLinear(value / 255)) as [
    number,
    number,
    number,
  ];
  return linearSrgbToOklab(linear);
}

function assertCloseVec(
  actual: [number, number, number],
  expected: [number, number, number],
  tol: number,
  label: string
) {
  actual.forEach((value, idx) =>
    assertClose(value, expected[idx], tol, `${label}[${idx}]`)
  );
}

function assertClose(
  actual: number,
  expected: number,
  tol: number,
  label: string
) {
  const diff = Math.abs(actual - expected);
  expect(
    diff <= tol,
    `${label} diff ${diff} exceeds tol ${tol} (actual=${actual}, expected=${expected})`
  ).toBe(true);
}

function assertHueClose(
  actual: number,
  expected: number,
  tol: number,
  label: string
) {
  let diff = Math.abs(actual - expected);
  if (diff > 180) diff = 360 - diff;
  expect(
    diff <= tol,
    `${label} diff ${diff} exceeds tol ${tol} (actual=${actual}, expected=${expected})`
  ).toBe(true);
}
