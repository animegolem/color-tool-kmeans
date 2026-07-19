import { beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import type { ImageDataset } from '../compute/image-loader';
import {
  clearFile,
  setFile,
  updateEntryPreview,
  type ImageEntry,
} from './image';
import {
  clearPins,
  multiAnalysisResult,
  multiAnalysisState,
  multiCompositePath,
  togglePin,
} from './multi-analysis';

const emptyDataset: ImageDataset = {
  width: 0,
  height: 0,
  pixels: new Uint8Array(),
};

function entry(frameTimestamp: number): ImageEntry {
  return {
    id: 'pinned-video',
    name: 'clip.mp4',
    path: `/cache/frame-${frameTimestamp}.png`,
    videoPath: '/tmp/clip.mp4',
    frameTimestamp,
    size: 0,
    source: { kind: 'path', path: `/cache/frame-${frameTimestamp}.png` },
    previewUrl: null,
  };
}

function seedReadyBatch() {
  multiAnalysisResult.set({
    clusters: [],
    iterations: 1,
    durationMs: 1,
    totalSamples: 1,
    variant: 'sweep',
  });
  multiCompositePath.set('/cache/old-grid.png');
  multiAnalysisState.set('ready');
}

describe('Batch pinned-media lifecycle', () => {
  beforeEach(() => {
    clearPins();
    clearFile();
  });

  it('SWEEP-017 invalidates Batch results when pinned pixels are replaced under the same ID', () => {
    setFile(entry(1), emptyDataset);
    togglePin('pinned-video');
    seedReadyBatch();

    setFile(entry(2), emptyDataset);

    expect(get(multiAnalysisState)).toBe('idle');
    expect(get(multiAnalysisResult)).toBeNull();
    expect(get(multiCompositePath)).toBeNull();
  });

  it('SWEEP-017 does not invalidate Batch for a preview-only update', () => {
    setFile(entry(1), emptyDataset);
    togglePin('pinned-video');
    seedReadyBatch();

    updateEntryPreview('pinned-video', 'asset:///cache/thumb.png');

    expect(get(multiAnalysisState)).toBe('ready');
    expect(get(multiAnalysisResult)).not.toBeNull();
  });
});
