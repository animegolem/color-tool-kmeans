import { beforeEach, describe, expect, it, vi } from 'vitest';

const GOLDEN_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="321" height="123"><rect width="321" height="123" fill="none"/></svg>';
const GOLDEN_CHART = { svg: GOLDEN_SVG, width: 321, height: 123 };

const mocks = vi.hoisted(() => ({
  generateValueAnalysisSvg: vi.fn(),
  getFsBridge: vi.fn(),
  requestValueAnalysis: vi.fn(),
  saveBlob: vi.fn(),
  saveFromPath: vi.fn(),
  svgToPngBlob: vi.fn(),
}));

vi.mock('../../exports/value-analysis', () => ({
  generateValueAnalysisSvg: mocks.generateValueAnalysisSvg,
}));

vi.mock('../../bridges/fs', () => ({
  getFsBridge: mocks.getFsBridge,
  saveFromPath: mocks.saveFromPath,
}));

vi.mock('../../exports/png', () => ({
  svgToPngBlob: mocks.svgToPngBlob,
}));

vi.mock('../../bridges/value-analysis', () => ({
  requestValueAnalysis: mocks.requestValueAnalysis,
}));

vi.mock('../../utils/asset-url', () => ({
  assetUrl: (path: string) => `asset://${path}`,
}));

import { createValuesExportRunner } from './values-export-runner.svelte';
import {
  valueAnalysisLevels,
  type SelectedImage,
  type ValueAnalysisResult,
} from '../../stores/ui';

const file: SelectedImage = {
  id: 'image-1',
  name: 'source.png',
  path: '/tmp/source.png',
  size: 0,
  source: { kind: 'path', path: '/tmp/source.png' },
  previewUrl: 'asset:///tmp/source.png',
  dataset: { width: 0, height: 0, pixels: new Uint8Array() },
};

const study: ValueAnalysisResult = {
  neutral: '/cache/neutral.png',
  neutralWidth: 20,
  neutralHeight: 10,
  preview: '/cache/preview.png',
  previewWidth: 20,
  previewHeight: 10,
  bucketMap: '/cache/map.png',
  bucketMapData: [0],
  p10: 0.1,
  p90: 0.9,
  p01: 0.01,
  p99: 0.99,
  centroids: [0.5],
  boundaries: [],
  bucketValues: [0.5],
  counts: [1],
  histogramBins: [1],
  levels: 3,
  notanMode: false,
};

function runner(format: string, scale = 2) {
  const setStatus = vi.fn();
  return {
    setStatus,
    runner: createValuesExportRunner({
      getFile: () => file,
      getExportScale: () => scale,
      getCheckboxState: () => ({
        valuesNeutral: true,
        valuesIncludeOriginal: true,
        valuesRangeFinder: true,
        valuesHistogram: true,
        valuesSimplified: false,
        valuesAllStudies: false,
      }),
      getGraphExportFormat: () => format,
      performSave: async (action) => action(),
      baseName: () => 'source',
      setStatus,
    }),
  };
}

describe('Values chart saving through chart-save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    valueAnalysisLevels.set(3);
    mocks.generateValueAnalysisSvg.mockResolvedValue(GOLDEN_CHART);
    mocks.getFsBridge.mockResolvedValue({ saveBlob: mocks.saveBlob });
    mocks.requestValueAnalysis.mockResolvedValue(study);
    mocks.saveBlob.mockResolvedValue({ canceled: false });
    mocks.svgToPngBlob.mockResolvedValue(
      new Blob(['golden-png'], { type: 'image/png' })
    );
  });

  it('SWEEP-031: preserves golden range-finder SVG bytes and naming', async () => {
    const { runner: valuesRunner, setStatus } = runner('svg');

    await valuesRunner.saveRangeFinderPng();

    expect(mocks.generateValueAnalysisSvg).toHaveBeenCalledWith(
      expect.objectContaining({
        background: 'none',
        includeNeutral: false,
        includeOriginal: false,
        includeRangeFinder: true,
        includeHistogram: false,
        includeSimplified: false,
      })
    );
    expect(mocks.saveBlob).toHaveBeenCalledTimes(1);
    const [blob, name] = mocks.saveBlob.mock.calls[0] as [Blob, string];
    expect(name).toBe('source-range-finder.svg');
    expect(blob.type).toBe('image/svg+xml;charset=utf-8');
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(
      new TextEncoder().encode(GOLDEN_SVG)
    );
    expect(mocks.svgToPngBlob).not.toHaveBeenCalled();
    expect(setStatus).toHaveBeenCalledWith('Range finder SVG saved.', 'info');
  });

  it('SWEEP-031: preserves histogram PNG options, blob, naming, and status', async () => {
    const pngBlob = new Blob(['golden-png'], { type: 'image/png' });
    mocks.svgToPngBlob.mockResolvedValue(pngBlob);
    const { runner: valuesRunner, setStatus } = runner('png', 7);

    await valuesRunner.saveValuesHistogramPng();

    expect(mocks.generateValueAnalysisSvg).toHaveBeenCalledWith(
      expect.objectContaining({
        background: 'none',
        includeNeutral: false,
        includeOriginal: false,
        includeRangeFinder: false,
        includeHistogram: true,
        includeSimplified: false,
      })
    );
    expect(mocks.svgToPngBlob).toHaveBeenCalledWith(GOLDEN_SVG, 321, 123, 4);
    expect(mocks.saveBlob).toHaveBeenCalledWith(
      pngBlob,
      'source-values-histogram.png'
    );
    expect(setStatus).toHaveBeenCalledWith(
      'Values histogram PNG saved.',
      'info'
    );
  });

  it('SWEEP-031: preserves chart-save cancellation status', async () => {
    mocks.saveBlob.mockResolvedValue({ canceled: true });
    const { runner: valuesRunner, setStatus } = runner('png');

    await valuesRunner.saveRangeFinderPng();

    expect(setStatus).toHaveBeenCalledWith('Export canceled.', 'info');
  });
});
