import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { clearActivePath, getActivePath } from './active-image';
import {
  activeImageId,
  beginSelection,
  clearFile,
  getCurrentSelection,
  images,
  isCurrentSelection,
  setFile,
  setVideoState,
  videoState,
} from '../stores/ui';
import {
  ingestClipboardImage,
  type ClipboardIngestionDeps,
} from './clipboard-ingestion';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function blob(type = 'image/png') {
  return new Blob([new Uint8Array([1, 2, 3])], { type });
}

function createDeps(
  overrides: Partial<ClipboardIngestionDeps> = {}
): ClipboardIngestionDeps {
  return {
    beginSelection,
    isCurrentSelection,
    appCacheDir: vi.fn(async () => '/cache'),
    convertFileSrc: vi.fn(async (path: string) => `asset://${path}`),
    readBlob: vi.fn(async () => new Uint8Array([1, 2, 3]).buffer),
    saveFile: vi.fn(async () => undefined),
    setFile,
    setVideoState,
    setActivePath: (path) => {
      (globalThis as { __ACTIVE_IMAGE_PATH__?: string }).__ACTIVE_IMAGE_PATH__ =
        path;
    },
    now: () => Date.UTC(2026, 8, 6, 12, 34, 56),
    createId: () => 'paste-id',
    ...overrides,
  };
}

describe('clipboard image ingestion selection authority', () => {
  beforeEach(() => {
    clearFile();
    clearActivePath();
    videoState.set(null);
  });

  afterEach(() => {
    clearFile();
    clearActivePath();
    videoState.set(null);
    vi.restoreAllMocks();
  });

  it('AI-IMP-192: begins supported intent before the first async wait', async () => {
    const cacheDir = deferred<string>();
    const deps = createDeps({ appCacheDir: vi.fn(() => cacheDir.promise) });
    const before = getCurrentSelection();

    const pending = ingestClipboardImage(blob(), deps);

    expect(getCurrentSelection()).toEqual({
      epoch: before.epoch + 1,
      mediaId: null,
    });
    expect(deps.appCacheDir).toHaveBeenCalledOnce();
    expect(deps.readBlob).not.toHaveBeenCalled();
    cacheDir.resolve('/cache');
    await pending;
  });

  it('AI-IMP-192: current success admits once and then publishes path and video clearing', async () => {
    const deps = createDeps();

    const result = await ingestClipboardImage(blob(), deps);

    expect(result.status).toBe('accepted');
    expect(isCurrentSelection(result.selection)).toBe(true);
    expect(get(images)).toEqual([
      expect.objectContaining({
        id: 'paste-id',
        name: 'paste-123456.png',
        path: '/cache/clipboard/paste-1788698096000.png',
        source: {
          kind: 'path',
          path: '/cache/clipboard/paste-1788698096000.png',
        },
        previewUrl: 'asset:///cache/clipboard/paste-1788698096000.png',
      }),
    ]);
    expect(get(activeImageId)).toBe('paste-id');
    expect(getActivePath()).toBe('/cache/clipboard/paste-1788698096000.png');
    expect(get(videoState)).toBeNull();
    expect(deps.saveFile).toHaveBeenCalledWith(
      '/cache/clipboard/paste-1788698096000.png',
      [1, 2, 3]
    );
  });

  it('AI-IMP-192: a newer selection suppresses stale save success and all follow-ups', async () => {
    const save = deferred<void>();
    const setVideo = vi.fn(setVideoState);
    const setPath = vi.fn();
    const deps = createDeps({
      saveFile: vi.fn(() => save.promise),
      setVideoState: setVideo,
      setActivePath: setPath,
    });
    const pending = ingestClipboardImage(blob(), deps);
    await vi.waitFor(() => expect(deps.saveFile).toHaveBeenCalledOnce());
    const newer = beginSelection('newer');

    save.resolve();
    const result = await pending;

    expect(result.status).toBe('stale');
    expect(isCurrentSelection(newer)).toBe(true);
    expect(get(images)).toEqual([]);
    expect(setVideo).not.toHaveBeenCalled();
    expect(setPath).not.toHaveBeenCalled();
  });

  it('AI-IMP-192: a second paste wins and the first cannot return on the same pipeline', async () => {
    const firstSave = deferred<void>();
    let nextId = 0;
    const saveFile = vi
      .fn()
      .mockImplementationOnce(() => firstSave.promise)
      .mockResolvedValueOnce(undefined);
    const deps = createDeps({
      createId: () => `paste-${++nextId}`,
      saveFile,
    });

    const first = ingestClipboardImage(blob(), deps);
    await vi.waitFor(() => expect(saveFile).toHaveBeenCalledOnce());
    const second = await ingestClipboardImage(blob(), deps);
    firstSave.resolve();
    const stale = await first;

    expect(second.status).toBe('accepted');
    expect(stale.status).toBe('stale');
    expect(get(images).map((entry) => entry.id)).toEqual(['paste-1']);
    expect(get(activeImageId)).toBe('paste-1');
  });

  it('AI-IMP-192: stale failure is suppressed after a newer selection', async () => {
    const save = deferred<void>();
    const deps = createDeps({ saveFile: vi.fn(() => save.promise) });
    const pending = ingestClipboardImage(blob(), deps);
    await vi.waitFor(() => expect(deps.saveFile).toHaveBeenCalledOnce());
    const newer = beginSelection('newer');

    save.reject(new Error('old save failed'));

    await expect(pending).resolves.toMatchObject({ status: 'stale' });
    expect(isCurrentSelection(newer)).toBe(true);
    expect(get(images)).toEqual([]);
  });

  it('AI-IMP-192: current failure remains observable and admits nothing', async () => {
    const deps = createDeps({
      saveFile: vi.fn(async () => {
        throw new Error('current save failed');
      }),
    });

    await expect(ingestClipboardImage(blob(), deps)).rejects.toThrow(
      'current save failed'
    );
    expect(get(images)).toEqual([]);
    expect(getActivePath()).toBeUndefined();
  });

  it('AI-IMP-192: unsupported MIME does not revoke current selection or start IO', async () => {
    const deps = createDeps();
    const current = beginSelection('current');

    await expect(
      ingestClipboardImage(blob('text/plain'), deps)
    ).rejects.toThrow('Unsupported clipboard image MIME type');

    expect(getCurrentSelection()).toEqual(current);
    expect(deps.appCacheDir).not.toHaveBeenCalled();
    expect(deps.saveFile).not.toHaveBeenCalled();
  });
});
