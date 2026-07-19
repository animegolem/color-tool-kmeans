import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

const mocks = vi.hoisted(() => ({
  extractVideoFrame: vi.fn(),
  tauriInvoke: vi.fn(),
}));

vi.mock('../bridges/video', () => ({
  extractVideoFrame: mocks.extractVideoFrame,
}));

vi.mock('../bridges/fs', () => ({
  isVideoFile: () => true,
}));

vi.mock('../bridges/tauri', () => ({
  isTauriEnv: () => true,
  tauriInvoke: mocks.tauriInvoke,
}));

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: (path: string) => `asset://${path}`,
}));

import { ingestFileAsEntry } from './media-ingestion';
import {
  appendFile,
  clearFile,
  images,
  setFile,
  updateEntryPreview,
} from '../stores/image';

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

function videoSelection() {
  return {
    name: 'video.mp4',
    path: '/tmp/video.mp4',
    size: 0,
    blob: new Blob([]),
    mimeType: 'video/mp4',
  };
}

describe('raw-video thumbnail ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tauriInvoke.mockResolvedValue(undefined);
    clearFile();
  });

  afterEach(() => {
    clearFile();
  });

  it('SWEEP-018: rejects a late thumbnail after a settled frame reuses the ID', async () => {
    const thumbnail = deferred<{ path: string; timestampUsed: string }>();
    mocks.extractVideoFrame.mockReturnValue(thumbnail.promise);
    const { entry, dataset } = ingestFileAsEntry(
      videoSelection(),
      updateEntryPreview
    );
    appendFile(entry, dataset);
    const settledPreview = 'asset:///cache/settled-frame.png';

    setFile(
      {
        ...entry,
        path: '/cache/settled-frame.png',
        frameTimestamp: 7,
        previewUrl: settledPreview,
      },
      dataset
    );
    thumbnail.resolve({
      path: '/cache/timestamp-zero-thumbnail.png',
      timestampUsed: '0.000',
    });
    await flushAsyncCompletion();

    const current = get(images).find((item) => item.id === entry.id);
    expect(current?.path).toBe('/cache/settled-frame.png');
    expect(current?.frameTimestamp).toBe(7);
    expect(current?.previewUrl).toBe(settledPreview);
  });

  it('SWEEP-018: applies the thumbnail while the expected raw entry is current', async () => {
    const thumbnail = deferred<{ path: string; timestampUsed: string }>();
    mocks.extractVideoFrame.mockReturnValue(thumbnail.promise);
    const { entry, dataset } = ingestFileAsEntry(
      videoSelection(),
      updateEntryPreview
    );
    appendFile(entry, dataset);

    thumbnail.resolve({
      path: '/cache/timestamp-zero-thumbnail.png',
      timestampUsed: '0.000',
    });
    await flushAsyncCompletion();

    const current = get(images).find((item) => item.id === entry.id);
    expect(current?.previewUrl).toBe(
      'asset:///cache/timestamp-zero-thumbnail.png'
    );
  });
});
