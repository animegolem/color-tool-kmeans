import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

const mocks = vi.hoisted(() => ({
  tauriInvoke: vi.fn(),
}));

vi.mock('../../bridges/tauri', () => ({ tauriInvoke: mocks.tauriInvoke }));
vi.mock('../../bridges/log', () => ({ logEvent: vi.fn() }));

import { createBatchRunner } from '../batch/batch-runner.svelte';
import { batchParams } from '../../stores/batch-params';
import {
  multiAnalysisError,
  multiAnalysisResult,
  multiAnalysisState,
  multiCompositePath,
  resetMultiAnalysis,
} from '../../stores/multi-analysis';
import type { AnalysisResult } from '../../stores/analysis';

const stateRuneDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  '$state'
);

const previousResult: AnalysisResult = {
  clusters: [],
  iterations: 1,
  durationMs: 2,
  totalSamples: 3,
  variant: 'previous',
};

function response(variant: string) {
  return {
    clusters: [
      {
        count: 1,
        share: 1,
        centroidSpace: [0.5, 0, 0],
        oklab: [0.5, 0, 0],
        oklch: [0.5, 0, 0],
        rgb: { r: 128, g: 128, b: 128 },
        hsv: [0, 0, 0.5],
      },
    ],
    iterations: 2,
    durationMs: 4,
    totalSamples: 5,
    variant,
  };
}

function seedReadyResult() {
  multiAnalysisResult.set(previousResult);
  multiCompositePath.set('/tmp/batch-grid.png');
  multiAnalysisState.set('ready');
  multiAnalysisError.set(null);
}

describe('Batch reanalysis recovery', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, '$state', {
      configurable: true,
      value: <T>(value: T) => value,
    });
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    resetMultiAnalysis();
    seedReadyResult();
  });

  afterEach(() => {
    resetMultiAnalysis();
    if (stateRuneDescriptor) {
      Object.defineProperty(globalThis, '$state', stateRuneDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, '$state');
    }
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('SWEEP-020 preserves the last result and permits a later parameter retry', async () => {
    mocks.tauriInvoke
      .mockRejectedValueOnce(new Error('refresh failed'))
      .mockResolvedValueOnce(response('recovered'));
    const runner = createBatchRunner();
    const paths = ['/tmp/a.png', '/tmp/b.png'];
    const firstParams = { ...get(batchParams), clusters: 4 };
    const retryParams = { ...firstParams, clusters: 5 };

    runner.scheduleReanalysis(paths, firstParams);
    await vi.advanceTimersByTimeAsync(400);

    expect(get(multiAnalysisState)).toBe('ready');
    expect(get(multiAnalysisResult)).toBe(previousResult);
    expect(get(multiAnalysisError)).toBe('refresh failed');

    runner.scheduleReanalysis(paths, retryParams);
    await vi.advanceTimersByTimeAsync(400);

    expect(mocks.tauriInvoke).toHaveBeenCalledTimes(2);
    expect(get(multiAnalysisState)).toBe('ready');
    expect(get(multiAnalysisResult)?.variant).toBe('recovered');
    expect(get(multiAnalysisError)).toBeNull();
  });

  it('SWEEP-020 explicitly retries the failed parameter set', async () => {
    mocks.tauriInvoke
      .mockRejectedValueOnce(new Error('refresh failed'))
      .mockResolvedValueOnce(response('retried'));
    const runner = createBatchRunner();
    const paths = ['/tmp/a.png', '/tmp/b.png'];
    const params = { ...get(batchParams), clusters: 4 };

    runner.scheduleReanalysis(paths, params);
    await vi.advanceTimersByTimeAsync(400);
    await runner.retryReanalysis(paths, params);

    expect(mocks.tauriInvoke).toHaveBeenCalledTimes(2);
    expect(get(multiAnalysisResult)?.variant).toBe('retried');
    expect(get(multiAnalysisError)).toBeNull();
  });
});
