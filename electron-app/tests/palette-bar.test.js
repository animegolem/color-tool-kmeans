import test from 'node:test';
import assert from 'node:assert/strict';
import { PaletteBar } from '../src/renderer/views/palette-bar.js';
import { PaletteSortMode } from '../src/shared/types.js';

function makeCluster(hue, share, count, rgb) {
  return {
    count,
    share,
    rgb,
    hsv: new Float32Array([hue, share, share]),
    centroidSpace: new Float32Array(3)
  };
}

async function withFakeCanvas(callback) {
  const originalCanvas = globalThis.OffscreenCanvas;
  const originalCreateImageBitmap = globalThis.createImageBitmap;
  const recorded = {};
  class FakeCanvas {
    constructor(width, height) {
      recorded.width = width;
      recorded.height = height;
      this.ctx = {
        scale: (x, y) => {
          recorded.scaleX = x;
          recorded.scaleY = y;
        },
        drawImage: () => {
          recorded.drawImageCalled = true;
        }
      };
    }

    getContext() {
      return this.ctx;
    }

    convertToBlob(options = { type: 'image/png' }) {
      recorded.convertType = options.type;
      return Promise.resolve(new Blob([''], { type: options.type }));
    }
  }

  globalThis.OffscreenCanvas = FakeCanvas;
  globalThis.createImageBitmap = async (blob) => {
    recorded.bitmapType = blob.type;
    return {};
  };

  try {
    const value = await callback(recorded);
    return { value, recorded };
  } finally {
    globalThis.OffscreenCanvas = originalCanvas;
    globalThis.createImageBitmap = originalCreateImageBitmap;
  }
}

test('PaletteBar sorts by share descending by default', () => {
  const bar = new PaletteBar();
  const clusters = [
    makeCluster(0, 0.1, 100, { r: 200, g: 20, b: 20 }),
    makeCluster(120, 0.3, 80, { r: 20, g: 220, b: 20 }),
    makeCluster(240, 0.05, 40, { r: 20, g: 20, b: 220 })
  ];
  bar.setData(clusters);
  const rows = bar.getRows();
  assert.equal(rows[0].count, 80);
  assert.equal(rows[1].count, 100);
  assert.equal(rows[2].count, 40);
});

test('PaletteBar supports hue sort', () => {
  const bar = new PaletteBar({ sortMode: PaletteSortMode.HUE });
  const clusters = [
    makeCluster(240, 0.2, 40, { r: 20, g: 20, b: 220 }),
    makeCluster(60, 0.25, 60, { r: 220, g: 200, b: 40 }),
    makeCluster(10, 0.1, 30, { r: 220, g: 60, b: 40 })
  ];
  bar.setData(clusters);
  const rows = bar.getRows();
  assert.equal(rows[0].hue, 10);
  assert.equal(rows[1].hue, 60);
  assert.equal(rows[2].hue, 240);
});

test('PaletteBar toSVG has no background and uses Fira Sans', () => {
  const bar = new PaletteBar();
  bar.setData([makeCluster(0, 0.2, 10, { r: 200, g: 30, b: 30 })]);
  const svg = bar.toSVG();
  assert.ok(svg.includes('Fira Sans'));
  assert.ok(!svg.includes('fill="none" stroke="none"')); // ensure swatch exists
  assert.ok(!svg.includes('background'));
});

test('PaletteBar toPNG throws without OffscreenCanvas', async () => {
  const bar = new PaletteBar();
  bar.setData([makeCluster(120, 0.2, 10, { r: 30, g: 200, b: 30 })]);
  await assert.rejects(bar.toPNG(), /OffscreenCanvas/);
});

test('PaletteBar toPNG renders via OffscreenCanvas when available', async () => {
  const bar = new PaletteBar();
  bar.setData([makeCluster(60, 0.4, 20, { r: 230, g: 180, b: 60 })]);
  const { value, recorded } = await withFakeCanvas(() => bar.toPNG(3));
  assert.ok(value instanceof Blob);
  assert.equal(recorded.width, bar.width * 3);
  assert.equal(recorded.height, bar.height * 3);
  assert.equal(recorded.scaleX, 3);
  assert.equal(recorded.bitmapType, 'image/svg+xml');
  assert.equal(recorded.convertType, 'image/png');
});

test('PaletteBar exportAs respects format', async () => {
  const bar = new PaletteBar();
  bar.setData([makeCluster(200, 0.5, 15, { r: 60, g: 90, b: 220 })]);
  const svg = bar.toSVG();
  assert.equal(bar.exportAs({ format: 'svg' }), svg);
  await assert.rejects(bar.exportAs({ format: 'png' }), /OffscreenCanvas/);
  assert.throws(() => bar.exportAs({ format: 'gif' }), /Unsupported export format/);
});
