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
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
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

  it('SWEEP-008: blocks capture during decode debounce and uses settled frame time', async () => {
    const frame = deferred<{ path: string; timestampUsed: string }>();
    mocks.extractVideoFrame.mockReturnValue(frame.promise);
    const onFrameExtracted = vi.fn();
    const scrubber = createVideoScrubber({
      getMaxDimension: () => 1200,
      onFrameExtracted,
      updateVideoState: vi.fn(),
    });
    scrubber.syncFromVideoState({
      path: '/tmp/video.mp4',
      name: 'video.mp4',
      duration: 10,
      fps: 24,
      currentTime: 1,
    });
    const settledFrame = {
      name: 'video.mp4',
      path: '/cache/frame-at-1.png',
      frameTimestamp: 1,
    };

    scrubber.stepFrames(1);

    expect(scrubber.extracting).toBe(true);
    expect(mocks.extractVideoFrame).not.toHaveBeenCalled();
    expect(
      settledFrameSnapshotRequest(settledFrame, scrubber.extracting)
    ).toBeNull();

    await vi.advanceTimersByTimeAsync(250);

    expect(scrubber.extracting).toBe(true);
    frame.resolve({
      path: '/cache/frame-at-next-step.png',
      timestampUsed: '1.042',
    });
    await vi.runAllTimersAsync();

    const settledTime = 1 + 1 / 24;
    expect(scrubber.extracting).toBe(false);
    expect(onFrameExtracted).toHaveBeenCalledWith(
      '/cache/frame-at-next-step.png',
      expect.any(String),
      settledTime,
      '/tmp/video.mp4',
      'video.mp4'
    );
    expect(
      settledFrameSnapshotRequest(
        {
          ...settledFrame,
          path: '/cache/frame-at-next-step.png',
          frameTimestamp: settledTime,
        },
        scrubber.extracting
      )
    ).toEqual({
      framePath: '/cache/frame-at-next-step.png',
      name: 'video.mp4',
      timestamp: settledTime,
    });
  });
});
