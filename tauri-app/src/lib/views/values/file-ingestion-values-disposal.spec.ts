import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

const mocks = vi.hoisted(() => ({
  probeVideo: vi.fn(),
}));

vi.mock('../../bridges/video', () => ({
  probeVideo: mocks.probeVideo,
}));

vi.mock('../../bridges/fs', () => ({
  getFsBridge: vi.fn(),
  isVideoFile: () => false,
}));

vi.mock('../../bridges/tauri', () => ({
  isTauriEnv: () => true,
}));

vi.mock('../../services/media-ingestion', () => ({
  ingestFileAsEntry: vi.fn(),
}));

vi.mock('../../services/active-image', () => ({
  setActivePath: vi.fn(),
}));

vi.mock('../../services/drag-drop', () => ({
  setupTauriDragDrop: vi.fn(),
}));

import { createValuesFileIngestion } from './file-ingestion-values.svelte';
import { setVideoState, videoState, videoStateCache } from '../../stores/video';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

async function flushAsyncCompletion() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('Values video ingestion disposal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    videoState.set(null);
    videoStateCache.set({});
  });

  afterEach(() => {
    videoState.set(null);
    videoStateCache.set({});
  });

  it('SWEEP-023: a disposed Values owner cannot publish its late probe', async () => {
    const probe = deferred<{ duration: number; fps: number }>();
    mocks.probeVideo.mockReturnValue(probe.promise);
    const ingestion = createValuesFileIngestion({ cancelPending: vi.fn() });

    ingestion.handleVideoFile('/tmp/old-owner.mp4', 'old-owner.mp4');
    expect(mocks.probeVideo).toHaveBeenCalledTimes(1);

    ingestion.dispose();
    setVideoState({
      path: '/tmp/new-owner.mp4',
      name: 'new-owner.mp4',
      duration: 20,
      fps: 30,
      currentTime: 0,
    });
    probe.resolve({ duration: 10, fps: 24 });
    await flushAsyncCompletion();

    expect(get(videoState)?.path).toBe('/tmp/new-owner.mp4');
  });
});
