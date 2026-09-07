import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  extractVideoFrame: vi.fn(),
}));

vi.mock('../../bridges/video', () => ({
  extractVideoFrame: mocks.extractVideoFrame,
}));

vi.mock('../../bridges/fs', () => ({
  inferMimeType: () => 'video/mp4',
}));

vi.mock('../../bridges/log', () => ({ logEvent: vi.fn() }));

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: (path: string) => `asset://${path}`,
}));

import type { ImageEntry, SelectionAuthority } from '../../stores/ui';
import {
  createVideoScrubber,
  settledFrameSnapshotRequest,
} from './video-scrubber.svelte';

const stateRuneDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  '$state'
);
const derivedRuneDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  '$derived'
);

function installRuneShims() {
  Object.defineProperty(globalThis, '$state', {
    configurable: true,
    value: <T>(value: T) => value,
  });
  Object.defineProperty(globalThis, '$derived', {
    configurable: true,
    value: <T>(value: T) => value,
  });
}

function restoreRuneShims() {
  if (stateRuneDescriptor) {
    Object.defineProperty(globalThis, '$state', stateRuneDescriptor);
  } else {
    delete (globalThis as { $state?: unknown }).$state;
  }
  if (derivedRuneDescriptor) {
    Object.defineProperty(globalThis, '$derived', derivedRuneDescriptor);
  } else {
    delete (globalThis as { $derived?: unknown }).$derived;
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

function settledFrame(overrides: Partial<ImageEntry> = {}): ImageEntry {
  return {
    id: 'frame-1',
    name: 'video.mp4',
    path: '/cache/frame-at-1.png',
    videoPath: '/tmp/video.mp4',
    frameTimestamp: 1,
    size: 0,
    source: { kind: 'path', path: '/cache/frame-at-1.png' },
    previewUrl: 'asset:///cache/frame-at-1.png',
    ...overrides,
  };
}

const TEST_SELECTION: SelectionAuthority = Object.freeze({
  epoch: 1,
  mediaId: 'video-1',
});

function isCurrentSelection(selection: SelectionAuthority): boolean {
  return selection.epoch === TEST_SELECTION.epoch;
}

function syncVideo(
  scrubber: ReturnType<typeof createVideoScrubber>,
  path = '/tmp/video.mp4',
  currentTime = 1
) {
  scrubber.syncFromVideoState({
    selection: TEST_SELECTION,
    path,
    name: path.split('/').at(-1) ?? 'video.mp4',
    duration: 10,
    fps: 24,
    currentTime,
  });
}

describe('Values settled-frame snapshots', () => {
  beforeEach(() => {
    installRuneShims();
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    restoreRuneShims();
  });

  it.each([
    ['null file', null, false],
    ['missing path', settledFrame({ path: '' }), false],
    ['missing timestamp', settledFrame({ frameTimestamp: undefined }), false],
    ['pending decode', settledFrame(), true],
  ])(
    'SWEEP-008: rejects snapshot eligibility for %s',
    (_label, file, pending) => {
      expect(settledFrameSnapshotRequest(file, pending)).toBeNull();
    }
  );

  it('SWEEP-008: accepts a settled frame at timestamp zero', () => {
    expect(
      settledFrameSnapshotRequest(
        settledFrame({
          name: 'opening.mov',
          path: '/cache/opening.png',
          frameTimestamp: 0,
        }),
        false
      )
    ).toEqual({
      framePath: '/cache/opening.png',
      name: 'opening.mov',
      timestamp: 0,
    });
  });

  it('SWEEP-008: blocks capture through debounce and active extraction, then uses one settled entry', async () => {
    const frame = deferred<{ path: string; timestampUsed: string }>();
    mocks.extractVideoFrame.mockReturnValue(frame.promise);
    let currentFrame = settledFrame();
    const onFrameExtracted = vi.fn(
      (
        framePath: string,
        frameId: string,
        timestamp: number,
        videoPath: string,
        videoName: string
      ) => {
        currentFrame = settledFrame({
          id: frameId,
          name: videoName,
          path: framePath,
          videoPath,
          frameTimestamp: timestamp,
          source: { kind: 'path', path: framePath },
        });
        return true;
      }
    );
    const scrubber = createVideoScrubber({
      getMaxDimension: () => 1200,
      onFrameExtracted,
      updateVideoState: vi.fn(),
      isCurrentSelection,
    });
    syncVideo(scrubber);

    scrubber.stepFrames(1);

    expect(scrubber.extracting).toBe(true);
    expect(mocks.extractVideoFrame).not.toHaveBeenCalled();
    expect(
      settledFrameSnapshotRequest(currentFrame, scrubber.extracting)
    ).toBeNull();

    await vi.advanceTimersByTimeAsync(250);

    expect(scrubber.extracting).toBe(true);
    expect(mocks.extractVideoFrame).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/tmp/video.mp4',
        timestamp: 1 + 1 / 24,
      })
    );
    frame.resolve({
      path: '/cache/frame-at-request.png',
      timestampUsed: '9.999',
    });
    await vi.runAllTimersAsync();

    expect(scrubber.extracting).toBe(false);
    expect(onFrameExtracted).toHaveBeenCalledOnce();
    expect(
      settledFrameSnapshotRequest(currentFrame, scrubber.extracting)
    ).toEqual({
      framePath: '/cache/frame-at-request.png',
      name: 'video.mp4',
      timestamp: 1 + 1 / 24,
    });
  });

  it('SWEEP-008: coalesces seeks during debounce and publishes only the current request', async () => {
    const frame = deferred<{ path: string; timestampUsed: string }>();
    mocks.extractVideoFrame.mockReturnValue(frame.promise);
    const onFrameExtracted = vi.fn(() => true);
    const scrubber = createVideoScrubber({
      getMaxDimension: () => 1200,
      onFrameExtracted,
      updateVideoState: vi.fn(),
      isCurrentSelection,
    });
    syncVideo(scrubber);

    scrubber.stepFrames(1);
    scrubber.stepFrames(1);
    await vi.advanceTimersByTimeAsync(250);
    const settledTime = 1 + 1 / 24 + 1 / 24;

    expect(mocks.extractVideoFrame).toHaveBeenCalledOnce();
    expect(mocks.extractVideoFrame).toHaveBeenCalledWith(
      expect.objectContaining({ timestamp: settledTime })
    );
    expect(scrubber.extracting).toBe(true);

    frame.resolve({ path: '/cache/latest.png', timestampUsed: '1.083' });
    await vi.runAllTimersAsync();

    expect(onFrameExtracted).toHaveBeenCalledOnce();
    expect(onFrameExtracted).toHaveBeenCalledWith(
      '/cache/latest.png',
      expect.any(String),
      settledTime,
      '/tmp/video.mp4',
      'video.mp4',
      TEST_SELECTION
    );
    expect(scrubber.extracting).toBe(false);
  });

  it('SWEEP-008: stale completion cannot clear newer pending state and current rejection retains the prior frame', async () => {
    const first = deferred<{ path: string; timestampUsed: string }>();
    const second = deferred<{ path: string; timestampUsed: string }>();
    mocks.extractVideoFrame
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const onFrameExtracted = vi.fn(() => true);
    const scrubber = createVideoScrubber({
      getMaxDimension: () => 1200,
      onFrameExtracted,
      updateVideoState: vi.fn(),
      isCurrentSelection,
    });
    const priorFrame = settledFrame({
      path: '/cache/prior.png',
      frameTimestamp: 0.5,
    });
    syncVideo(scrubber);

    scrubber.stepFrames(1);
    await vi.advanceTimersByTimeAsync(250);
    scrubber.stepFrames(1);
    first.resolve({ path: '/cache/stale.png', timestampUsed: '1.042' });
    await Promise.resolve();
    await Promise.resolve();

    expect(onFrameExtracted).not.toHaveBeenCalled();
    expect(scrubber.extracting).toBe(true);
    expect(
      settledFrameSnapshotRequest(priorFrame, scrubber.extracting)
    ).toBeNull();

    await vi.advanceTimersByTimeAsync(250);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    second.reject(new Error('decode failed'));
    await vi.runAllTimersAsync();

    expect(errorSpy).toHaveBeenCalledOnce();
    expect(onFrameExtracted).not.toHaveBeenCalled();
    expect(scrubber.extracting).toBe(false);
    expect(scrubber.currentTime).toBe(1 + 1 / 24 + 1 / 24);
    expect(settledFrameSnapshotRequest(priorFrame, false)).toEqual({
      framePath: '/cache/prior.png',
      name: 'video.mp4',
      timestamp: 0.5,
    });
  });

  it('SWEEP-008: a path switch revokes active extraction without publishing the old frame', async () => {
    const oldFrame = deferred<{ path: string; timestampUsed: string }>();
    mocks.extractVideoFrame.mockReturnValue(oldFrame.promise);
    const onFrameExtracted = vi.fn(() => true);
    const scrubber = createVideoScrubber({
      getMaxDimension: () => 1200,
      onFrameExtracted,
      updateVideoState: vi.fn(),
      isCurrentSelection,
    });
    syncVideo(scrubber, '/tmp/a.mp4');
    scrubber.scheduleFrameExtract();
    await vi.advanceTimersByTimeAsync(250);

    syncVideo(scrubber, '/tmp/b.mp4', 2);
    expect(scrubber.extracting).toBe(false);
    oldFrame.resolve({ path: '/cache/a.png', timestampUsed: '1.000' });
    await vi.runAllTimersAsync();

    expect(onFrameExtracted).not.toHaveBeenCalled();
    expect(scrubber.extracting).toBe(false);
  });

  it('SWEEP-008: destruction clears pending state and rejects an active completion', async () => {
    const frame = deferred<{ path: string; timestampUsed: string }>();
    mocks.extractVideoFrame.mockReturnValue(frame.promise);
    const onFrameExtracted = vi.fn(() => true);
    const scrubber = createVideoScrubber({
      getMaxDimension: () => 1200,
      onFrameExtracted,
      updateVideoState: vi.fn(),
      isCurrentSelection,
    });
    syncVideo(scrubber);
    scrubber.scheduleFrameExtract();
    await vi.advanceTimersByTimeAsync(250);

    scrubber.destroy();
    expect(scrubber.extracting).toBe(false);
    frame.resolve({ path: '/cache/destroyed.png', timestampUsed: '1.000' });
    await vi.runAllTimersAsync();

    expect(onFrameExtracted).not.toHaveBeenCalled();
    expect(scrubber.extracting).toBe(false);
  });
});
