import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

const mocks = vi.hoisted(() => ({
  composeGrid: vi.fn(),
  tauriInvoke: vi.fn(),
}));

vi.mock('../../bridges/compose', () => ({
  composeGrid: mocks.composeGrid,
}));

vi.mock('../../bridges/tauri', () => ({
  isTauriEnv: () => false,
  tauriInvoke: mocks.tauriInvoke,
}));

vi.mock('../../bridges/log', () => ({ logEvent: vi.fn() }));

import { params, type AnalysisParams } from '../../stores/analysis';
import {
  appendFile,
  clearFile,
  setFile,
  type ImageEntry,
} from '../../stores/image';
import {
  clearPins,
  multiAnalysisResult,
  multiAnalysisState,
  pinnedImages,
  resetMultiAnalysis,
  togglePin,
} from '../../stores/multi-analysis';
import { createBatchRunner } from './batch-runner.svelte';

const stateRuneDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  '$state'
);
const emptyDataset = { width: 0, height: 0, pixels: new Uint8Array(0) };

function installRuneShim() {
  Object.defineProperty(globalThis, '$state', {
    configurable: true,
    value: <T>(value: T) => value,
  });
}

function restoreRuneShim() {
  if (stateRuneDescriptor) {
    Object.defineProperty(globalThis, '$state', stateRuneDescriptor);
  } else {
    delete (globalThis as { $state?: unknown }).$state;
  }
}

function imageEntry(id: string): ImageEntry {
  return {
    id,
    name: `${id}.png`,
    path: `/tmp/${id}.png`,
    size: 0,
    source: { kind: 'path', path: `/tmp/${id}.png` },
    previewUrl: `asset:///tmp/${id}.png`,
  };
}

function nativeResult(variant: string) {
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
    iterations: 1,
    durationMs: 1,
    totalSamples: 1,
    variant,
  };
}

function pinnedPaths() {
  return get(pinnedImages)
    .filter((entry) => !!entry.path)
    .map((entry) => entry.path!);
}

describe('Batch runner revision lifecycle', () => {
  beforeEach(() => {
    installRuneShim();
    vi.clearAllMocks();
    clearPins();
    clearFile();
    resetMultiAnalysis();
    mocks.composeGrid
      .mockResolvedValueOnce({
        path: '/tmp/composite-first.png',
        width: 2,
        height: 1,
        gridCols: 2,
        gridRows: 1,
      })
      .mockResolvedValueOnce({
        path: '/tmp/composite-second.png',
        width: 2,
        height: 1,
        gridCols: 2,
        gridRows: 1,
      });
    mocks.tauriInvoke
      .mockResolvedValueOnce(nativeResult('first'))
      .mockResolvedValueOnce(nativeResult('second'));
  });

  afterEach(() => {
    clearPins();
    clearFile();
    resetMultiAnalysis();
    restoreRuneShim();
    vi.restoreAllMocks();
  });

  it('SWEEP-017: explicit Analyze recomposes after pinned content replacement', async () => {
    const first = imageEntry('first');
    const second = imageEntry('second');
    setFile(first, emptyDataset);
    appendFile(second, emptyDataset);
    togglePin(first.id);
    togglePin(second.id);
    const runner = createBatchRunner();
    const analysisParams = get(params) satisfies AnalysisParams;

    await runner.analyze(pinnedPaths(), analysisParams);
    const firstResult = get(multiAnalysisResult);
    expect(firstResult?.variant).toBe('first');
    expect(get(multiAnalysisState)).toBe('ready');

    setFile(first, { ...emptyDataset, width: 2 });

    expect(get(multiAnalysisState)).toBe('idle');
    expect(get(multiAnalysisResult)).toBeNull();
    expect(mocks.composeGrid).toHaveBeenCalledTimes(1);
    expect(mocks.tauriInvoke).toHaveBeenCalledTimes(1);

    await runner.analyze(pinnedPaths(), analysisParams);
    const secondResult = get(multiAnalysisResult);

    expect(mocks.composeGrid).toHaveBeenCalledTimes(2);
    expect(mocks.tauriInvoke).toHaveBeenCalledTimes(2);
    expect(secondResult).not.toBe(firstResult);
    expect(secondResult?.variant).toBe('second');
    expect(get(multiAnalysisState)).toBe('ready');
  });
});
