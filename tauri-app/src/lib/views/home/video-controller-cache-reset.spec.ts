import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  extractVideoFrame: vi.fn(),
  extractVideoStrip: vi.fn(),
  probeVideo: vi.fn(),
}));

vi.mock('../../bridges/video', () => ({
  extractVideoFrame: mocks.extractVideoFrame,
  extractVideoStrip: mocks.extractVideoStrip,
  probeVideo: mocks.probeVideo,
}));

vi.mock('../../bridges/fs', () => ({
  inferMimeType: () => 'video/mp4',
}));

vi.mock('../../bridges/log', () => ({ logEvent: vi.fn() }));

vi.mock('../../utils/devlog', () => ({
  devlog: Object.assign(vi.fn(), { cid: () => 'test-cid' }),
}));

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: (path: string) => `asset://${path}`,
}));

import type { FileSelection } from '../../bridges/fs';
import type {
  SelectedImage,
  SelectionAuthority,
  VideoState,
} from '../../stores/ui';
import { createVideoController } from './video-controller.svelte';

const stateRuneDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  '$state'
);

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

function selection(path: string): FileSelection {
  return {
    name: path.split('/').at(-1) ?? 'video.mp4',
    path,
    size: 0,
    blob: new Blob([]),
    mimeType: 'video/mp4',
  };
}

function videoElement(): HTMLVideoElement {
  return {
    pause: vi.fn(),
    load: vi.fn(),
    currentTime: 0,
    duration: 20,
    videoWidth: 1920,
    videoHeight: 1080,
    seekable: { length: 0, end: vi.fn() },
  } as unknown as HTMLVideoElement;
}

let currentSelection: SelectionAuthority = Object.freeze({
  epoch: 0,
  mediaId: null,
});

function beginSelection(mediaId: string | null = null): SelectionAuthority {
  currentSelection = Object.freeze({
    epoch: currentSelection.epoch + 1,
    mediaId,
  });
  return currentSelection;
}

function isCurrentSelection(selection: SelectionAuthority): boolean {
  return selection.epoch === currentSelection.epoch;
}

type RestoreGesture = 'seek' | 'step';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function cachedVideoState() {
  return {
    duration: 10,
    fps: 24,
    currentTime: 7,
    stripPath: null,
    stripId: null,
    posterPath: null,
    frameId: 'cached-frame',
  };
}

function applyRestoreGesture(
  controller: ReturnType<typeof createVideoController>,
  gesture: RestoreGesture
) {
  if (gesture === 'step') {
    controller.stepVideoFrames(1);
    return 7 + 1 / 24;
  }
  controller.handleVideoScrubStart();
  controller.handleVideoScrubInput({
    target: { value: '8' },
  } as unknown as Event);
  controller.handleVideoScrubEnd();
  return 8;
}

function cachedController(
  overrides: Partial<Parameters<typeof createVideoController>[0]> = {}
) {
  return createVideoController({
    isNativeModeActive: () => true,
    buildPreviewUrl: (file) => `asset://${file.path}`,
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
    getCachedVideoState: () => cachedVideoState(),
    cacheVideoState: vi.fn(),
    getSelectedFile: () => null,
    beginSelection,
    isCurrentSelection,
    ...overrides,
  });
}

describe('video controller cache restoration reset', () => {
  beforeEach(() => {
    installRuneShim();
    vi.useFakeTimers();
    vi.clearAllMocks();
    currentSelection = Object.freeze({ epoch: 0, mediaId: null });
    mocks.probeVideo.mockReturnValue(new Promise(() => undefined));
    mocks.extractVideoStrip.mockReturnValue(new Promise(() => undefined));
    mocks.extractVideoFrame.mockResolvedValue({
      path: '/cache/fresh-frame.png',
      timestampUsed: '0.000',
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    restoreRuneShim();
  });

  it('SWEEP-003: does not carry cached seek or restoration mode into a fresh video', async () => {
    const scheduleAnalysisWith = vi.fn();
    const controller = createVideoController({
      isNativeModeActive: () => true,
      buildPreviewUrl: (file) => `asset://${file.path}`,
      maxDimensionForQuality: () => 1200,
      setFile: vi.fn(() => true),
      setVideoState: vi.fn(),
      clearFile: vi.fn(),
      getQuality: () => 2,
      setBannerMessage: vi.fn(),
      scheduleAnalysisWith,
      getCurrentParams: () => ({}),
      cancelPending: vi.fn(),
      clearLastRequestKey: vi.fn(),
      captureAnalysisScroll: vi.fn(),
      getVideoStripMode: () => 'filmstrip',
      getCachedVideoState: (path) =>
        path === '/tmp/cached.mp4'
          ? {
              duration: 10,
              fps: 24,
              currentTime: 7,
              stripPath: null,
              stripId: null,
              posterPath: null,
              frameId: 'cached-frame',
            }
          : null,
      cacheVideoState: vi.fn(),
      getSelectedFile: () => null,
      beginSelection,
      isCurrentSelection,
    });
    const element = videoElement();
    controller.setVideoElementRef(element);

    controller.loadVideoSelection(selection('/tmp/cached.mp4'));
    controller.loadVideoSelection(selection('/tmp/fresh.mp4'));
    controller.handleVideoMetadata();

    expect(controller.videoCurrentTime).toBe(0);
    expect(element.currentTime).toBe(0);

    await vi.advanceTimersByTimeAsync(250);

    expect(scheduleAnalysisWith).toHaveBeenCalledTimes(1);
  });

  it('SWEEP-010: preserves cached seek but cancels and recomputes the extracted frame', async () => {
    const scheduleAnalysisWith = vi.fn();
    const cancelPending = vi.fn();
    const clearLastRequestKey = vi.fn();
    const setFile = vi.fn(() => true);
    const controller = createVideoController({
      isNativeModeActive: () => true,
      buildPreviewUrl: (file) => `asset://${file.path}`,
      maxDimensionForQuality: () => 1200,
      setFile,
      setVideoState: vi.fn(),
      clearFile: vi.fn(),
      getQuality: () => 2,
      setBannerMessage: vi.fn(),
      scheduleAnalysisWith,
      getCurrentParams: () => ({ quality: 2 }),
      cancelPending,
      clearLastRequestKey,
      captureAnalysisScroll: vi.fn(),
      getVideoStripMode: () => 'filmstrip',
      getCachedVideoState: () => ({
        duration: 10,
        fps: 24,
        currentTime: 7,
        stripPath: null,
        stripId: null,
        posterPath: null,
        frameId: 'cached-frame',
      }),
      cacheVideoState: vi.fn(),
      getSelectedFile: () => null,
      beginSelection,
      isCurrentSelection,
    });
    const element = videoElement();
    controller.setVideoElementRef(element);

    controller.loadVideoSelection(selection('/tmp/cached.mp4'));
    controller.handleVideoMetadata();

    expect(controller.videoCurrentTime).toBe(7);
    expect(element.currentTime).toBe(7);

    await vi.advanceTimersByTimeAsync(250);

    expect(cancelPending).toHaveBeenCalledOnce();
    expect(clearLastRequestKey).toHaveBeenCalledOnce();
    expect(setFile).toHaveBeenCalledOnce();
    expect(scheduleAnalysisWith).toHaveBeenCalledOnce();
    expect(cancelPending.mock.invocationCallOrder[0]).toBeLessThan(
      setFile.mock.invocationCallOrder[0]
    );
    expect(clearLastRequestKey.mock.invocationCallOrder[0]).toBeLessThan(
      setFile.mock.invocationCallOrder[0]
    );
    expect(scheduleAnalysisWith.mock.invocationCallOrder[0]).toBeGreaterThan(
      setFile.mock.invocationCallOrder[0]
    );
    expect(mocks.extractVideoFrame).toHaveBeenCalledOnce();
    expect(mocks.extractVideoFrame).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/tmp/cached.mp4',
        frameId: 'cached-frame',
        timestamp: 7,
      })
    );
    expect(setFile).toHaveBeenCalledWith(
      expect.objectContaining({
        frameTimestamp: 7,
        path: '/cache/fresh-frame.png',
      }),
      expect.any(Object),
      { selection: expect.any(Object) }
    );
  });

  it.each<RestoreGesture>(['seek', 'step'])(
    'AI-IMP-182: %s during cached restore debounce extracts and schedules only the final frame',
    async (gesture) => {
      const setFile = vi.fn(() => true);
      const scheduleAnalysisWith = vi.fn();
      const cancelPending = vi.fn();
      const clearLastRequestKey = vi.fn();
      const controller = cachedController({
        setFile,
        scheduleAnalysisWith,
        cancelPending,
        clearLastRequestKey,
      });
      const element = videoElement();
      controller.setVideoElementRef(element);

      controller.loadVideoSelection(selection('/tmp/cached.mp4'));
      controller.handleVideoMetadata();
      const finalTime = applyRestoreGesture(controller, gesture);
      await vi.advanceTimersByTimeAsync(250);

      expect(controller.videoCurrentTime).toBe(finalTime);
      expect(mocks.extractVideoFrame).toHaveBeenCalledOnce();
      expect(mocks.extractVideoFrame).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/tmp/cached.mp4',
          frameId: 'cached-frame',
          timestamp: finalTime,
        })
      );
      expect(setFile).toHaveBeenCalledOnce();
      expect(setFile).toHaveBeenCalledWith(
        expect.objectContaining({
          frameTimestamp: finalTime,
          path: '/cache/fresh-frame.png',
        }),
        expect.any(Object),
        { selection: expect.any(Object) }
      );
      expect(cancelPending).toHaveBeenCalledOnce();
      expect(clearLastRequestKey).toHaveBeenCalledOnce();
      expect(scheduleAnalysisWith).toHaveBeenCalledOnce();
    }
  );

  it.each<RestoreGesture>(['seek', 'step'])(
    'AI-IMP-182: %s during cached frame IPC serializes the final frame and blocks stale publication',
    async (gesture) => {
      const staleFrame = deferred<{ path: string; timestampUsed: string }>();
      const finalFrame = deferred<{ path: string; timestampUsed: string }>();
      mocks.extractVideoFrame
        .mockReturnValueOnce(staleFrame.promise)
        .mockReturnValueOnce(finalFrame.promise);
      const setFile = vi.fn(() => true);
      const scheduleAnalysisWith = vi.fn();
      const cancelPending = vi.fn();
      const clearLastRequestKey = vi.fn();
      const setVideoState = vi.fn();
      const cacheVideoState = vi.fn();
      const controller = cachedController({
        setFile,
        scheduleAnalysisWith,
        cancelPending,
        clearLastRequestKey,
        setVideoState,
        cacheVideoState,
      });
      const element = videoElement();
      controller.setVideoElementRef(element);

      controller.loadVideoSelection(selection('/tmp/cached.mp4'));
      controller.handleVideoMetadata();
      await vi.advanceTimersByTimeAsync(250);
      expect(mocks.extractVideoFrame).toHaveBeenCalledOnce();
      expect(mocks.extractVideoFrame).toHaveBeenLastCalledWith(
        expect.objectContaining({ timestamp: 7 })
      );

      const finalTime = applyRestoreGesture(controller, gesture);
      await vi.advanceTimersByTimeAsync(250);
      expect(mocks.extractVideoFrame).toHaveBeenCalledOnce();
      expect(controller.frameDecoding).toBe(true);
      const stateCallsBeforeStale = setVideoState.mock.calls.length;
      const cacheCallsBeforeStale = cacheVideoState.mock.calls.length;

      staleFrame.resolve({
        path: '/cache/stale-cached-frame.png',
        timestampUsed: '7.000',
      });
      await vi.waitFor(() =>
        expect(mocks.extractVideoFrame).toHaveBeenCalledTimes(2)
      );

      expect(setFile).not.toHaveBeenCalled();
      expect(cancelPending).not.toHaveBeenCalled();
      expect(clearLastRequestKey).not.toHaveBeenCalled();
      expect(scheduleAnalysisWith).not.toHaveBeenCalled();
      expect(setVideoState).toHaveBeenCalledTimes(stateCallsBeforeStale);
      expect(cacheVideoState).toHaveBeenCalledTimes(cacheCallsBeforeStale);
      expect(controller.frameDecoding).toBe(true);
      expect(mocks.extractVideoFrame).toHaveBeenLastCalledWith(
        expect.objectContaining({ timestamp: finalTime })
      );

      finalFrame.resolve({
        path: '/cache/final-frame.png',
        timestampUsed: finalTime.toFixed(3),
      });
      await vi.waitFor(() => expect(controller.frameDecoding).toBe(false));

      expect(controller.videoCurrentTime).toBe(finalTime);
      expect(setFile).toHaveBeenCalledOnce();
      expect(setFile).toHaveBeenCalledWith(
        expect.objectContaining({
          frameTimestamp: finalTime,
          path: '/cache/final-frame.png',
        }),
        expect.any(Object),
        { selection: expect.any(Object) }
      );
      expect(cancelPending).toHaveBeenCalledOnce();
      expect(clearLastRequestKey).toHaveBeenCalledOnce();
      expect(scheduleAnalysisWith).toHaveBeenCalledOnce();
      expect(setVideoState).toHaveBeenCalledTimes(stateCallsBeforeStale + 1);
      expect(cacheVideoState).toHaveBeenCalledTimes(cacheCallsBeforeStale + 1);
    }
  );

  it('SWEEP-003: repeated full resets leave a subsequent fresh video at zero', async () => {
    const scheduleAnalysisWith = vi.fn();
    const controller = createVideoController({
      isNativeModeActive: () => true,
      buildPreviewUrl: (file) => `asset://${file.path}`,
      maxDimensionForQuality: () => 1200,
      setFile: vi.fn(() => true),
      setVideoState: vi.fn(),
      clearFile: vi.fn(),
      getQuality: () => 2,
      setBannerMessage: vi.fn(),
      scheduleAnalysisWith,
      getCurrentParams: () => ({}),
      cancelPending: vi.fn(),
      clearLastRequestKey: vi.fn(),
      captureAnalysisScroll: vi.fn(),
      getVideoStripMode: () => 'filmstrip',
      getCachedVideoState: (path) =>
        path === '/tmp/cached.mp4'
          ? {
              duration: 10,
              fps: 24,
              currentTime: 7,
              stripPath: null,
              stripId: null,
              posterPath: null,
              frameId: 'cached-frame',
            }
          : null,
      cacheVideoState: vi.fn(),
      getSelectedFile: () => null,
      beginSelection,
      isCurrentSelection,
    });
    const element = videoElement();
    controller.setVideoElementRef(element);

    controller.loadVideoSelection(selection('/tmp/cached.mp4'));
    controller.clearVideoSelection();
    controller.clearVideoSelection();
    controller.loadVideoSelection(selection('/tmp/fresh.mp4'));
    controller.handleVideoMetadata();
    await vi.advanceTimersByTimeAsync(250);

    expect(controller.videoCurrentTime).toBe(0);
    expect(element.currentTime).toBe(0);
    expect(scheduleAnalysisWith).toHaveBeenCalledOnce();
  });

  it('AI-IMP-183: exact same-epoch stored settlement reuses once and enables only its snapshot path', () => {
    const authority = beginSelection('frame-1');
    const file: SelectedImage = {
      id: 'frame-1',
      name: 'cached.mp4',
      path: '/cache/settled.png',
      videoPath: '/tmp/cached.mp4',
      frameTimestamp: 7,
      contentRevision: 41,
      size: 0,
      source: { kind: 'path', path: '/cache/settled.png' },
      previewUrl: 'asset:///cache/settled.png',
      dataset: { width: 0, height: 0, pixels: new Uint8Array(0) },
    };
    const state: VideoState = {
      selection: authority,
      path: '/tmp/cached.mp4',
      name: 'cached.mp4',
      duration: 10,
      fps: 24,
      currentTime: 7,
      settledFrame: {
        selectionEpoch: authority.epoch,
        imageId: file.id,
        contentRevision: file.contentRevision!,
        outputPath: file.path!,
        videoPath: file.videoPath!,
        requestedTime: file.frameTimestamp!,
        maxDimension: 1200,
      },
      posterPath: file.path,
    };
    const scheduleAnalysisWith = vi.fn();
    const controller = cachedController({
      getSelectedFile: () => file,
      scheduleAnalysisWith,
    });

    controller.handleVideoStateChange(state);
    controller.ensureSettledFrame();
    controller.ensureSettledFrame();

    expect(mocks.extractVideoFrame).not.toHaveBeenCalled();
    expect(scheduleAnalysisWith).toHaveBeenCalledOnce();
    expect(controller.videoPosterPath).toBe('/cache/settled.png');
  });

  it('AI-IMP-183 amendment01: canonical epoch revocation immediately disables the Home snapshot seam', () => {
    const authority = beginSelection('frame-1');
    const file: SelectedImage = {
      id: 'frame-1',
      name: 'cached.mp4',
      path: '/cache/settled.png',
      videoPath: '/tmp/cached.mp4',
      frameTimestamp: 7,
      contentRevision: 41,
      size: 0,
      source: { kind: 'path', path: '/cache/settled.png' },
      previewUrl: 'asset:///cache/settled.png',
      dataset: { width: 0, height: 0, pixels: new Uint8Array(0) },
    };
    const state: VideoState = {
      selection: authority,
      path: '/tmp/cached.mp4',
      name: 'cached.mp4',
      duration: 10,
      fps: 24,
      currentTime: 7,
      settledFrame: {
        selectionEpoch: authority.epoch,
        imageId: file.id,
        contentRevision: file.contentRevision!,
        outputPath: file.path!,
        videoPath: file.videoPath!,
        requestedTime: file.frameTimestamp!,
        maxDimension: 1200,
      },
      posterPath: file.path,
    };
    const controller = cachedController({ getSelectedFile: () => file });

    controller.handleVideoStateChange(state);
    expect(controller.videoPosterPath).toBe('/cache/settled.png');

    beginSelection('new-target');
    expect(controller.videoPosterPath).toBeNull();
  });

  it('AI-IMP-183 amendment01: reconciliation waits for scrub end before one final extraction', async () => {
    const authority = beginSelection('frame-1');
    const file: SelectedImage = {
      id: 'frame-1',
      name: 'cached.mp4',
      path: '/cache/settled.png',
      videoPath: '/tmp/cached.mp4',
      frameTimestamp: 7,
      contentRevision: 41,
      size: 0,
      source: { kind: 'path', path: '/cache/settled.png' },
      previewUrl: 'asset:///cache/settled.png',
      dataset: { width: 0, height: 0, pixels: new Uint8Array(0) },
    };
    const state: VideoState = {
      selection: authority,
      path: '/tmp/cached.mp4',
      name: 'cached.mp4',
      duration: 10,
      fps: 24,
      currentTime: 7,
      settledFrame: {
        selectionEpoch: authority.epoch,
        imageId: file.id,
        contentRevision: file.contentRevision!,
        outputPath: file.path!,
        videoPath: file.videoPath!,
        requestedTime: file.frameTimestamp!,
        maxDimension: 1200,
      },
      posterPath: file.path,
    };
    const setFileForFrame = vi.fn(() => true);
    const scheduleAnalysisWith = vi.fn();
    const controller = cachedController({
      getSelectedFile: () => file,
      setFile: setFileForFrame,
      scheduleAnalysisWith,
    });
    controller.handleVideoStateChange(state);
    mocks.extractVideoFrame.mockClear();
    scheduleAnalysisWith.mockClear();

    controller.handleVideoScrubStart();
    controller.handleVideoScrubInput({
      target: { value: '8' },
    } as unknown as Event);
    controller.ensureSettledFrame();
    await vi.advanceTimersByTimeAsync(300);

    expect(mocks.extractVideoFrame).not.toHaveBeenCalled();
    expect(scheduleAnalysisWith).not.toHaveBeenCalled();
    expect(controller.videoPosterPath).toBeNull();

    controller.handleVideoScrubEnd();
    await vi.advanceTimersByTimeAsync(250);

    expect(mocks.extractVideoFrame).toHaveBeenCalledOnce();
    expect(mocks.extractVideoFrame).toHaveBeenCalledWith(
      expect.objectContaining({ timestamp: 8 })
    );
    expect(setFileForFrame).toHaveBeenCalledOnce();
    expect(scheduleAnalysisWith).toHaveBeenCalledOnce();
  });

  it.each([
    { label: 'success', rejects: false },
    { label: 'rejection', rejects: true },
  ])(
    'AI-IMP-183: terminal controller disposal rejects late frame $label and finally',
    async ({ rejects }) => {
      const frame = deferred<{ path: string; timestampUsed: string }>();
      mocks.extractVideoFrame.mockReturnValue(frame.promise);
      const setFileForFrame = vi.fn(() => true);
      const setVideoState = vi.fn();
      const cache = vi.fn();
      const banner = vi.fn();
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const controller = cachedController({
        setFile: setFileForFrame,
        setVideoState,
        cacheVideoState: cache,
        setBannerMessage: banner,
      });
      controller.loadVideoSelection(selection('/tmp/cached.mp4'));
      await vi.advanceTimersByTimeAsync(250);
      const stateCalls = setVideoState.mock.calls.length;
      const cacheCalls = cache.mock.calls.length;

      controller.dispose();
      controller.dispose();
      controller.stepVideoFrames(1);
      if (rejects) frame.reject(new Error('disposed frame failed'));
      else
        frame.resolve({
          path: '/cache/disposed.png',
          timestampUsed: '7.000',
        });
      await Promise.resolve();
      await Promise.resolve();

      expect(setFileForFrame).not.toHaveBeenCalled();
      expect(setVideoState).toHaveBeenCalledTimes(stateCalls);
      expect(cache).toHaveBeenCalledTimes(cacheCalls);
      expect(banner).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
      expect(controller.frameDecoding).toBe(false);
      expect(controller.videoPosterPath).toBeNull();
    }
  );
});
