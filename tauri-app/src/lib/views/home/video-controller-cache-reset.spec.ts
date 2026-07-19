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

import { createVideoController } from './video-controller.svelte';
import type { FileSelection } from '../../bridges/fs';

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

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
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

describe('video controller cache restoration reset', () => {
  beforeEach(() => {
    installRuneShim();
    vi.useFakeTimers();
    vi.clearAllMocks();
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
    const seedAnalysisKey = vi.fn();
    const controller = createVideoController({
      isNativeModeActive: () => true,
      buildPreviewUrl: (file) => `asset://${file.path}`,
      maxDimensionForQuality: () => 1200,
      setFile: vi.fn(),
      setVideoState: vi.fn(),
      clearFile: vi.fn(),
      getQuality: () => 2,
      setBannerMessage: vi.fn(),
      scheduleAnalysisWith,
      getCurrentParams: () => ({}),
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
      seedAnalysisKey,
      hasAnalysisForImage: () => true,
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
    expect(seedAnalysisKey).not.toHaveBeenCalled();
  });

  it('SWEEP-023: a disposed Home owner cannot publish its late frame', async () => {
    const frame = deferred<{ path: string; timestampUsed: string }>();
    mocks.extractVideoFrame.mockReturnValue(frame.promise);
    let selectedPath: string | null = null;
    const setFile = vi.fn((entry: { videoPath?: string }) => {
      selectedPath = entry.videoPath ?? null;
    });
    const controller = createVideoController({
      isNativeModeActive: () => true,
      buildPreviewUrl: (file) => `asset://${file.path}`,
      maxDimensionForQuality: () => 1200,
      setFile,
      setVideoState: (state) => {
        selectedPath = state?.path ?? null;
      },
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
        currentTime: 2,
        stripPath: null,
        stripId: null,
        posterPath: null,
        frameId: 'old-owner-frame',
      }),
      cacheVideoState: vi.fn(),
      findExistingFrameId: () => null,
      seedAnalysisKey: vi.fn(),
      hasAnalysisForImage: () => false,
    });

    controller.loadVideoSelection(selection('/tmp/old-owner.mp4'));
    await vi.advanceTimersByTimeAsync(250);
    expect(mocks.extractVideoFrame).toHaveBeenCalledTimes(1);

    controller.dispose();
    selectedPath = '/tmp/new-owner.mp4';
    frame.resolve({
      path: '/cache/old-owner-frame.png',
      timestampUsed: '2.000',
    });
    await vi.runAllTimersAsync();

    expect(selectedPath).toBe('/tmp/new-owner.mp4');
    expect(setFile).not.toHaveBeenCalled();
  });
});
