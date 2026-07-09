import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  saveFromPath: vi.fn(),
}));

vi.mock('../../bridges/fs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../bridges/fs')>()),
  saveFromPath: mocks.saveFromPath,
  getFsBridge: vi.fn(),
}));

import {
  createColorsExportRunner,
  formatTimestamp,
} from '../exports/colors-export-runner.svelte';
import { sourceImageExportName } from '../../bridges/fs';
import type {
  AnalysisParams,
  AnalysisResult,
  ExportChecks,
  SelectedImage,
} from '../../stores/ui';

const params: AnalysisParams = {
  clusters: 45,
  quality: 2,
  ignoreTopN: 0,
  mergeThreshold: 0,
  symbolScale: 1,
  showClusterOutline: false,
  showAxisLabels: true,
  polarMode: 'okhsv',
  hueLightnessSizeMode: 'chroma',
  histogramSort: 'frequency',
  snapToReal: true,
  showHistogram: true,
  showPolarChart: true,
  showHueLightness: true,
};

const result: AnalysisResult = {
  clusters: [],
  iterations: 0,
  durationMs: 0,
  totalSamples: 0,
  variant: 'audit',
};

const checks = {} as ExportChecks;

function makeRunner(file: SelectedImage) {
  return createColorsExportRunner({
    getFile: () => file,
    getResult: () => result,
    getParams: () => params,
    getExportScale: () => 2,
    getExportChecks: () => checks,
    getGraphExportFormat: () => 'png',
    getVideoStrip: () => null,
    getVideoFrameLabel: () => 'timestamp',
    getVideoFps: () => 24,
  });
}

function selectedFile(overrides: Partial<SelectedImage> = {}): SelectedImage {
  return {
    id: 'image-1',
    name: 'scan.tiff',
    path: '/tmp/scan.tiff',
    size: 0,
    source: { kind: 'path', path: '/tmp/scan.tiff' },
    previewUrl: 'asset:///tmp/scan.tiff',
    dataset: { width: 0, height: 0, pixels: new Uint8Array(0) },
    ...overrides,
  };
}

describe('audit regressions for export naming', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.saveFromPath.mockResolvedValue({ canceled: false, path: '/tmp/out' });
  });

  it('AUD-012: uses an honest TIFF extension when copying a supported source image', () => {
    expect(sourceImageExportName('scan.tiff', 'scan')).toBe('scan-source.tif');
  });

  it('AUD-012: preserves the GIF extension when copying a supported source image', () => {
    expect(sourceImageExportName('animation.gif', 'animation')).toBe(
      'animation-source.gif'
    );
  });

  it('AUD-017 normalizes a rounded 100-centisecond timestamp into the next second', () => {
    expect(formatTimestamp(1.999)).toBe('00m02s00');
  });

  it.each([
    [0.999, '00m01s00'],
    [59.999, '01m00s00'],
  ])(
    'AUD-017 carries a rounded timestamp boundary at %s seconds',
    (frameTimestamp, expected) => {
      expect(formatTimestamp(frameTimestamp)).toBe(expected);
    }
  );
});
