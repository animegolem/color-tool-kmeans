import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import type { FileSelection } from '../../bridges/fs';
import {
  activeImageId,
  appendFile,
  clearFile,
  images,
  type ImageEntry,
} from '../../stores/ui';
import { clearPins, pinnedImageIds } from '../../stores/multi-analysis';
import { processBatchSelections } from '../batch/batch-drop.svelte';

const emptyDataset = {
  width: 0,
  height: 0,
  pixels: new Uint8Array(0),
};

function selection(path: string): FileSelection {
  return {
    name: path.split('/').pop() ?? 'image.png',
    path,
    size: 0,
    blob: new Blob([], { type: 'image/png' }),
    mimeType: 'image/png',
  };
}

function entry(id: string, path: string): ImageEntry {
  return {
    id,
    name: path.split('/').pop() ?? 'image.png',
    path,
    size: 0,
    source: { kind: 'path', path },
    previewUrl: null,
  };
}

describe('Batch media ingestion', () => {
  beforeEach(() => {
    clearPins();
    clearFile();
  });

  afterEach(() => {
    clearPins();
    clearFile();
  });

  it('SWEEP-005 pins the retained ID when a later dialog selection duplicates an existing path', () => {
    appendFile(entry('retained-id', '/tmp/existing.png'), emptyDataset);

    const result = processBatchSelections(
      [selection('/tmp/new.png'), selection('/tmp/existing.png')],
      { maxPins: 36, activateFirst: true }
    );

    const storedImages = get(images);
    const pins = get(pinnedImageIds);
    expect(storedImages).toHaveLength(2);
    expect(result.ids).toEqual([get(activeImageId), 'retained-id']);
    expect(pins).toEqual(new Set(result.ids));
    expect(
      [...pins].every((id) => storedImages.some((image) => image.id === id))
    ).toBe(true);
  });
});
