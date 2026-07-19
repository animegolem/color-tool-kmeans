import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isTauriEnv: vi.fn(() => true),
  tauriDetectionInfo: vi.fn(() => ({ source: 'test' })),
  tauriInvoke: vi.fn(),
}));

vi.mock('../bridges/tauri', () => mocks);

import { TauriComputeError } from '../bridges/compute';
import {
  clearActivePath,
  getActivePath,
  setActivePath,
} from '../services/active-image';
import { analyzeImagePath } from './bridge';
import type { AnalysisParams } from '../stores/analysis';

const params: AnalysisParams = {
  clusters: 4,
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

function wireResponse() {
  return {
    clusters: [
      {
        count: 1,
        share: 1,
        centroid_space: [0.5, 0, 0],
        ok_lab: [0.5, 0, 0],
        ok_lch: [0.5, 0, 0],
        rgb: { r: 128, g: 128, b: 128 },
        hsv: [0, 0, 0.5],
      },
    ],
    iterations: 2,
    duration_ms: 4,
    total_samples: 5,
    variant: 'typed-path',
  };
}

describe('path-explicit compute bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearActivePath();
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  it('SWEEP-025 analyzes the supplied path without mutating the active path', async () => {
    setActivePath('/tmp/active.png');
    mocks.tauriInvoke.mockResolvedValueOnce(wireResponse());

    const result = await analyzeImagePath('/tmp/batch-grid.png', params);

    expect(mocks.tauriInvoke).toHaveBeenCalledWith('analyze_image', {
      req: {
        path: '/tmp/batch-grid.png',
        k: 4,
        quality: 2,
        ignoreTopN: 0,
        mergeThreshold: 0,
        snapToReal: true,
        minLum: 0,
        tol: 1e-3,
        maxIter: 40,
        seed: 1,
        maxSamples: 300_000,
      },
    });
    expect(result.variant).toBe('typed-path');
    expect(result.clusters[0].centroidSpace).toEqual([0.5, 0, 0]);
    expect(getActivePath()).toBe('/tmp/active.png');
  });

  it.each([
    ['invoke-failed', new Error('native failed')],
    ['invalid-response', { clusters: [] }],
  ] as const)(
    'SWEEP-025 reports %s through typed bridge errors',
    async (code, outcome) => {
      if (outcome instanceof Error) {
        mocks.tauriInvoke.mockRejectedValueOnce(outcome);
      } else {
        mocks.tauriInvoke.mockResolvedValueOnce(outcome);
      }

      const error = await analyzeImagePath('/tmp/batch-grid.png', params).catch(
        (caught: unknown) => caught
      );

      expect(error).toBeInstanceOf(TauriComputeError);
      expect(error).toMatchObject({ code });
    }
  );
});
