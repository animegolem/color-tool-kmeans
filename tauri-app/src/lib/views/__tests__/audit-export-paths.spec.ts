import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  saveFromPath: vi.fn(),
}));

vi.mock('../../bridges/fs', () => ({
  saveFromPath: mocks.saveFromPath,
  getFsBridge: vi.fn(),
}));

import { createColorsExportRunner } from '../exports/colors-export-runner.svelte';
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

describe('audit reproductions for export naming', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.saveFromPath.mockResolvedValue({ canceled: false, path: '/tmp/out' });
  });

  it.fails(
    'preserves the TIFF extension when copying a supported source image',
    async () => {
      const runner = makeRunner(selectedFile());

      await runner.saveSourceImagePng();

      expect(mocks.saveFromPath).toHaveBeenCalledWith(
        '/tmp/scan.tiff',
        'scan-source.tiff'
      );
    }
  );

  it.fails(
    'normalizes a rounded 100-centisecond timestamp into the next second',
    () => {
      const runner = makeRunner(
        selectedFile({
          name: 'clip.mp4',
          path: '/tmp/frame.png',
          videoPath: '/tmp/clip.mp4',
          frameTimestamp: 1.999,
        })
      );

      expect(runner.baseName()).toBe('clip-00m02s00');
    }
  );
});
