import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ extractVideoFrame: vi.fn() }));

vi.mock('../../bridges/video', () => ({
  extractVideoFrame: mocks.extractVideoFrame,
}));
vi.mock('../../bridges/fs', () => ({ inferMimeType: () => 'video/mp4' }));
vi.mock('../../bridges/log', () => ({ logEvent: vi.fn() }));
vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: (path: string) => `asset://${path}`,
}));

import type {
  SelectedImage,
  SelectionAuthority,
  SettledVideoFrame,
  VideoState,
} from '../../stores/ui';
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

const DATASET = { width: 0, height: 0, pixels: new Uint8Array(0) };
let currentSelection: SelectionAuthority;

function selectedFrame(overrides: Partial<SelectedImage> = {}): SelectedImage {
  return {
    id: 'frame-1',
    name: 'video.mp4',
    path: '/cache/frame-at-1.png',
    videoPath: '/tmp/video.mp4',
    frameTimestamp: 1,
    contentRevision: 11,
    size: 0,
    source: { kind: 'path', path: '/cache/frame-at-1.png' },
    previewUrl: 'asset:///cache/frame-at-1.png',
    dataset: DATASET,
    ...overrides,
  };
}

function settlement(
  file: SelectedImage,
  maxDimension = 1200,
  selection = currentSelection
): SettledVideoFrame {
  return {
    selectionEpoch: selection.epoch,
    imageId: file.id,
    contentRevision: file.contentRevision!,
    outputPath: file.path!,
    videoPath: file.videoPath!,
    requestedTime: file.frameTimestamp!,
    maxDimension,
  };
}

function videoStateFor(
  file: SelectedImage,
  settledFrame: SettledVideoFrame | null = settlement(file),
  requestedTime = file.frameTimestamp!,
  selection = currentSelection
): VideoState {
  return {
    selection,
    path: file.videoPath!,
    name: file.name,
    duration: 10,
    fps: 24,
    currentTime: requestedTime,
    settledFrame,
    posterPath: file.path,
  };
}

function isCurrentSelection(selection: SelectionAuthority): boolean {
  return selection.epoch === currentSelection.epoch;
}

function createHarness(initialFile = selectedFrame()) {
  let file: SelectedImage | null = initialFile;
  let state = videoStateFor(initialFile);
  let revision = initialFile.contentRevision!;
  const reused = vi.fn();
  const publishedRequested = vi.fn((currentTime: number) => {
    state = { ...state, currentTime };
  });
  const publishedSettled = vi.fn((settledFrame: SettledVideoFrame) => {
    state = {
      ...state,
      currentTime: settledFrame.requestedTime,
      posterPath: settledFrame.outputPath,
      settledFrame,
    };
  });
  const onFrameExtracted = vi.fn(
    (
      framePath: string,
      frameId: string,
      timestamp: number,
      videoPath: string,
      videoName: string
    ) => {
      file = selectedFrame({
        id: file?.id ?? frameId,
        name: videoName,
        path: framePath,
        videoPath,
        frameTimestamp: timestamp,
        contentRevision: ++revision,
        source: { kind: 'path', path: framePath },
        previewUrl: `asset://${framePath}`,
      });
      return file;
    }
  );
  const scrubber = createVideoScrubber({
    getMaxDimension: () => 1200,
    onFrameExtracted,
    getSelectedFile: () => file,
    onFrameReused: reused,
    publishRequestedTime: publishedRequested,
    publishSettledFrame: publishedSettled,
    isCurrentSelection,
  });
  scrubber.syncFromVideoState(state);
  return {
    scrubber,
    onFrameExtracted,
    publishedRequested,
    publishedSettled,
    reused,
    get file() {
      return file;
    },
    get state() {
      return state;
    },
  };
}

function snapshot(
  state: VideoState | null,
  file: SelectedImage | null,
  pending = false,
  maxDimension = 1200,
  current = state ? isCurrentSelection(state.selection) : false
) {
  return settledFrameSnapshotRequest(
    state,
    file,
    maxDimension,
    pending,
    current
  );
}

describe('Values settled-frame snapshots', () => {
  beforeEach(() => {
    installRuneShims();
    vi.useFakeTimers();
    vi.clearAllMocks();
    currentSelection = Object.freeze({ epoch: 1, mediaId: 'frame-1' });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    restoreRuneShims();
  });

  it('SWEEP-008: requires current exact settled identity', () => {
    const file = selectedFrame();
    const state = videoStateFor(file);

    expect(snapshot(state, null)).toBeNull();
    expect(
      snapshot(state, selectedFrame({ path: '/cache/other.png' }))
    ).toBeNull();
    expect(snapshot(state, file, true)).toBeNull();
    expect(snapshot(state, file, false, 800)).toBeNull();
    expect(snapshot(state, file, false, 1200, false)).toBeNull();
  });

  it('SWEEP-008: accepts an exact settled frame at timestamp zero', () => {
    const file = selectedFrame({
      name: 'opening.mov',
      path: '/cache/opening.png',
      frameTimestamp: 0,
      source: { kind: 'path', path: '/cache/opening.png' },
    });
    const state = videoStateFor(file);

    expect(snapshot(state, file)).toEqual({
      framePath: '/cache/opening.png',
      name: 'opening.mov',
      timestamp: 0,
    });
  });

  it('AI-IMP-183: publishes request before debounce and withholds snapshots until acceptance', async () => {
    const frame = deferred<{ path: string; timestampUsed: string }>();
    mocks.extractVideoFrame.mockReturnValue(frame.promise);
    const harness = createHarness();

    harness.scrubber.stepFrames(1);

    expect(harness.publishedRequested).toHaveBeenCalledOnce();
    expect(mocks.extractVideoFrame).not.toHaveBeenCalled();
    expect(
      snapshot(harness.state, harness.file, harness.scrubber.extracting)
    ).toBeNull();

    await vi.advanceTimersByTimeAsync(250);
    expect(mocks.extractVideoFrame).toHaveBeenCalledOnce();
    expect(
      snapshot(harness.state, harness.file, harness.scrubber.extracting)
    ).toBeNull();

    frame.resolve({ path: '/cache/request.png', timestampUsed: '9.999' });
    await vi.runAllTimersAsync();

    expect(harness.publishedSettled).toHaveBeenCalledOnce();
    expect(snapshot(harness.state, harness.file)).toEqual({
      framePath: '/cache/request.png',
      name: 'video.mp4',
      timestamp: 1 + 1 / 24,
    });
  });

  it('SWEEP-008: coalesces seeks during debounce and publishes only the current request', async () => {
    mocks.extractVideoFrame.mockResolvedValue({
      path: '/cache/latest.png',
      timestampUsed: '1.083',
    });
    const harness = createHarness();

    harness.scrubber.stepFrames(1);
    harness.scrubber.stepFrames(1);
    await vi.advanceTimersByTimeAsync(250);
    const settledTime = 1 + 1 / 24 + 1 / 24;

    expect(mocks.extractVideoFrame).toHaveBeenCalledOnce();
    expect(mocks.extractVideoFrame).toHaveBeenCalledWith(
      expect.objectContaining({ timestamp: settledTime })
    );
    await vi.runAllTimersAsync();
    expect(harness.onFrameExtracted).toHaveBeenCalledOnce();
    expect(harness.state.settledFrame?.requestedTime).toBe(settledTime);
  });

  it('SWEEP-008: stale completion cannot clear newer pending state and current rejection stays unsettled', async () => {
    const first = deferred<{ path: string; timestampUsed: string }>();
    const second = deferred<{ path: string; timestampUsed: string }>();
    mocks.extractVideoFrame
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const harness = createHarness();

    harness.scrubber.stepFrames(1);
    await vi.advanceTimersByTimeAsync(250);
    harness.scrubber.stepFrames(1);
    first.resolve({ path: '/cache/stale.png', timestampUsed: '1.042' });
    await Promise.resolve();
    await Promise.resolve();

    expect(harness.onFrameExtracted).not.toHaveBeenCalled();
    expect(harness.scrubber.extracting).toBe(true);
    await vi.advanceTimersByTimeAsync(250);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    second.reject(new Error('decode failed'));
    await vi.runAllTimersAsync();

    expect(errorSpy).toHaveBeenCalledOnce();
    expect(harness.scrubber.extracting).toBe(false);
    expect(snapshot(harness.state, harness.file)).toBeNull();
  });

  it('AI-IMP-183: exact same-epoch settlement reuses the stored entry once', () => {
    const harness = createHarness();

    harness.scrubber.reconcileSettledFrame();
    harness.scrubber.reconcileSettledFrame();

    expect(harness.reused).toHaveBeenCalledOnce();
    expect(mocks.extractVideoFrame).not.toHaveBeenCalled();
    expect(snapshot(harness.state, harness.file)).not.toBeNull();
  });

  it.each([
    ['removed entry', null],
    ['replaced revision', selectedFrame({ contentRevision: 12 })],
    ['replaced output', selectedFrame({ path: '/cache/replaced.png' })],
  ])(
    'AI-IMP-183: %s reacquires instead of reusing settlement',
    async (_label, file) => {
      const initial = selectedFrame();
      const scrubber = createVideoScrubber({
        getMaxDimension: () => 1200,
        onFrameExtracted: vi.fn(() => null),
        getSelectedFile: () => file,
        onFrameReused: vi.fn(),
        publishRequestedTime: vi.fn(),
        publishSettledFrame: vi.fn(),
        isCurrentSelection,
      });
      scrubber.syncFromVideoState(videoStateFor(initial));
      scrubber.reconcileSettledFrame();
      await vi.advanceTimersByTimeAsync(250);

      expect(mocks.extractVideoFrame).toHaveBeenCalledOnce();
    }
  );

  it('AI-IMP-183: changed size reacquires and terminal destroy rejects completion', async () => {
    const frame = deferred<{ path: string; timestampUsed: string }>();
    mocks.extractVideoFrame.mockReturnValue(frame.promise);
    const file = selectedFrame();
    const accepted = vi.fn(() => file);
    const scrubber = createVideoScrubber({
      getMaxDimension: () => 800,
      onFrameExtracted: accepted,
      getSelectedFile: () => file,
      publishRequestedTime: vi.fn(),
      publishSettledFrame: vi.fn(),
      isCurrentSelection,
    });
    scrubber.syncFromVideoState(videoStateFor(file));
    scrubber.reconcileSettledFrame();
    await vi.advanceTimersByTimeAsync(250);

    scrubber.destroy();
    scrubber.destroy();
    frame.resolve({ path: '/cache/destroyed.png', timestampUsed: '1.000' });
    await vi.runAllTimersAsync();

    expect(accepted).not.toHaveBeenCalled();
    expect(scrubber.extracting).toBe(false);
  });
});
