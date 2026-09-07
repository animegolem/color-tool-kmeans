import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

const mocks = vi.hoisted(() => ({
  extractVideoFrame: vi.fn(),
  extractVideoStrip: vi.fn(),
  probeVideo: vi.fn(),
  logEvent: vi.fn(),
  analyzeImage: vi.fn(),
  requestValueAnalysis: vi.fn(),
}));

vi.mock('../../bridges/video', () => ({
  extractVideoFrame: mocks.extractVideoFrame,
  extractVideoStrip: mocks.extractVideoStrip,
  probeVideo: mocks.probeVideo,
}));

vi.mock('../../bridges/fs', () => ({
  getFsBridge: () => ({
    id: 'tauri',
    openMediaFiles: vi.fn(),
  }),
  isVideoFile: (selection: { name?: string; mimeType?: string }) =>
    selection.mimeType?.startsWith('video/') ||
    /\.(mp4|mov|webm)$/i.test(selection.name ?? ''),
  inferMimeType: (name: string) =>
    /\.(mp4|mov|webm)$/i.test(name) ? 'video/mp4' : 'image/png',
}));

vi.mock('../../bridges/tauri', () => ({
  isTauriEnv: () => true,
  tauriInvoke: vi.fn(),
  tauriDetectionInfo: () => ({}),
}));

vi.mock('../../bridges/log', () => ({ logEvent: mocks.logEvent }));

vi.mock('../../bridges/value-analysis', () => ({
  requestValueAnalysis: mocks.requestValueAnalysis,
}));

vi.mock('../../compute/bridge', () => ({
  analyzeImage: mocks.analyzeImage,
}));

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: (path: string) => `asset://${path}`,
}));

import {
  createVideoController,
  subscribeToVideoStripMode,
} from '../home/video-controller.svelte';
import { createAnalysisRunner } from '../home/analysis-runner.svelte';
import { createColorsExportRunner } from '../exports/colors-export-runner.svelte';
import { createValuesFileIngestion } from '../values/file-ingestion-values.svelte';
import { createValueAnalysisRunner } from '../values/value-analysis-runner.svelte';
import { createVideoScrubber } from '../values/video-scrubber.svelte';
import {
  clearFile,
  appendFile,
  beginSelection,
  analysisById,
  analysisState,
  cacheVideoState,
  images,
  isCurrentSelection,
  params,
  removeFile,
  resetAnalysis,
  selectedFile,
  setAnalysisError,
  setAnalysisPending,
  setAnalysisSuccess,
  setFile,
  switchToFile,
  valueAnalysisByKey,
  valueAnalysisErrorByKey,
  valueAnalysisResult,
  valueAnalysisStateByKey,
  videoState,
  videoStripMode,
} from '../../stores/ui';
import {
  setValueAnalysisSuccess,
  valueAnalysisKey,
} from '../../stores/value-analysis';
import { getActivePath, setActivePath } from '../../services/active-image';
import type {
  AnalysisResult,
  ExportChecks,
  ImageEntry,
  SelectedImage,
  ValueAnalysisResult,
} from '../../stores/ui';

const stateRuneDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  '$state'
);
const derivedRuneDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  '$derived'
);

function installRuneShims() {
  const derived = Object.assign(<T>(value: T) => value, {
    by: <T>(fn: () => T) => fn(),
  });
  Object.defineProperty(globalThis, '$state', {
    configurable: true,
    value: <T>(value: T) => value,
  });
  Object.defineProperty(globalThis, '$derived', {
    configurable: true,
    value: derived,
  });
}

function restoreRuneDescriptors() {
  if (stateRuneDescriptor) {
    Object.defineProperty(globalThis, '$state', stateRuneDescriptor);
  }
  if (derivedRuneDescriptor) {
    Object.defineProperty(globalThis, '$derived', derivedRuneDescriptor);
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

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

const emptyDataset = { width: 0, height: 0, pixels: new Uint8Array(0) };

function imageEntry(overrides: Partial<ImageEntry> = {}): ImageEntry {
  return {
    id: 'image-1',
    name: 'image.png',
    path: '/tmp/image.png',
    size: 0,
    source: { kind: 'path', path: '/tmp/image.png' },
    previewUrl: 'asset:///tmp/image.png',
    ...overrides,
  };
}

function valueResult(): ValueAnalysisResult {
  return {
    neutral: '/tmp/neutral.png',
    neutralWidth: 1,
    neutralHeight: 1,
    preview: '/tmp/preview.png',
    previewWidth: 1,
    previewHeight: 1,
    bucketMap: '/tmp/bucket.png',
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
}

function auditVideoController(
  overrides: Partial<Parameters<typeof createVideoController>[0]> = {}
) {
  return createVideoController({
    isNativeModeActive: () => true,
    buildPreviewUrl: () => 'asset:///tmp/a.mp4',
    maxDimensionForQuality: () => 1200,
    setFile: vi.fn(() => true),
    setVideoState: vi.fn(),
    clearFile: vi.fn(),
    getQuality: () => 2,
    setBannerMessage: vi.fn(),
    scheduleAnalysisWith: vi.fn(),
    getCurrentParams: () => ({}),
    cancelPending: vi.fn(),
    clearLastRequestKey: vi.fn(),
    captureAnalysisScroll: vi.fn(),
    getVideoStripMode: () => 'filmstrip',
    getCachedVideoState: () => ({
      duration: 10,
      fps: 24,
      currentTime: 0,
      stripPath: null,
      stripId: null,
      posterPath: null,
      frameId: 'frame-1',
    }),
    cacheVideoState: vi.fn(),
    findExistingFrameId: () => 'frame-1',
    beginSelection,
    isCurrentSelection,
    ...overrides,
  });
}

function videoSelection() {
  return {
    name: 'a.mp4',
    path: '/tmp/a.mp4',
    size: 0,
    blob: new Blob([]),
    mimeType: 'video/mp4',
  };
}

function colorResult(): AnalysisResult {
  return {
    clusters: [],
    iterations: 1,
    durationMs: 1,
    totalSamples: 1,
    variant: 'audit',
  };
}

function colorsRunner() {
  installRuneShims();
  return createAnalysisRunner({
    setAnalysisPending,
    setAnalysisSuccess,
    setAnalysisError,
    recordDevEvent: vi.fn(),
  });
}

function valuesRunner() {
  installRuneShims();
  return createValueAnalysisRunner();
}

describe('audit reproductions for async control-flow invariants', () => {
  beforeEach(() => {
    Object.assign(globalThis, {
      $state: <T>(initial: T) => initial,
      $derived: <T>(initial: T) => initial,
    });
    vi.useFakeTimers();
    vi.clearAllMocks();
    clearFile();
    videoState.set(null);
    valueAnalysisByKey.set({});
    valueAnalysisStateByKey.set({});
    valueAnalysisErrorByKey.set({});
    resetAnalysis();
  });

  afterEach(() => {
    clearFile();
    videoState.set(null);
    valueAnalysisByKey.set({});
    valueAnalysisStateByKey.set({});
    valueAnalysisErrorByKey.set({});
    resetAnalysis();
    restoreRuneDescriptors();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('AUD-001: discards a Values frame completion after switching to another video', async () => {
    const firstFrame = deferred<{ path: string; timestampUsed: string }>();
    mocks.extractVideoFrame.mockReturnValueOnce(firstFrame.promise);
    const onFrameExtracted = vi.fn(() => true);
    const scrubber = createVideoScrubber({
      getMaxDimension: () => 1200,
      onFrameExtracted,
      updateVideoState: vi.fn(),
      isCurrentSelection,
    });

    scrubber.syncFromVideoState({
      selection: beginSelection('video-a'),
      path: '/tmp/a.mp4',
      name: 'a.mp4',
      duration: 10,
      fps: 24,
      currentTime: 1,
    });
    scrubber.scheduleFrameExtract();
    await vi.advanceTimersByTimeAsync(250);

    scrubber.syncFromVideoState({
      selection: beginSelection('video-b'),
      path: '/tmp/b.mp4',
      name: 'b.mp4',
      duration: 20,
      fps: 24,
      currentTime: 2,
    });
    firstFrame.resolve({ path: '/cache/a-frame.png', timestampUsed: '1.000' });
    await vi.runAllTimersAsync();

    expect(onFrameExtracted).not.toHaveBeenCalled();
  });

  it('AUD-002: keeps the newest Values probe result when video probes resolve out of order', async () => {
    const probeA = deferred<{ duration: number; fps: number }>();
    const probeB = deferred<{ duration: number; fps: number }>();
    mocks.probeVideo.mockImplementation((path: string) =>
      path === '/tmp/a.mp4' ? probeA.promise : probeB.promise
    );
    const ingestion = createValuesFileIngestion({ cancelPending: vi.fn() });

    ingestion.handleVideoFile('/tmp/a.mp4', 'a.mp4');
    ingestion.handleVideoFile('/tmp/b.mp4', 'b.mp4');
    probeB.resolve({ duration: 20, fps: 24 });
    await vi.runAllTimersAsync();
    probeA.resolve({ duration: 10, fps: 24 });
    await vi.runAllTimersAsync();

    expect(get(videoState)?.path).toBe('/tmp/b.mp4');
  });

  it('AI-IMP-192: Home rejects an old probe after leaving and returning to the same path', async () => {
    const firstProbe = deferred<{ duration: number; fps: number }>();
    const secondProbe = deferred<{ duration: number; fps: number }>();
    mocks.probeVideo
      .mockReturnValueOnce(firstProbe.promise)
      .mockReturnValueOnce(secondProbe.promise);
    mocks.extractVideoFrame.mockReturnValue(new Promise(() => undefined));
    mocks.extractVideoStrip.mockReturnValue(new Promise(() => undefined));
    const controller = auditVideoController({
      getCachedVideoState: () => null,
    });

    controller.loadVideoSelection(videoSelection());
    const firstSelection = controller.selection!;
    beginSelection('intervening-still');
    controller.loadVideoSelection(videoSelection());
    const secondSelection = controller.selection!;
    firstProbe.resolve({ duration: 99, fps: 99 });
    await Promise.resolve();
    secondProbe.resolve({ duration: 12, fps: 25 });
    await Promise.resolve();
    await Promise.resolve();

    expect(secondSelection.epoch).toBeGreaterThan(firstSelection.epoch);
    await vi.waitFor(() => expect(controller.videoDuration).toBe(12));
    expect(controller.videoFps).toBe(25);
  });

  it('AI-IMP-192: a canonical still switch blocks Home frame publication and cancellation', async () => {
    const frame = deferred<{ path: string; timestampUsed: string }>();
    mocks.extractVideoFrame.mockReturnValue(frame.promise);
    const setFileForFrame = vi.fn(() => true);
    const cancelPending = vi.fn();
    setFile(imageEntry({ id: 'still-b' }), emptyDataset);
    const controller = auditVideoController({
      setFile: setFileForFrame,
      cancelPending,
    });
    controller.loadVideoSelection(videoSelection());
    await vi.advanceTimersByTimeAsync(250);

    switchToFile('still-b');
    controller.handleVideoStateChange(null);
    frame.resolve({ path: '/cache/stale-a.png', timestampUsed: '0.000' });
    await vi.runAllTimersAsync();

    expect(setFileForFrame).not.toHaveBeenCalled();
    expect(cancelPending).not.toHaveBeenCalled();
    expect(get(selectedFile)?.id).toBe('still-b');
    expect(controller.frameDecoding).toBe(false);
  });

  it('AI-IMP-192: epoch-only revocation blocks an old Home frame while the current owner stays pending and succeeds', async () => {
    const staleFrame = deferred<{ path: string; timestampUsed: string }>();
    const currentFrame = deferred<{ path: string; timestampUsed: string }>();
    mocks.extractVideoFrame.mockReset();
    mocks.extractVideoFrame
      .mockReturnValueOnce(staleFrame.promise)
      .mockReturnValueOnce(currentFrame.promise);
    const staleSetFile = vi.fn(() => true);
    const staleCancel = vi.fn();
    const staleClearKey = vi.fn();
    const staleSchedule = vi.fn();
    const staleState = vi.fn();
    const staleCache = vi.fn();
    const staleController = auditVideoController({
      setFile: staleSetFile,
      cancelPending: staleCancel,
      clearLastRequestKey: staleClearKey,
      scheduleAnalysisWith: staleSchedule,
      setVideoState: staleState,
      cacheVideoState: staleCache,
    });
    setActivePath('/tmp/original.png');
    staleController.loadVideoSelection(videoSelection());
    await vi.advanceTimersByTimeAsync(250);
    const staleStateCalls = staleState.mock.calls.length;
    const staleCacheCalls = staleCache.mock.calls.length;

    const currentSetFile = vi.fn(() => true);
    const currentCancel = vi.fn();
    const currentSchedule = vi.fn();
    const currentState = vi.fn();
    const currentCache = vi.fn();
    const currentController = auditVideoController({
      setFile: currentSetFile,
      cancelPending: currentCancel,
      scheduleAnalysisWith: currentSchedule,
      setVideoState: currentState,
      cacheVideoState: currentCache,
    });
    currentController.loadVideoSelection(videoSelection());
    await vi.advanceTimersByTimeAsync(250);
    expect(staleController.videoSelection?.path).toBe('/tmp/a.mp4');
    expect(currentController.videoSelection?.path).toBe('/tmp/a.mp4');
    expect(currentController.frameDecoding).toBe(true);

    staleFrame.resolve({
      path: '/cache/stale-epoch-frame.png',
      timestampUsed: '0.000',
    });
    await flushMicrotasks();

    expect(staleSetFile).not.toHaveBeenCalled();
    expect(staleCancel).not.toHaveBeenCalled();
    expect(staleClearKey).not.toHaveBeenCalled();
    expect(staleSchedule).not.toHaveBeenCalled();
    expect(staleState).toHaveBeenCalledTimes(staleStateCalls);
    expect(staleCache).toHaveBeenCalledTimes(staleCacheCalls);
    expect(getActivePath()).toBe('/tmp/original.png');
    expect(currentController.frameDecoding).toBe(true);
    expect(currentSetFile).not.toHaveBeenCalled();

    currentFrame.resolve({
      path: '/cache/current-epoch-frame.png',
      timestampUsed: '0.000',
    });
    await vi.waitFor(() => expect(currentController.frameDecoding).toBe(false));

    expect(currentSetFile).toHaveBeenCalledOnce();
    expect(currentCancel).toHaveBeenCalledOnce();
    expect(currentSchedule).toHaveBeenCalledOnce();
    expect(currentState).toHaveBeenCalledTimes(2);
    expect(currentCache).toHaveBeenCalledOnce();
    expect(getActivePath()).toBe('/cache/current-epoch-frame.png');
  });

  it('AI-IMP-192: stale Home frame rejection is silent and cannot clear a newer rejecting owner', async () => {
    const staleFrame = deferred<{ path: string; timestampUsed: string }>();
    const currentFrame = deferred<{ path: string; timestampUsed: string }>();
    mocks.extractVideoFrame.mockReset();
    mocks.extractVideoFrame
      .mockReturnValueOnce(staleFrame.promise)
      .mockReturnValueOnce(currentFrame.promise);
    const decodeError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const staleBanner = vi.fn();
    const staleSetFile = vi.fn(() => true);
    const staleCancel = vi.fn();
    const staleState = vi.fn();
    const staleCache = vi.fn();
    const staleController = auditVideoController({
      setFile: staleSetFile,
      cancelPending: staleCancel,
      setBannerMessage: staleBanner,
      setVideoState: staleState,
      cacheVideoState: staleCache,
    });
    staleController.loadVideoSelection(videoSelection());
    await vi.advanceTimersByTimeAsync(250);
    const staleStateCalls = staleState.mock.calls.length;
    const staleCacheCalls = staleCache.mock.calls.length;

    const currentBanner = vi.fn();
    const currentSetFile = vi.fn(() => true);
    const currentCancel = vi.fn();
    const currentState = vi.fn();
    const currentCache = vi.fn();
    const currentController = auditVideoController({
      setFile: currentSetFile,
      cancelPending: currentCancel,
      setBannerMessage: currentBanner,
      setVideoState: currentState,
      cacheVideoState: currentCache,
    });
    currentController.loadVideoSelection(videoSelection());
    await vi.advanceTimersByTimeAsync(250);

    staleFrame.reject(new Error('stale frame failure'));
    await flushMicrotasks();

    expect(decodeError).not.toHaveBeenCalled();
    expect(staleBanner).not.toHaveBeenCalled();
    expect(staleSetFile).not.toHaveBeenCalled();
    expect(staleCancel).not.toHaveBeenCalled();
    expect(staleState).toHaveBeenCalledTimes(staleStateCalls);
    expect(staleCache).toHaveBeenCalledTimes(staleCacheCalls);
    expect(currentController.frameDecoding).toBe(true);

    const currentFailure = new Error('current frame failure');
    currentFrame.reject(currentFailure);
    await vi.waitFor(() => expect(currentController.frameDecoding).toBe(false));

    expect(decodeError).toHaveBeenCalledOnce();
    expect(decodeError).toHaveBeenCalledWith(
      '[home] Video frame decode failed',
      currentFailure
    );
    expect(currentBanner).toHaveBeenCalledWith(
      'Failed to decode video frame. Please try another file.'
    );
    expect(currentSetFile).not.toHaveBeenCalled();
    expect(currentCancel).not.toHaveBeenCalled();
    expect(currentState).toHaveBeenCalledOnce();
    expect(currentCache).not.toHaveBeenCalled();
  });

  it.each([
    { label: 'success', rejects: false },
    { label: 'rejection', rejects: true },
  ])(
    'AI-IMP-192: epoch-only stale strip $label cannot publish or clear the current owner',
    async ({ rejects }) => {
      const staleStrip = deferred<{ path: string }>();
      const currentStrip = deferred<{ path: string }>();
      mocks.extractVideoStrip.mockReset();
      mocks.extractVideoStrip
        .mockReturnValueOnce(staleStrip.promise)
        .mockReturnValueOnce(currentStrip.promise);
      mocks.extractVideoFrame.mockReset();
      mocks.extractVideoFrame.mockReturnValue(new Promise(() => undefined));
      const staleState = vi.fn();
      const staleCache = vi.fn();
      const staleSchedule = vi.fn();
      const staleController = auditVideoController({
        setVideoState: staleState,
        cacheVideoState: staleCache,
        scheduleAnalysisWith: staleSchedule,
      });
      staleController.loadVideoSelection(videoSelection());
      staleController.regenerateStrip();
      const staleStateCalls = staleState.mock.calls.length;
      const staleCacheCalls = staleCache.mock.calls.length;

      const currentState = vi.fn();
      const currentCache = vi.fn();
      const currentSchedule = vi.fn();
      const currentController = auditVideoController({
        setVideoState: currentState,
        cacheVideoState: currentCache,
        scheduleAnalysisWith: currentSchedule,
      });
      currentController.loadVideoSelection(videoSelection());
      currentController.regenerateStrip();
      const currentStateCalls = currentState.mock.calls.length;
      const currentCacheCalls = currentCache.mock.calls.length;
      const stripErrorsBefore = mocks.logEvent.mock.calls.filter(([message]) =>
        String(message).startsWith('video:strip:error')
      ).length;
      expect(currentController.videoStripPending).toBe(true);

      if (rejects) staleStrip.reject(new Error('stale strip failure'));
      else staleStrip.resolve({ path: '/cache/stale-strip.png' });
      await flushMicrotasks();

      expect(staleController.videoStripUrl).toBeNull();
      expect(staleState).toHaveBeenCalledTimes(staleStateCalls);
      expect(staleCache).toHaveBeenCalledTimes(staleCacheCalls);
      expect(staleSchedule).not.toHaveBeenCalled();
      expect(currentController.videoStripPending).toBe(true);
      expect(currentState).toHaveBeenCalledTimes(currentStateCalls);
      expect(currentCache).toHaveBeenCalledTimes(currentCacheCalls);
      expect(
        mocks.logEvent.mock.calls.filter(([message]) =>
          String(message).startsWith('video:strip:error')
        )
      ).toHaveLength(stripErrorsBefore);

      if (rejects) currentStrip.reject(new Error('current strip failure'));
      else currentStrip.resolve({ path: '/cache/current-strip.png' });
      await vi.waitFor(() =>
        expect(currentController.videoStripPending).toBe(false)
      );

      if (rejects) {
        expect(currentController.videoStripUrl).toBeNull();
        expect(currentState).toHaveBeenCalledTimes(currentStateCalls);
        expect(currentCache).toHaveBeenCalledTimes(currentCacheCalls);
        expect(
          mocks.logEvent.mock.calls.filter(([message]) =>
            String(message).startsWith('video:strip:error')
          )
        ).toHaveLength(stripErrorsBefore + 1);
      } else {
        expect(currentController.videoStripUrl).toMatch(
          /^asset:\/\/\/cache\/current-strip\.png\?t=\d+$/
        );
        expect(currentState).toHaveBeenCalledTimes(currentStateCalls + 1);
        expect(currentCache).toHaveBeenCalledTimes(currentCacheCalls + 1);
      }
      expect(currentSchedule).not.toHaveBeenCalled();
    }
  );

  it('AI-IMP-192: current Home probe rejection owns its error and finally clears pending', async () => {
    const probe = deferred<{ duration: number; fps: number }>();
    mocks.probeVideo.mockReset();
    mocks.probeVideo.mockReturnValue(probe.promise);
    const state = vi.fn();
    const cache = vi.fn();
    const controller = auditVideoController({
      getCachedVideoState: () => null,
      setVideoState: state,
      cacheVideoState: cache,
    });
    controller.loadVideoSelection(videoSelection());
    const selection = controller.selection!;
    expect(controller.videoProbePending).toBe(true);

    probe.reject(new Error('current probe failure'));
    await vi.waitFor(() => expect(controller.videoProbePending).toBe(false));

    expect(isCurrentSelection(selection)).toBe(true);
    expect(state).toHaveBeenCalledOnce();
    expect(cache).not.toHaveBeenCalled();
    expect(
      mocks.logEvent.mock.calls.filter(([message]) =>
        String(message).startsWith('video:probe:error')
      )
    ).toHaveLength(1);
  });

  it('AUD-008: preserves cached strip metadata when Values activates a cached video', () => {
    cacheVideoState('/tmp/a.mp4', {
      duration: 10,
      fps: 24,
      currentTime: 2,
      stripPath: '/cache/a-strip.png',
      stripId: 'strip-a',
      posterPath: '/cache/a-frame.png',
      frameId: 'frame-a',
    });
    const ingestion = createValuesFileIngestion({ cancelPending: vi.fn() });

    ingestion.handleVideoFile('/tmp/a.mp4', 'a.mp4');

    expect(get(videoState)?.stripPath).toBe('/cache/a-strip.png');
    expect((get(videoState) as { stripId?: string } | null)?.stripId).toBe(
      'strip-a'
    );
  });

  it('AUD-007: serializes Home frame decodes that share a logical frame ID', async () => {
    const firstFrame = deferred<{ path: string; timestampUsed: string }>();
    const setFileForFrame = vi.fn(() => true);
    const cancelPending = vi.fn();
    mocks.extractVideoFrame
      .mockReturnValueOnce(firstFrame.promise)
      .mockResolvedValueOnce({
        path: '/cache/current-frame.png',
        timestampUsed: '0.042',
      });
    const controller = auditVideoController({
      setFile: setFileForFrame,
      cancelPending,
    });

    controller.loadVideoSelection(videoSelection());
    await vi.advanceTimersByTimeAsync(250);
    controller.stepVideoFrames(1);
    await vi.advanceTimersByTimeAsync(250);

    expect(mocks.extractVideoFrame).toHaveBeenCalledTimes(1);
    firstFrame.resolve({
      path: '/cache/stale-frame.png',
      timestampUsed: '0.000',
    });
    await vi.runAllTimersAsync();

    expect(mocks.extractVideoFrame).toHaveBeenCalledTimes(2);
    expect(setFileForFrame).toHaveBeenCalledTimes(1);
    expect(cancelPending).toHaveBeenCalledTimes(1);
    expect(cancelPending.mock.invocationCallOrder[0]).toBeLessThan(
      setFileForFrame.mock.invocationCallOrder[0]
    );
    expect(setFileForFrame).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'frame-1',
        path: '/cache/current-frame.png',
        frameTimestamp: 1 / 24,
      }),
      emptyDataset,
      { selection: expect.any(Object) }
    );
  });

  it('AUD-004: rejects a stale Home completion after video frame replacement', async () => {
    const staleAnalysis = deferred<AnalysisResult>();
    mocks.analyzeImage
      .mockReturnValueOnce(staleAnalysis.promise)
      .mockResolvedValueOnce(colorResult());
    mocks.extractVideoFrame.mockResolvedValueOnce({
      path: '/cache/replacement-frame.png',
      timestampUsed: '0.000',
    });
    const runner = colorsRunner();
    const first = {
      ...imageEntry({
        id: 'frame-1',
        name: 'a.mp4',
        path: '/cache/old-frame.png',
        videoPath: '/tmp/a.mp4',
        frameTimestamp: 0,
      }),
      dataset: emptyDataset,
    } satisfies SelectedImage;
    setFile(first, emptyDataset);
    runner.scheduleAnalysisWith(first, get(params), 'idle');
    await vi.advanceTimersByTimeAsync(400);
    expect(get(analysisState)).toBe('pending');

    const controller = auditVideoController({
      setFile,
      cancelPending: runner.cancelPending,
      clearLastRequestKey: runner.clearLastRequestKey,
      scheduleAnalysisWith: (file, currentParams) =>
        runner.scheduleAnalysisWith(file, currentParams, get(analysisState)),
      getCurrentParams: () => get(params),
    });
    controller.loadVideoSelection(videoSelection());
    await vi.advanceTimersByTimeAsync(250);

    staleAnalysis.resolve(colorResult());
    await vi.advanceTimersByTimeAsync(0);

    expect(get(analysisById)['frame-1']).toBeUndefined();
    expect(get(analysisState)).toBe('idle');

    await vi.advanceTimersByTimeAsync(400);
    expect(mocks.analyzeImage).toHaveBeenCalledTimes(2);
    expect(get(analysisState)).toBe('ready');
  });

  it('AUD-009: starts a replacement strip request when the strip mode changes in flight', () => {
    const strip = deferred<{ path: string }>();
    mocks.extractVideoStrip.mockReturnValue(strip.promise);
    const controller = auditVideoController();

    controller.loadVideoSelection(videoSelection());
    controller.regenerateStrip();
    controller.regenerateStrip();

    expect(mocks.extractVideoStrip).toHaveBeenCalledTimes(2);
  });

  it('AUD-009: regenerates the current strip on Home remount', () => {
    mocks.extractVideoStrip.mockReturnValue(
      deferred<{ path: string }>().promise
    );
    const controller = auditVideoController({
      getCachedVideoState: () => ({
        duration: 10,
        fps: 24,
        currentTime: 0,
        stripPath: '/cache/old-strip.png',
        stripId: 'old-strip',
        posterPath: null,
        frameId: 'frame-1',
      }),
    });
    controller.loadVideoSelection(videoSelection());

    const unsubscribe = subscribeToVideoStripMode(
      videoStripMode,
      controller.regenerateStrip
    );

    expect(mocks.extractVideoStrip).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('AUD-003 clears a canceled Values request out of the pending state', async () => {
    const request = deferred<ValueAnalysisResult>();
    mocks.requestValueAnalysis.mockReturnValueOnce(request.promise);
    const runner = valuesRunner();
    const file = {
      ...imageEntry(),
      dataset: emptyDataset,
    } satisfies SelectedImage;
    const pending = runner.ensureAnalysis(file, 3, false);
    expect(
      get(valueAnalysisStateByKey)[valueAnalysisKey(file.id, 3, false)]
    ).toBe('pending');

    runner.cancelPending();
    request.resolve(valueResult());
    await pending;

    expect(
      get(valueAnalysisStateByKey)[valueAnalysisKey(file.id, 3, false)]
    ).toBeUndefined();
  });

  it('AUD-003 preserves a newer Values request when an older runner cancels', async () => {
    const requestA = deferred<ValueAnalysisResult>();
    const requestB = deferred<ValueAnalysisResult>();
    mocks.requestValueAnalysis
      .mockReturnValueOnce(requestA.promise)
      .mockReturnValueOnce(requestB.promise);
    const runnerA = valuesRunner();
    const runnerB = valuesRunner();
    const file = {
      ...imageEntry(),
      dataset: emptyDataset,
    } satisfies SelectedImage;
    const pendingA = runnerA.ensureAnalysis(file, 3, false);
    const pendingB = runnerB.ensureAnalysis(file, 3, false);

    runnerA.cancelPending();

    expect(
      get(valueAnalysisStateByKey)[valueAnalysisKey(file.id, 3, false)]
    ).toBe('pending');
    requestA.resolve(valueResult());
    requestB.resolve(valueResult());
    await Promise.all([pendingA, pendingB]);
    expect(
      get(valueAnalysisStateByKey)[valueAnalysisKey(file.id, 3, false)]
    ).toBe('ready');
  });

  it('AUD-003 clears a canceled Colors request out of the global pending state', async () => {
    const request = deferred<AnalysisResult>();
    mocks.analyzeImage.mockReturnValueOnce(request.promise);
    const runner = colorsRunner();
    const file = {
      ...imageEntry(),
      dataset: emptyDataset,
    } satisfies SelectedImage;
    runner.scheduleAnalysisWith(file, get(params), 'idle');
    vi.advanceTimersByTime(400);
    expect(get(analysisState)).toBe('pending');

    runner.cancelPending();

    expect(get(analysisState)).toBe('idle');
    request.resolve(colorResult());
    await vi.runAllTimersAsync();
    expect(get(analysisState)).toBe('idle');
  });

  it('AUD-003 preserves a newer Colors request when an older runner cancels', async () => {
    const requestA = deferred<AnalysisResult>();
    const requestB = deferred<AnalysisResult>();
    mocks.analyzeImage
      .mockReturnValueOnce(requestA.promise)
      .mockReturnValueOnce(requestB.promise);
    const runnerA = colorsRunner();
    const runnerB = colorsRunner();
    const file = {
      ...imageEntry(),
      dataset: emptyDataset,
    } satisfies SelectedImage;
    runnerA.scheduleAnalysisWith(file, get(params), 'idle');
    runnerB.scheduleAnalysisWith(file, get(params), 'idle');
    vi.advanceTimersByTime(400);

    runnerA.cancelPending();

    expect(get(analysisState)).toBe('pending');
    requestA.resolve(colorResult());
    requestB.resolve(colorResult());
    await vi.runAllTimersAsync();
    expect(get(analysisState)).toBe('ready');
  });

  it('AUD-003 lets Colors Exports auto-analyze after Home cancellation', async () => {
    const request = deferred<AnalysisResult>();
    mocks.analyzeImage.mockReturnValueOnce(request.promise);
    const runner = colorsRunner();
    const file = {
      ...imageEntry(),
      dataset: emptyDataset,
    } satisfies SelectedImage;
    runner.scheduleAnalysisWith(file, get(params), 'idle');
    vi.advanceTimersByTime(400);
    runner.cancelPending();
    mocks.analyzeImage.mockResolvedValueOnce(colorResult());
    const exportRunner = createColorsExportRunner({
      getFile: () => file,
      getResult: () => null,
      getParams: () => get(params),
      getExportScale: () => 2,
      getExportChecks: () => ({}) as ExportChecks,
      getGraphExportFormat: () => 'png',
      getVideoStrip: () => null,
      getVideoFrameLabel: () => 'timestamp',
      getVideoFps: () => null,
    });

    await exportRunner.ensureColorAnalysis();

    expect(mocks.analyzeImage).toHaveBeenCalledTimes(2);
    expect(get(analysisState)).toBe('ready');
    request.resolve(colorResult());
    await vi.runAllTimersAsync();
  });

  it('AI-IMP-192: a bare selection epoch does not revoke an independent export analysis', async () => {
    const request = deferred<AnalysisResult>();
    mocks.analyzeImage.mockReturnValueOnce(request.promise);
    const file = {
      ...imageEntry(),
      dataset: emptyDataset,
    } satisfies SelectedImage;
    const exportRunner = createColorsExportRunner({
      getFile: () => file,
      getResult: () => null,
      getParams: () => get(params),
      getExportScale: () => 2,
      getExportChecks: () => ({}) as ExportChecks,
      getGraphExportFormat: () => 'png',
      getVideoStrip: () => null,
      getVideoFrameLabel: () => 'timestamp',
      getVideoFps: () => null,
    });

    const pending = exportRunner.ensureColorAnalysis();
    beginSelection('unrelated-ui-selection');
    request.resolve(colorResult());
    await pending;

    expect(get(analysisState)).toBe('ready');
  });

  it('AUD-004: invalidates cached Values analysis when a logical video entry receives a new frame', () => {
    const first = imageEntry({
      id: 'video-entry',
      name: 'clip.mp4',
      path: '/cache/frame.png',
      videoPath: '/tmp/clip.mp4',
      frameTimestamp: 1,
    });
    setFile(first, emptyDataset);
    setValueAnalysisSuccess(first.id, 3, false, valueResult());
    const key = valueAnalysisKey(first.id, 3, false);
    valueAnalysisErrorByKey.update((errors) => ({
      ...errors,
      [key]: 'stale error',
    }));
    expect(get(valueAnalysisResult)).not.toBeNull();

    setFile({ ...first, frameTimestamp: 2 }, emptyDataset);

    expect(get(valueAnalysisResult)).toBeNull();
    expect(get(valueAnalysisByKey)[key]).toBeUndefined();
    expect(get(valueAnalysisStateByKey)[key]).toBeUndefined();
    expect(get(valueAnalysisErrorByKey)[key]).toBeUndefined();
  });

  it('AUD-010: deduplicates resources by path before registering them', async () => {
    const imageStore = await import('../../stores/image');
    const revokeObjectUrl = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {});
    imageStore.appendFile(imageEntry({ id: 'first' }), emptyDataset);
    imageStore.appendFile(
      imageEntry({
        id: 'duplicate',
        source: { kind: 'blob' },
        previewUrl: 'blob:duplicate',
      }),
      emptyDataset
    );

    expect(get(images)).toHaveLength(1);
    expect(imageStore.getResourceCounts().datasets).toBe(1);
    expect(imageStore.getResourceCounts().objectUrls).toBe(0);
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:duplicate');

    setFile(imageEntry({ id: 'replacement' }), { ...emptyDataset, width: 1 });

    expect(get(images)).toHaveLength(1);
    expect(get(selectedFile)?.id).toBe('first');
    expect(imageStore.getResourceCounts().datasets).toBe(1);
  });

  it('AUD-006 does not promote a raw video after removing the active image', () => {
    const active = imageEntry({ id: 'active-image', path: '/tmp/active.png' });
    const rawVideo = imageEntry({
      id: 'raw-video',
      name: 'clip.mp4',
      path: '/tmp/clip.mp4',
      videoPath: '/tmp/clip.mp4',
      previewUrl: null,
    });
    setFile(active, emptyDataset);
    appendFile(rawVideo, emptyDataset);

    removeFile(active.id);

    expect(get(selectedFile)).toBeNull();
  });

  it('AUD-006 skips a raw video and activates the next valid image', () => {
    const active = imageEntry({ id: 'active-image', path: '/tmp/active.png' });
    const rawVideo = imageEntry({
      id: 'raw-video',
      name: 'clip.mp4',
      path: '/tmp/clip.mp4',
      videoPath: '/tmp/clip.mp4',
      previewUrl: null,
    });
    const fallback = imageEntry({
      id: 'fallback-image',
      path: '/tmp/fallback.png',
    });
    setFile(active, emptyDataset);
    appendFile(rawVideo, emptyDataset);
    appendFile(fallback, emptyDataset);

    removeFile(active.id);

    expect(get(selectedFile)?.id).toBe(fallback.id);
  });
});
