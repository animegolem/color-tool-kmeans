import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

const mocks = vi.hoisted(() => ({
  analyzeImage: vi.fn(),
}));

vi.mock('../../bridges/fs', () => ({
  getFsBridge: () => ({
    id: 'tauri',
    openMediaFiles: vi.fn(),
  }),
  isVideoFile: () => false,
}));

vi.mock('../../bridges/tauri', () => ({
  isTauriEnv: () => true,
  tauriInvoke: vi.fn(),
  tauriDetectionInfo: () => ({}),
}));

vi.mock('../../bridges/log', () => ({ logEvent: vi.fn() }));

vi.mock('../../compute/bridge', () => ({
  analyzeImage: mocks.analyzeImage,
}));

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: (path: string) => `asset://${path}`,
}));

import type { FileSelection } from '../../bridges/fs';
import type {
  AnalysisResult,
  ImageEntry,
  SelectedImage,
} from '../../stores/ui';
import {
  analysisById,
  analysisError,
  analysisState,
  appendFile,
  clearFile,
  params,
  resetAnalysis,
  selectedFile,
  setAnalysisError,
  setAnalysisPending,
  setAnalysisSuccess,
  setFile,
  updateEntryPreview,
} from '../../stores/ui';
import { createAnalysisRunner } from './analysis-runner.svelte';
import { createFileIngestion } from './file-ingestion.svelte';

const stateRuneDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  '$state'
);

const DATASET = {
  width: 1,
  height: 1,
  pixels: new Uint8Array([1, 2, 3, 255]),
};

function installRuneShims() {
  Object.defineProperty(globalThis, '$state', {
    configurable: true,
    value: <T>(value: T) => value,
  });
}

function restoreRuneDescriptors() {
  if (stateRuneDescriptor) {
    Object.defineProperty(globalThis, '$state', stateRuneDescriptor);
  } else {
    delete (globalThis as { $state?: unknown }).$state;
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function result(variant: string): AnalysisResult {
  return {
    clusters: [],
    iterations: 4,
    durationMs: 1,
    totalSamples: 1,
    variant,
  };
}

function entry(): ImageEntry {
  return {
    id: 'retained-image-id',
    name: 'same.png',
    path: '/tmp/same.png',
    size: 4,
    source: { kind: 'path', path: '/tmp/same.png' },
    previewUrl: 'asset:///tmp/same.png',
  };
}

function selection(): FileSelection {
  return {
    name: 'same.png',
    path: '/tmp/same.png',
    size: 4,
    blob: new Blob([]),
    mimeType: 'image/png',
  };
}

function runner() {
  return createAnalysisRunner({
    setAnalysisPending,
    setAnalysisSuccess,
    setAnalysisError,
    recordDevEvent: vi.fn(),
  });
}

function ingestion(activeRunner: ReturnType<typeof runner>) {
  return createFileIngestion({
    setFile,
    appendFile,
    setAnalysisError,
    cancelPending: activeRunner.cancelPending,
    scheduleAnalysisWith: activeRunner.scheduleAnalysisWith,
    recordDevEvent: vi.fn(),
    setBannerMessage: vi.fn(),
    getParams: () => get(params),
    getStatus: () => get(analysisState),
    clearVideoSelection: vi.fn(),
    loadVideoSelection: vi.fn(),
    openLibraryDrawer: vi.fn(),
    updateEntryPreview,
  });
}

function seedReady(resultValue: AnalysisResult): SelectedImage {
  const initial = entry();
  setFile(initial, DATASET);
  setAnalysisSuccess(resultValue, initial.id);
  return get(selectedFile)!;
}

describe('analysis runner content revision integration', () => {
  beforeEach(() => {
    installRuneShims();
    vi.useFakeTimers();
    mocks.analyzeImage.mockReset();
    clearFile();
    resetAnalysis();
  });

  afterEach(() => {
    clearFile();
    resetAnalysis();
    vi.useRealTimers();
    restoreRuneDescriptors();
  });

  it('SWEEP-181: runs an ingested same-path revision once across explicit and reactive-equivalent schedules', async () => {
    const initialResult = result('initial-a');
    const replacementResult = result('replacement-b');
    const first = seedReady(initialResult);
    const firstRevision = first.contentRevision!;
    const activeRunner = runner();
    activeRunner.seedLastRequestKey(first, get(params));
    mocks.analyzeImage.mockResolvedValue(replacementResult);

    await ingestion(activeRunner).ingestSelection(selection());
    const replacement = get(selectedFile)!;

    expect(replacement.id).toBe(first.id);
    expect(replacement.contentRevision).toBeGreaterThan(firstRevision);
    expect(get(analysisById)[first.id]).toBeUndefined();

    // This is the direct equivalent of Home's selectedFile reactive effect;
    // the ingestion call above already performed the explicit schedule.
    activeRunner.scheduleAnalysisWith(
      replacement,
      get(params),
      get(analysisState)
    );

    await vi.advanceTimersByTimeAsync(399);
    expect(mocks.analyzeImage).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect(mocks.analyzeImage).toHaveBeenCalledOnce();
    expect(get(analysisById)[first.id]).toEqual(replacementResult);
    expect(get(analysisState)).toBe('ready');
  });

  it.each([
    { label: 'success', rejects: false },
    { label: 'error', rejects: true },
  ])(
    'SWEEP-181: stale $label completion cannot replace a newer ingested revision',
    async ({ rejects }) => {
      const staleRequest = deferred<AnalysisResult>();
      const staleResult = result('stale-a');
      const replacementResult = result('replacement-b');
      const first = seedReady(result('cached-a'));
      const activeRunner = runner();
      mocks.analyzeImage
        .mockReturnValueOnce(staleRequest.promise)
        .mockResolvedValueOnce(replacementResult);

      activeRunner.scheduleAnalysisWith(first, get(params), 'idle');
      await vi.advanceTimersByTimeAsync(400);
      expect(get(analysisState)).toBe('pending');

      await ingestion(activeRunner).ingestSelection(selection());
      const replacement = get(selectedFile)!;
      await vi.advanceTimersByTimeAsync(400);

      expect(get(analysisById)[replacement.id]).toEqual(replacementResult);
      if (rejects) staleRequest.reject(new Error('stale failure'));
      else staleRequest.resolve(staleResult);
      await vi.advanceTimersByTimeAsync(0);

      expect(get(analysisById)[replacement.id]).toEqual(replacementResult);
      expect(get(analysisState)).toBe('ready');
      expect(get(analysisError)).toBeNull();
    }
  );

  it('SWEEP-181: remount seed deduplicates its stored revision but not a new admission', async () => {
    const cachedResult = result('cached-a');
    const replacementResult = result('replacement-b');
    const first = seedReady(cachedResult);
    const activeRunner = runner();
    activeRunner.seedLastRequestKey(first, get(params));
    mocks.analyzeImage.mockResolvedValue(replacementResult);

    activeRunner.scheduleAnalysisWith(first, get(params), 'ready');
    await vi.advanceTimersByTimeAsync(400);

    expect(mocks.analyzeImage).not.toHaveBeenCalled();
    expect(get(analysisById)[first.id]).toEqual(cachedResult);

    const replacementEntry = entry();
    setFile(replacementEntry, DATASET);
    const replacement = get(selectedFile)!;
    expect(replacement.contentRevision).toBeGreaterThan(first.contentRevision!);

    activeRunner.scheduleAnalysisWith(
      replacement,
      get(params),
      get(analysisState)
    );
    await vi.advanceTimersByTimeAsync(399);
    expect(mocks.analyzeImage).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect(mocks.analyzeImage).toHaveBeenCalledOnce();
    expect(get(analysisById)[first.id]).toEqual(replacementResult);
  });
});
