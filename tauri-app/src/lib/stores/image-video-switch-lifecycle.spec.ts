import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import type { ImageDataset } from '../compute/image-loader';
import {
  activeImageId,
  appendFile,
  clearActiveSelection,
  clearFile,
  pendingVideoSwitch,
  setFile,
  switchToFile,
  switchToVideo,
  type ImageEntry,
} from './image';

const emptyDataset: ImageDataset = {
  width: 0,
  height: 0,
  pixels: new Uint8Array(),
};

function still(id: string): ImageEntry {
  return {
    id,
    name: `${id}.png`,
    path: `/tmp/${id}.png`,
    size: 0,
    source: { kind: 'path', path: `/tmp/${id}.png` },
    previewUrl: null,
  };
}

describe('pending raw-video switch lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearFile();
  });

  afterEach(() => {
    clearFile();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('SWEEP-013: a newer setFile activation cancels the debounced video', () => {
    switchToVideo('older-video');

    setFile(still('newer-still'), emptyDataset);
    vi.advanceTimersByTime(150);

    expect(get(activeImageId)).toBe('newer-still');
    expect(get(pendingVideoSwitch)).toBeNull();
  });

  it('SWEEP-013: switching to a still clears an already-published event', () => {
    appendFile(still('newer-still'), emptyDataset);
    switchToVideo('older-video');
    vi.advanceTimersByTime(150);
    expect(get(pendingVideoSwitch)?.id).toBe('older-video');

    switchToFile('newer-still');

    const replayed: string[] = [];
    const unsubscribe = pendingVideoSwitch.subscribe((pending) => {
      if (pending) replayed.push(pending.id);
    });
    unsubscribe();
    expect(get(activeImageId)).toBe('newer-still');
    expect(replayed).toEqual([]);
  });

  it('SWEEP-013: an older frame completion cannot cancel a newer video switch', () => {
    switchToVideo('newer-video');

    setFile(
      {
        ...still('older-frame'),
        videoPath: '/tmp/older-video.mp4',
        frameTimestamp: 1,
      },
      emptyDataset
    );
    vi.advanceTimersByTime(150);

    expect(get(pendingVideoSwitch)?.id).toBe('newer-video');
  });

  it('SWEEP-013: active and full clears cancel timer and published event', () => {
    switchToVideo('debounced-video');
    clearActiveSelection();
    vi.advanceTimersByTime(150);
    expect(get(pendingVideoSwitch)).toBeNull();

    switchToVideo('published-video');
    vi.advanceTimersByTime(150);
    expect(get(pendingVideoSwitch)?.id).toBe('published-video');

    clearFile();
    expect(get(pendingVideoSwitch)).toBeNull();
  });
});
