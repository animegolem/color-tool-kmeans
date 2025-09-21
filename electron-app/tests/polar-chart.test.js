import test from 'node:test';
import assert from 'node:assert/strict';
import { PolarChart } from '../src/renderer/views/polar-chart.js';

function makeCluster({ hue, sat, val, share, rgb, count }) {
  return {
    count,
    share,
    rgb,
    centroidSpace: new Float32Array([0, 0, 0]),
    hsv: new Float32Array([hue, sat, val])
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

test('PolarChart layout respects axis type', () => {
  const clusters = [
    makeCluster({ hue: 0, sat: 1, val: 0.2, share: 0.1, rgb: { r: 255, g: 0, b: 0 }, count: 100 }),
    makeCluster({ hue: 120, sat: 0.5, val: 0.9, share: 0.05, rgb: { r: 0, g: 255, b: 0 }, count: 50 })
  ];
  const chart = new PolarChart({ radius: 250 });
  const layoutHSL = chart.setData(clusters, { axisType: 'HSL' });
  assert.equal(layoutHSL.length, 2);
  assert.ok(layoutHSL[0].y < chart.centerY); // hue 0 should sit toward top

  chart.setOptions({ axisType: 'HLS' });
  const layoutHLS = chart.getLayout();
  assert.notEqual(layoutHSL[1].y.toFixed(2), layoutHLS[1].y.toFixed(2));
  assert.ok(layoutHLS[0].y > layoutHSL[0].y);
});

test('PolarChart toSVG outputs circles', () => {
  const clusters = [
    makeCluster({ hue: 60, sat: 0.7, val: 0.8, share: 0.15, rgb: { r: 250, g: 210, b: 100 }, count: 120 })
  ];
  const chart = new PolarChart();
  chart.setData(clusters);
  const svg = chart.toSVG();
  assert.ok(svg.includes('<circle'), 'SVG should include circle elements');
  assert.ok(svg.includes('Fira Sans'));
});

test('PolarChart toPNG throws when OffscreenCanvas unavailable', async () => {
  const chart = new PolarChart();
  chart.setData([
    makeCluster({ hue: 220, sat: 0.6, val: 0.4, share: 0.2, rgb: { r: 80, g: 120, b: 200 }, count: 80 })
  ]);
  await assert.rejects(chart.toPNG(), /OffscreenCanvas/);
});

test('PolarChart toPNG renders via OffscreenCanvas when available', async () => {
  const chart = new PolarChart();
  chart.setData([
    makeCluster({ hue: 45, sat: 0.6, val: 0.8, share: 0.3, rgb: { r: 220, g: 180, b: 120 }, count: 200 })
  ]);
  const { value, recorded } = await withFakeCanvas(() => chart.toPNG(2));
  assert.ok(value instanceof Blob);
  assert.equal(recorded.width, chart.width * 2);
  assert.equal(recorded.height, chart.height * 2);
  assert.equal(recorded.scaleX, 2);
  assert.equal(recorded.bitmapType, 'image/svg+xml');
  assert.equal(recorded.convertType, 'image/png');
});

test('PolarChart exportAs handles formats', async () => {
  const chart = new PolarChart();
  chart.setData([
    makeCluster({ hue: 10, sat: 0.7, val: 0.6, share: 0.4, rgb: { r: 200, g: 100, b: 80 }, count: 100 })
  ]);
  const svg = chart.toSVG();
  assert.equal(chart.exportAs({ format: 'svg' }), svg);
  await assert.rejects(chart.exportAs({ format: 'png' }), /OffscreenCanvas/);
  assert.throws(() => chart.exportAs({ format: 'pdf' }), /Unsupported export format/);
});
