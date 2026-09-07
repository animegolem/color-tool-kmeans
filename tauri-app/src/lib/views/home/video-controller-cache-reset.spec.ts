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
import type { SelectionAuthority } from '../../stores/ui';
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
      findExistingFrameId: () => null,
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
      findExistingFrameId: () => null,
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
  });

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
      findExistingFrameId: () => null,
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
});
