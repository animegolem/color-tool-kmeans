import test from 'node:test';
import assert from 'node:assert/strict';
import { computePaletteFromImageData } from '../src/renderer/pipeline.js';

function createImageData(width, height, pixels) {
  return {
    width,
    height,
    data: new Uint8ClampedArray(pixels)
  };
}

function createTwoColorImageData() {
  // 4x4 image. First half dark olive, second half light beige.
  const pixels = [];
  for (let i = 0; i < 8; i++) {
    pixels.push(60, 63, 56, 255);
  }
  for (let i = 0; i < 8; i++) {
    pixels.push(210, 197, 175, 255);
  }
  return createImageData(4, 4, pixels);
}

test('computePaletteFromImageData returns two dominant clusters', () => {
  const imageData = createTwoColorImageData();
  const result = computePaletteFromImageData(imageData, { k: 4, space: 'YUV', stride: 1, minLum: 0 });
  assert.equal(result.totalSamples, 16);
  assert.ok(result.clusters.length >= 2);
  const [first, second] = result.clusters;
  assert.ok(first.count >= 8);
  assert.ok(second.count >= 4);
  assert.ok(first.rgb.r > second.rgb.r || second.rgb.r > first.rgb.r); // ensure distinct colors
});

test('computePaletteFromImageData respects minLum', () => {
  const imageData = createImageData(2, 2, [
    10, 10, 10, 255,
    12, 12, 12, 255,
    250, 250, 250, 255,
    240, 240, 240, 255
  ]);
  const result = computePaletteFromImageData(imageData, { k: 2, minLum: 50 });
  assert.equal(result.totalSamples, 2);
  assert.ok(result.clusters.length >= 1);
  assert.ok(result.clusters[0].share <= 1);
});
