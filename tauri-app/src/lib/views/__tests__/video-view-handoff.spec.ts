import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

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
  getFsBridge: vi.fn(),
  isVideoFile: (file: { name: string }) => /\.(mp4|mov)$/i.test(file.name),
  inferMimeType: () => 'video/mp4',
}));
vi.mock('../../bridges/tauri', () => ({
  isTauriEnv: () => true,
  tauriInvoke: vi.fn(async () => undefined),
}));
vi.mock('../../bridges/log', () => ({ logEvent: vi.fn() }));
vi.mock('../../services/drag-drop', () => ({ setupTauriDragDrop: vi.fn() }));
vi.mock('../../utils/devlog', () => ({
  registerResourceCounter: vi.fn(),
  devlog: Object.assign(vi.fn(), {
    cid: () => 'handoff-cid',
    resources: vi.fn(),
    error: vi.fn(),
  }),
}));
vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: (path: string) => `asset://${path}`,
}));

import { createVideoController } from '../home/video-controller.svelte';
import { createValuesFileIngestion } from '../values/file-ingestion-values.svelte';
import { createVideoScrubber } from '../values/video-scrubber.svelte';
import {
  beginSelection,
  cacheVideoState,
  clearFile,
  getCachedVideoState,
  images,
  isCurrentSelection,
  selectedFile,
  setFile,
  setVideoState,
  videoState,
  type ImageEntry,
  type SelectedImage,
  type SelectionAuthority,
  type SettledVideoFrame,
  type VideoState,
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

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

const DATASET = { width: 0, height: 0, pixels: new Uint8Array(0) };
const VIDEO_PATH = '/tmp/handoff.mp4';
const VIDEO_NAME = 'handoff.mp4';
const MAX_DIMENSION = 1200;
const INITIAL_TIME = 1;
const REQUESTED_TIME = INITIAL_TIME + 1 / 24;

function frameEntry(path: string, timestamp: number): ImageEntry {
  return {
    id: 'shared-frame',
    name: VIDEO_NAME,
    path,
    videoPath: VIDEO_PATH,
    frameTimestamp: timestamp,
    size: 0,
    source: { kind: 'path', path },
    previewUrl: `asset://${path}`,
  };
}

function settlementFor(
  file: SelectedImage,
  selection: SelectionAuthority,
  maxDimension = MAX_DIMENSION
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

function seedSettledVideo(): {
  selection: SelectionAuthority;
  revision: number;
} {
  const selection = beginSelection('shared-frame');
  expect(
    setFile(frameEntry('/cache/initial.png', INITIAL_TIME), DATASET, {
      selection,
    })
  ).toBe(true);
  const file = get(selectedFile)!;
  setVideoState({
    selection,
    path: VIDEO_PATH,
    name: VIDEO_NAME,
    duration: 10,
    fps: 24,
    currentTime: INITIAL_TIME,
    settledFrame: settlementFor(file, selection),
    posterPath: file.path,
  });
  return { selection, revision: file.contentRevision! };
}

interface MountedOwner<T> {
  owner: T;
  analysis: ReturnType<typeof vi.fn>;
  dispose: () => void;
}

interface MountedValues
  extends MountedOwner<ReturnType<typeof createVideoScrubber>> {
  ingestion: ReturnType<typeof createValuesFileIngestion>;
}

function mountHome(): MountedOwner<ReturnType<typeof createVideoController>> {
  const analysis = vi.fn();
  const controller = createVideoController({
    isNativeModeActive: () => true,
    buildPreviewUrl: (file) => `asset://${file.path}`,
    maxDimensionForQuality: () => MAX_DIMENSION,
    setFile,
    setVideoState,
    clearFile,
    getQuality: () => 2,
    setBannerMessage: vi.fn(),
    scheduleAnalysisWith: analysis,
    getCurrentParams: () => ({ quality: 2 }),
    cancelPending: vi.fn(),
    clearLastRequestKey: vi.fn(),
    captureAnalysisScroll: vi.fn(),
    getVideoStripMode: () => 'filmstrip',
    getCachedVideoState,
    cacheVideoState,
    getSelectedFile: () => get(selectedFile),
    beginSelection,
    isCurrentSelection,
  });
  const unsubscribe = videoState.subscribe(controller.handleVideoStateChange);
  return {
    owner: controller,
    analysis,
    dispose: () => {
      controller.dispose();
      unsubscribe();
    },
  };
}

function mountValues(): MountedValues {
  const analysis = vi.fn();
  const ingestion = createValuesFileIngestion({ cancelPending: vi.fn() });
  const scrubber = createVideoScrubber({
    getMaxDimension: () => MAX_DIMENSION,
    getSelectedFile: () => get(selectedFile),
    isCurrentSelection,
    onFrameExtracted: (
      framePath,
      frameId,
      timestamp,
      videoPath,
      videoName,
      selection
    ) => {
      const entry = frameEntry(framePath, timestamp);
      entry.id = get(selectedFile)?.id ?? frameId;
      entry.videoPath = videoPath;
      entry.name = videoName;
      if (!setFile(entry, DATASET, { selection })) return null;
      const accepted = get(selectedFile);
      if (!accepted || accepted.contentRevision !== entry.contentRevision)
        return null;
      return accepted;
    },
    onFrameAccepted: analysis,
    onFrameReused: analysis,
    publishRequestedTime: (currentTime) => {
      const state = get(videoState);
      if (!state || !isCurrentSelection(state.selection)) return;
      setVideoState({ ...state, currentTime });
    },
    publishSettledFrame: (settledFrame) => {
      const state = get(videoState);
      if (
        !state ||
        state.selection.epoch !== settledFrame.selectionEpoch ||
        state.path !== settledFrame.videoPath ||
        state.currentTime !== settledFrame.requestedTime
      )
        return;
      setVideoState({
        ...state,
        posterPath: settledFrame.outputPath,
        settledFrame,
      });
    },
  });
  const unsubscribe = videoState.subscribe((state) => {
    scrubber.syncFromVideoState(state);
    scrubber.reconcileSettledFrame();
    ingestion.syncFromVideoState(state);
  });
  return {
    owner: scrubber,
    ingestion,
    analysis,
    dispose: () => {
      ingestion.dispose();
      scrubber.destroy();
      unsubscribe();
    },
  };
}

type Direction = 'home-to-values' | 'values-to-home';
type Stage = 'debounce' | 'active-ipc';
type StaleOrder = 'before-successor' | 'after-successor';

async function runHandoff(
  direction: Direction,
  stage: Stage,
  staleRejects = false,
  staleOrder: StaleOrder = 'before-successor'
) {
  const { revision } = seedSettledVideo();
  const stale = deferred<{ path: string; timestampUsed: string }>();
  const successor = deferred<{ path: string; timestampUsed: string }>();
  if (stage === 'active-ipc') {
    mocks.extractVideoFrame
      .mockReturnValueOnce(stale.promise)
      .mockReturnValueOnce(successor.promise);
  } else {
    mocks.extractVideoFrame.mockReturnValueOnce(successor.promise);
  }
  mocks.extractVideoFrame.mockClear();
  let source: Pick<MountedOwner<unknown>, 'analysis' | 'dispose'>;
  if (direction === 'home-to-values') {
    const home = mountHome();
    home.analysis.mockClear();
    home.owner.stepVideoFrames(1);
    source = home;
  } else {
    const values = mountValues();
    values.analysis.mockClear();
    values.owner.stepFrames(1);
    source = values;
  }

  expect(get(videoState)?.currentTime).toBe(REQUESTED_TIME);
  expect(get(videoState)?.settledFrame?.requestedTime).toBe(INITIAL_TIME);
  expect(get(selectedFile)?.contentRevision).toBe(revision);
  if (stage === 'active-ipc') {
    await vi.advanceTimersByTimeAsync(250);
    expect(mocks.extractVideoFrame).toHaveBeenCalledOnce();
  } else {
    expect(mocks.extractVideoFrame).not.toHaveBeenCalled();
  }

  source.dispose();
  const destination =
    direction === 'home-to-values' ? mountValues() : mountHome();
  destination.analysis.mockClear();
  await vi.advanceTimersByTimeAsync(250);
  expect(mocks.extractVideoFrame).toHaveBeenCalledTimes(
    stage === 'active-ipc' ? 2 : 1
  );

  const settleStale = async () => {
    if (stage !== 'active-ipc') return;
    if (staleRejects) stale.reject(new Error('disposed owner failed'));
    else
      stale.resolve({
        path: '/cache/disposed-owner.png',
        timestampUsed: INITIAL_TIME.toFixed(3),
      });
    await flushMicrotasks();
    expect(get(selectedFile)?.contentRevision).toBe(
      staleOrder === 'after-successor' ? revision + 1 : revision
    );
    expect(get(videoState)?.currentTime).toBe(REQUESTED_TIME);
  };

  if (staleOrder === 'before-successor') await settleStale();
  const outputPath = `/cache/${direction}-${stage}.png`;
  successor.resolve({
    path: outputPath,
    timestampUsed: REQUESTED_TIME.toFixed(3),
  });
  await vi.waitFor(() => expect(get(selectedFile)?.path).toBe(outputPath));
  if (staleOrder === 'after-successor') await settleStale();

  expect(get(images)).toHaveLength(1);
  expect(get(selectedFile)).toMatchObject({
    id: 'shared-frame',
    contentRevision: revision + 1,
    path: outputPath,
    videoPath: VIDEO_PATH,
    frameTimestamp: REQUESTED_TIME,
  });
  expect(get(videoState)).toMatchObject({
    currentTime: REQUESTED_TIME,
    settledFrame: {
      imageId: 'shared-frame',
      contentRevision: revision + 1,
      outputPath,
      videoPath: VIDEO_PATH,
      requestedTime: REQUESTED_TIME,
      maxDimension: MAX_DIMENSION,
    },
  });
  expect(source.analysis).not.toHaveBeenCalled();
  expect(destination.analysis).toHaveBeenCalledOnce();
  destination.dispose();
}

describe('AI-IMP-183 factory video-view handoff integration', () => {
  beforeEach(() => {
    installRuneShims();
    vi.useFakeTimers();
    vi.clearAllMocks();
    mocks.extractVideoFrame.mockReset();
    mocks.extractVideoStrip.mockReset();
    mocks.probeVideo.mockReset();
    clearFile();
    setVideoState(null);
    mocks.extractVideoStrip.mockReturnValue(new Promise(() => undefined));
    mocks.probeVideo.mockReturnValue(new Promise(() => undefined));
  });

  afterEach(() => {
    clearFile();
    setVideoState(null);
    vi.clearAllTimers();
    vi.useRealTimers();
    restoreRuneShims();
    vi.restoreAllMocks();
  });

  it.each([
    ['home-to-values' as const, 'debounce' as const],
    ['values-to-home' as const, 'debounce' as const],
  ])(
    'reacquires %s during %s under one successor revision',
    async (direction, stage) => runHandoff(direction, stage)
  );

  it.each([
    ['home-to-values' as const, false, 'before-successor' as const],
    ['home-to-values' as const, false, 'after-successor' as const],
    ['values-to-home' as const, true, 'before-successor' as const],
    ['values-to-home' as const, true, 'after-successor' as const],
  ])('rejects %s disposed IPC (%s, %s)', async (direction, rejects, order) => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    await runHandoff(direction, 'active-ipc', rejects, order);
    expect(error).not.toHaveBeenCalled();
  });

  it('reuses exact same-epoch stored settlement without extraction while destination analysis runs', () => {
    const { revision } = seedSettledVideo();
    const home = mountHome();
    home.analysis.mockClear();
    home.dispose();

    const values = mountValues();

    expect(mocks.extractVideoFrame).not.toHaveBeenCalled();
    expect(get(selectedFile)?.contentRevision).toBe(revision);
    expect(values.analysis).toHaveBeenCalledOnce();
    values.dispose();
  });

  it('reacquires a same-ID replaced entry instead of relabeling it', async () => {
    const { selection, revision } = seedSettledVideo();
    const staleState = get(videoState)!;
    expect(
      setFile(frameEntry('/cache/replaced.png', INITIAL_TIME), DATASET, {
        selection,
      })
    ).toBe(true);
    expect(get(selectedFile)?.contentRevision).toBe(revision + 1);
    setVideoState(staleState);
    mocks.extractVideoFrame.mockResolvedValue({
      path: '/cache/reacquired.png',
      timestampUsed: INITIAL_TIME.toFixed(3),
    });

    const values = mountValues();
    await vi.advanceTimersByTimeAsync(250);
    await vi.waitFor(() =>
      expect(get(selectedFile)?.path).toBe('/cache/reacquired.png')
    );

    expect(mocks.extractVideoFrame).toHaveBeenCalledOnce();
    expect(get(selectedFile)?.contentRevision).toBe(revision + 2);
    values.dispose();
  });

  it('reacquires a pending metadata probe in Values under the retained epoch and preserves requested state', async () => {
    const probe = deferred<{ duration: number; fps: number }>();
    mocks.probeVideo.mockReturnValue(probe.promise);
    mocks.probeVideo.mockClear();
    const selection = beginSelection('shared-frame');
    const pendingState: VideoState = {
      selection,
      path: VIDEO_PATH,
      name: VIDEO_NAME,
      duration: 0,
      fps: null,
      currentTime: 3,
      settledFrame: null,
      posterPath: '/cache/hint.png',
    };
    setVideoState(pendingState);
    mocks.extractVideoFrame.mockReturnValue(new Promise(() => undefined));

    const values = mountValues();
    expect(mocks.probeVideo).toHaveBeenCalledOnce();
    probe.resolve({ duration: 12, fps: 25 });
    await flushMicrotasks();

    expect(get(videoState)).toMatchObject({
      selection,
      duration: 12,
      fps: 25,
      currentTime: 3,
      settledFrame: null,
      posterPath: '/cache/hint.png',
    });
    expect(isCurrentSelection(selection)).toBe(true);
    values.dispose();
  });

  it('retains a cached playhead for a new Values selection and freshly extracts only that time', async () => {
    cacheVideoState(VIDEO_PATH, {
      duration: 10,
      fps: 24,
      currentTime: 7,
      stripPath: '/cache/cached-strip.png',
      stripId: 'cached-strip',
      posterPath: '/cache/cached-poster.png',
      frameId: 'cached-frame',
    });
    mocks.extractVideoFrame.mockResolvedValue({
      path: '/cache/fresh-cached-playhead.png',
      timestampUsed: '7.000',
    });
    mocks.extractVideoFrame.mockClear();
    const values = mountValues();

    values.ingestion.handleVideoFile(VIDEO_PATH, VIDEO_NAME);
    expect.soft(get(videoState)).toMatchObject({
      path: VIDEO_PATH,
      duration: 10,
      fps: 24,
      currentTime: 7,
      settledFrame: null,
      stripPath: '/cache/cached-strip.png',
      stripId: 'cached-strip',
      posterPath: '/cache/cached-poster.png',
    });
    expect(mocks.extractVideoFrame).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(250);
    await vi.waitFor(() =>
      expect(get(selectedFile)?.path).toBe('/cache/fresh-cached-playhead.png')
    );
    values.dispose();

    expect(mocks.extractVideoFrame).toHaveBeenCalledOnce();
    expect
      .soft(mocks.extractVideoFrame)
      .toHaveBeenCalledWith(
        expect.objectContaining({ path: VIDEO_PATH, timestamp: 7 })
      );
    expect.soft(get(videoState)?.settledFrame?.requestedTime).toBe(7);
  });

  it('reacquires after a pending Home probe despite a poster hint and keeps the intended frame ID', async () => {
    expect(
      setFile(
        {
          id: 'unrelated-still',
          name: 'still.png',
          path: '/tmp/still.png',
          size: 0,
          source: { kind: 'path', path: '/tmp/still.png' },
          previewUrl: 'asset:///tmp/still.png',
        },
        DATASET
      )
    ).toBe(true);
    const probe = deferred<{ duration: number; fps: number }>();
    mocks.probeVideo.mockReturnValue(probe.promise);
    mocks.probeVideo.mockClear();
    const selection = beginSelection('logical-video-frame');
    setVideoState({
      selection,
      path: VIDEO_PATH,
      name: VIDEO_NAME,
      duration: 0,
      fps: null,
      currentTime: 3,
      settledFrame: null,
      posterPath: '/cache/hint.png',
    });
    mocks.extractVideoFrame.mockResolvedValue({
      path: '/cache/home-successor.png',
      timestampUsed: '3.000',
    });

    const home = mountHome();
    expect(mocks.probeVideo).toHaveBeenCalledOnce();
    expect(mocks.extractVideoFrame).not.toHaveBeenCalled();
    probe.resolve({ duration: 12, fps: 25 });
    await flushMicrotasks();
    await vi.advanceTimersByTimeAsync(250);
    await vi.waitFor(() =>
      expect(get(selectedFile)?.path).toBe('/cache/home-successor.png')
    );

    expect(mocks.extractVideoFrame).toHaveBeenCalledWith({
      path: VIDEO_PATH,
      frameId: 'logical-video-frame',
      timestamp: 3,
      maxDimension: MAX_DIMENSION,
    });
    expect(get(selectedFile)).toMatchObject({
      id: 'logical-video-frame',
      videoPath: VIDEO_PATH,
      frameTimestamp: 3,
    });
    expect(get(images).some((file) => file.id === 'unrelated-still')).toBe(
      true
    );
    expect(get(videoState)).toMatchObject({
      selection,
      duration: 12,
      fps: 25,
      currentTime: 3,
      settledFrame: {
        imageId: 'logical-video-frame',
        outputPath: '/cache/home-successor.png',
        requestedTime: 3,
      },
    });
    expect(home.analysis).toHaveBeenCalledOnce();
    home.dispose();
  });
});
