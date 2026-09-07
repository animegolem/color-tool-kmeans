import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

const mocks = vi.hoisted(() => ({
  probeVideo: vi.fn(),
}));

vi.mock('../../bridges/video', () => ({
  probeVideo: mocks.probeVideo,
}));

vi.mock('../../bridges/tauri', () => ({
  isTauriEnv: () => true,
  tauriInvoke: vi.fn(async () => undefined),
}));

vi.mock('../../services/drag-drop', () => ({
  setupTauriDragDrop: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: (path: string) => `asset://${path}`,
}));

import type { FileSelection } from '../../bridges/fs';
import {
  appendFile,
  clearActiveSelection,
  clearFile,
  getCurrentSelection,
  images,
  isCurrentSelection,
  removeFile,
  selectedFile,
  setFile,
  setVideoState,
  switchToFile,
  videoState,
  type ImageEntry,
} from '../../stores/ui';
import { createValuesFileIngestion } from './file-ingestion-values.svelte';

const DATASET = { width: 0, height: 0, pixels: new Uint8Array(0) };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function entry(id: string, path: string, video = false): ImageEntry {
  return {
    id,
    name: path.split('/').at(-1) ?? id,
    path,
    videoPath: video ? path : undefined,
    size: 0,
    source: { kind: 'path', path },
    previewUrl: video ? null : `asset://${path}`,
  };
}

function stillSelection(path = '/tmp/b.png'): FileSelection {
  return {
    name: path.split('/').at(-1) ?? 'b.png',
    path,
    size: 4,
    blob: new Blob([]),
    mimeType: 'image/png',
  };
}

async function settleMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('Values selection-owned video probe lifecycle', () => {
  beforeEach(() => {
    mocks.probeVideo.mockReset();
    clearFile();
  });

  afterEach(() => {
    clearFile();
    vi.restoreAllMocks();
  });

  it.each([
    {
      label: 'stored still switch',
      supersede: (ingestion: ReturnType<typeof createValuesFileIngestion>) => {
        void ingestion;
        switchToFile('b');
      },
    },
    {
      label: 'still replacement',
      supersede: (ingestion: ReturnType<typeof createValuesFileIngestion>) =>
        ingestion.handleImageFile(stillSelection()),
    },
    {
      label: 'active target removal',
      supersede: (ingestion: ReturnType<typeof createValuesFileIngestion>) => {
        void ingestion;
        removeFile('a');
      },
    },
    {
      label: 'active clear',
      supersede: (ingestion: ReturnType<typeof createValuesFileIngestion>) => {
        void ingestion;
        clearActiveSelection();
      },
    },
    {
      label: 'full clear',
      supersede: (ingestion: ReturnType<typeof createValuesFileIngestion>) => {
        void ingestion;
        clearFile();
      },
    },
  ])(
    'AI-IMP-192: late probe success cannot defeat a newer $label',
    async ({ supersede }) => {
      const probe = deferred<{ duration: number; fps: number }>();
      mocks.probeVideo.mockReturnValue(probe.promise);
      setFile(entry('b', '/tmp/b.png'), DATASET);
      appendFile(entry('a', '/tmp/a.mp4', true), DATASET);
      const ingestion = createValuesFileIngestion({ cancelPending: vi.fn() });
      ingestion.handleVideoFile('/tmp/a.mp4', 'a.mp4');
      const staleSelection = get(videoState)!.selection;

      supersede(ingestion);
      const expectedSelection = getCurrentSelection();
      probe.resolve({ duration: 10, fps: 24 });
      await settleMicrotasks();

      expect(isCurrentSelection(staleSelection)).toBe(false);
      expect(getCurrentSelection()).toEqual(expectedSelection);
      expect(get(videoState)?.selection.epoch).not.toBe(staleSelection.epoch);
    }
  );

  it('AI-IMP-192: late probe rejection cannot log or clear a newer still', async () => {
    const probe = deferred<{ duration: number; fps: number }>();
    mocks.probeVideo.mockReturnValue(probe.promise);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    setFile(entry('b', '/tmp/b.png'), DATASET);
    appendFile(entry('a', '/tmp/a.mp4', true), DATASET);
    const ingestion = createValuesFileIngestion({ cancelPending: vi.fn() });
    ingestion.handleVideoFile('/tmp/a.mp4', 'a.mp4');

    switchToFile('b');
    probe.reject(new Error('stale probe failure'));
    await settleMicrotasks();

    expect(error).not.toHaveBeenCalled();
    expect(get(videoState)).toBeNull();
    expect(get(selectedFile)?.id).toBe('b');
  });

  it('AI-IMP-192: a newer video wins even when the older probe settles last', async () => {
    const probeA = deferred<{ duration: number; fps: number }>();
    const probeB = deferred<{ duration: number; fps: number }>();
    mocks.probeVideo.mockImplementation((path: string) =>
      path === '/tmp/a.mp4' ? probeA.promise : probeB.promise
    );
    const ingestion = createValuesFileIngestion({ cancelPending: vi.fn() });

    ingestion.handleVideoFile('/tmp/a.mp4', 'a.mp4');
    ingestion.handleVideoFile('/tmp/b.mp4', 'b.mp4');
    const selectionB = get(videoState)!.selection;
    probeB.resolve({ duration: 20, fps: 30 });
    await settleMicrotasks();
    probeA.resolve({ duration: 10, fps: 24 });
    await settleMicrotasks();

    expect(get(videoState)).toMatchObject({
      selection: selectionB,
      path: '/tmp/b.mp4',
      duration: 20,
      fps: 30,
    });
  });

  it('AI-IMP-192: returning to the same path starts a new request and rejects the first visit', async () => {
    const firstA = deferred<{ duration: number; fps: number }>();
    const probeB = deferred<{ duration: number; fps: number }>();
    const secondA = deferred<{ duration: number; fps: number }>();
    mocks.probeVideo
      .mockReturnValueOnce(firstA.promise)
      .mockReturnValueOnce(probeB.promise)
      .mockReturnValueOnce(secondA.promise);
    const ingestion = createValuesFileIngestion({ cancelPending: vi.fn() });

    ingestion.handleVideoFile('/tmp/a.mp4', 'a.mp4');
    const firstSelection = get(videoState)!.selection;
    ingestion.handleVideoFile('/tmp/b.mp4', 'b.mp4');
    ingestion.handleVideoFile('/tmp/a.mp4', 'a.mp4');
    const secondSelection = get(videoState)!.selection;
    firstA.resolve({ duration: 99, fps: 99 });
    await settleMicrotasks();
    secondA.resolve({ duration: 12, fps: 25 });
    await settleMicrotasks();

    expect(secondSelection.epoch).toBeGreaterThan(firstSelection.epoch);
    expect(get(videoState)).toMatchObject({
      selection: secondSelection,
      path: '/tmp/a.mp4',
      duration: 12,
      fps: 25,
    });
  });

  it('AI-IMP-192: current probe success retains its epoch and publishes measured metadata', async () => {
    const probe = deferred<{ duration: number; fps: number }>();
    mocks.probeVideo.mockReturnValue(probe.promise);
    const cancelPending = vi.fn();
    const ingestion = createValuesFileIngestion({ cancelPending });

    ingestion.handleVideoFile('/tmp/current.mp4', 'current.mp4');
    const selection = get(videoState)!.selection;
    expect(get(videoState)).toMatchObject({ duration: 0, fps: null });
    probe.resolve({ duration: 8, fps: 23.976 });
    await settleMicrotasks();

    expect(get(videoState)).toMatchObject({
      selection,
      duration: 8,
      fps: 23.976,
    });
    expect(getCurrentSelection().epoch).toBe(selection.epoch);
    expect(cancelPending).toHaveBeenCalledOnce();
  });

  it('AI-IMP-183: current probe merges metadata without erasing an overlapping accepted frame', async () => {
    const probe = deferred<{ duration: number; fps: number }>();
    mocks.probeVideo.mockReturnValue(probe.promise);
    const ingestion = createValuesFileIngestion({ cancelPending: vi.fn() });

    ingestion.handleVideoFile('/tmp/current.mp4', 'current.mp4');
    const provisional = get(videoState)!;
    const frame: ImageEntry = {
      id: 'current-frame',
      name: 'current.mp4',
      path: '/cache/current-frame.png',
      videoPath: '/tmp/current.mp4',
      frameTimestamp: 3,
      size: 0,
      source: { kind: 'path', path: '/cache/current-frame.png' },
      previewUrl: 'asset:///cache/current-frame.png',
    };
    expect(setFile(frame, DATASET, { selection: provisional.selection })).toBe(
      true
    );
    const accepted = get(selectedFile)!;
    setVideoState({
      ...provisional,
      currentTime: 3,
      posterPath: accepted.path,
      settledFrame: {
        selectionEpoch: provisional.selection.epoch,
        imageId: accepted.id,
        contentRevision: accepted.contentRevision!,
        outputPath: accepted.path!,
        videoPath: accepted.videoPath!,
        requestedTime: accepted.frameTimestamp!,
        maxDimension: 1200,
      },
    });

    probe.resolve({ duration: 8, fps: 23.976 });
    await settleMicrotasks();

    expect(get(videoState)).toMatchObject({
      selection: provisional.selection,
      duration: 8,
      fps: 23.976,
      currentTime: 3,
      posterPath: '/cache/current-frame.png',
      settledFrame: {
        imageId: 'current-frame',
        contentRevision: accepted.contentRevision,
        requestedTime: 3,
      },
    });
  });

  it('AI-IMP-192: current probe rejection owns its error and leaves provisional state explicit', async () => {
    const probe = deferred<{ duration: number; fps: number }>();
    mocks.probeVideo.mockReturnValue(probe.promise);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const ingestion = createValuesFileIngestion({ cancelPending: vi.fn() });

    ingestion.handleVideoFile('/tmp/current.mp4', 'current.mp4');
    const selection = get(videoState)!.selection;
    probe.reject(new Error('current failure'));
    await settleMicrotasks();

    expect(error).toHaveBeenCalledOnce();
    expect(get(videoState)).toMatchObject({
      selection,
      path: '/tmp/current.mp4',
      duration: 0,
      fps: null,
    });
    expect(isCurrentSelection(selection)).toBe(true);
  });

  it('AI-IMP-192: an inactive batch append does not retarget the selected still', async () => {
    setFile(entry('current', '/tmp/current.png'), DATASET);
    const selected = getCurrentSelection();
    const ingestion = createValuesFileIngestion({ cancelPending: vi.fn() });

    await ingestion.processBatch([
      stillSelection('/tmp/current.png'),
      stillSelection('/tmp/inactive.png'),
    ]);

    expect(getCurrentSelection().epoch).toBe(selected.epoch + 1);
    expect(getCurrentSelection().mediaId).toBe('current');
    expect(get(images)).toHaveLength(2);
  });

  it.each([
    { label: 'success', rejects: false },
    { label: 'rejection', rejects: true },
  ])(
    'AI-IMP-183: terminal disposal rejects late probe $label without resurrection',
    async ({ rejects }) => {
      const probe = deferred<{ duration: number; fps: number }>();
      mocks.probeVideo.mockReturnValue(probe.promise);
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const ingestion = createValuesFileIngestion({ cancelPending: vi.fn() });

      ingestion.handleVideoFile('/tmp/disposed.mp4', 'disposed.mp4');
      const provisional = get(videoState);
      ingestion.dispose();
      ingestion.dispose();
      ingestion.handleVideoFile('/tmp/resurrected.mp4', 'resurrected.mp4');
      if (rejects) probe.reject(new Error('disposed probe failed'));
      else probe.resolve({ duration: 99, fps: 99 });
      await settleMicrotasks();

      expect(get(videoState)).toEqual(provisional);
      expect(error).not.toHaveBeenCalled();
      expect(mocks.probeVideo).toHaveBeenCalledOnce();
    }
  );

  it('AI-IMP-183: a successor reacquires pending metadata in the same epoch and merges it', async () => {
    const staleProbe = deferred<{ duration: number; fps: number }>();
    const successorProbe = deferred<{ duration: number; fps: number }>();
    mocks.probeVideo
      .mockReturnValueOnce(staleProbe.promise)
      .mockReturnValueOnce(successorProbe.promise);
    const retired = createValuesFileIngestion({ cancelPending: vi.fn() });
    retired.handleVideoFile('/tmp/handoff.mp4', 'handoff.mp4');
    const provisional = get(videoState)!;
    videoState.set({
      ...provisional,
      currentTime: 3,
      posterPath: '/cache/hint.png',
    });
    retired.dispose();

    const successor = createValuesFileIngestion({ cancelPending: vi.fn() });
    successor.syncFromVideoState(get(videoState));
    successor.syncFromVideoState(get(videoState));
    staleProbe.resolve({ duration: 99, fps: 99 });
    await settleMicrotasks();
    expect(get(videoState)?.duration).toBe(0);

    successorProbe.resolve({ duration: 12, fps: 25 });
    await settleMicrotasks();

    expect(get(videoState)).toMatchObject({
      selection: provisional.selection,
      path: '/tmp/handoff.mp4',
      duration: 12,
      fps: 25,
      currentTime: 3,
      posterPath: '/cache/hint.png',
      settledFrame: null,
    });
    expect(mocks.probeVideo).toHaveBeenCalledTimes(2);
    successor.dispose();
  });
});
