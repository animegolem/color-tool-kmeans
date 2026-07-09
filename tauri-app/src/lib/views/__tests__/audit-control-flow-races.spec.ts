import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

const mocks = vi.hoisted(() => ({
  extractVideoFrame: vi.fn(),
  extractVideoStrip: vi.fn(),
  probeVideo: vi.fn(),
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

vi.mock('../../bridges/log', () => ({ logEvent: vi.fn() }));

vi.mock('../../bridges/value-analysis', () => ({
  requestValueAnalysis: mocks.requestValueAnalysis,
}));

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: (path: string) => `asset://${path}`,
}));

import { createVideoController } from '../home/video-controller.svelte';
import { createAnalysisRunner } from '../home/analysis-runner.svelte';
import { createValuesFileIngestion } from '../values/file-ingestion-values.svelte';
import { createValueAnalysisRunner } from '../values/value-analysis-runner.svelte';
import { createVideoScrubber } from '../values/video-scrubber.svelte';
import {
  clearFile,
  appendFile,
  analysisState,
  cacheVideoState,
  images,
  removeFile,
  resetAnalysis,
  selectedFile,
  setAnalysisPending,
  setFile,
  valueAnalysisByKey,
  valueAnalysisErrorByKey,
  valueAnalysisResult,
  valueAnalysisStateByKey,
  videoState,
} from '../../stores/ui';
import {
  setValueAnalysisSuccess,
  valueAnalysisKey,
} from '../../stores/value-analysis';
import type {
  ImageEntry,
  SelectedImage,
  ValueAnalysisResult,
} from '../../stores/ui';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
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

describe('audit reproductions for async control-flow invariants', () => {
  beforeEach(() => {
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
    vi.useRealTimers();
  });

  it.fails(
    'discards a Values frame completion after switching to another video',
    async () => {
      const firstFrame = deferred<{ path: string; timestampUsed: string }>();
      mocks.extractVideoFrame.mockReturnValueOnce(firstFrame.promise);
      const onFrameExtracted = vi.fn();
      const scrubber = createVideoScrubber({
        getMaxDimension: () => 1200,
        onFrameExtracted,
        updateVideoState: vi.fn(),
      });

      scrubber.syncFromVideoState({
        path: '/tmp/a.mp4',
        name: 'a.mp4',
        duration: 10,
        fps: 24,
        currentTime: 1,
      });
      scrubber.scheduleFrameExtract();
      await vi.advanceTimersByTimeAsync(250);

      scrubber.syncFromVideoState({
        path: '/tmp/b.mp4',
        name: 'b.mp4',
        duration: 20,
        fps: 24,
        currentTime: 2,
      });
      firstFrame.resolve({
        path: '/cache/a-frame.png',
        timestampUsed: '1.000',
      });
      await vi.runAllTimersAsync();

      expect(onFrameExtracted).not.toHaveBeenCalled();
    }
  );

  it.fails(
    'keeps the newest Values probe result when video probes resolve out of order',
    async () => {
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
    }
  );

  it.fails(
    'preserves a cached strip when Values activates a cached video',
    () => {
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
    }
  );

  it.fails(
    'starts a replacement strip request when the strip mode changes in flight',
    () => {
      const strip = deferred<{ path: string }>();
      mocks.extractVideoStrip.mockReturnValue(strip.promise);
      const controller = createVideoController({
        isNativeModeActive: () => true,
        buildPreviewUrl: () => 'asset:///tmp/a.mp4',
        maxDimensionForQuality: () => 1200,
        setFile: vi.fn(),
        setVideoState: vi.fn(),
        clearFile: vi.fn(),
        getQuality: () => 2,
        setBannerMessage: vi.fn(),
        scheduleAnalysisWith: vi.fn(),
        getCurrentParams: () => ({}),
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
        seedAnalysisKey: vi.fn(),
        hasAnalysisForImage: () => false,
      });

      controller.loadVideoSelection({
        name: 'a.mp4',
        path: '/tmp/a.mp4',
        size: 0,
        blob: new Blob([]),
        mimeType: 'video/mp4',
      });
      controller.regenerateStrip();
      controller.regenerateStrip();

      expect(mocks.extractVideoStrip).toHaveBeenCalledTimes(2);
    }
  );

  it.fails(
    'clears a canceled Values request out of the pending state',
    async () => {
      const request = deferred<ValueAnalysisResult>();
      mocks.requestValueAnalysis.mockReturnValueOnce(request.promise);
      const runner = createValueAnalysisRunner();
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
      ).not.toBe('pending');
    }
  );

  it.fails(
    'clears a canceled Colors request out of the global pending state',
    () => {
      const runner = createAnalysisRunner({
        setAnalysisPending,
        setAnalysisSuccess: vi.fn(),
        setAnalysisError: vi.fn(),
        recordDevEvent: vi.fn(),
      });
      setAnalysisPending();

      runner.cancelPending();

      expect(get(analysisState)).not.toBe('pending');
    }
  );

  it.fails(
    'invalidates cached Values analysis when a logical video entry receives a new frame',
    () => {
      const first = imageEntry({
        id: 'video-entry',
        name: 'clip.mp4',
        path: '/cache/frame.png',
        videoPath: '/tmp/clip.mp4',
        frameTimestamp: 1,
      });
      setFile(first, emptyDataset);
      setValueAnalysisSuccess(first.id, 3, false, valueResult());
      expect(get(valueAnalysisResult)).not.toBeNull();

      setFile({ ...first, frameTimestamp: 2 }, emptyDataset);

      expect(get(valueAnalysisResult)).toBeNull();
    }
  );

  it.fails(
    'does not retain an unreachable dataset when appendFile deduplicates by path',
    async () => {
      const imageStore = await import('../../stores/image');
      imageStore.appendFile(imageEntry({ id: 'first' }), emptyDataset);
      imageStore.appendFile(imageEntry({ id: 'duplicate' }), emptyDataset);

      expect(get(images)).toHaveLength(1);
      expect(imageStore.getResourceCounts().datasets).toBe(1);
    }
  );

  it.fails(
    'does not promote a raw video into the image pipeline after removing the active image',
    () => {
      const active = imageEntry({
        id: 'active-image',
        path: '/tmp/active.png',
      });
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
    }
  );
});
