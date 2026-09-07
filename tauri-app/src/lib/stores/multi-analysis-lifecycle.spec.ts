import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import type { AnalysisResult } from './analysis';
import {
  appendFile,
  clearFile,
  images,
  removeFile,
  setFile,
  switchToFile,
  updateEntryPreview,
  type ImageEntry,
} from './image';
import {
  clearPins,
  multiAnalysisError,
  multiAnalysisResult,
  multiAnalysisState,
  multiCompositePath,
  pinnedImageIds,
  pinnedImages,
  resetMultiAnalysis,
  togglePin,
} from './multi-analysis';

const emptyDataset = { width: 0, height: 0, pixels: new Uint8Array(0) };

function imageEntry(id: string): ImageEntry {
  return {
    id,
    name: `${id}.png`,
    path: `/tmp/${id}.png`,
    size: 0,
    source: { kind: 'path', path: `/tmp/${id}.png` },
    previewUrl: `asset:///tmp/${id}.png`,
  };
}

function result(variant: string): AnalysisResult {
  return {
    clusters: [],
    iterations: 1,
    durationMs: 1,
    totalSamples: 1,
    variant,
  };
}

function loadThreeImages() {
  const first = imageEntry('first');
  const second = imageEntry('second');
  const third = imageEntry('third');
  setFile(first, emptyDataset);
  appendFile(second, emptyDataset);
  appendFile(third, emptyDataset);
  return { first, second, third };
}

function pinReady(firstId: string, secondId: string) {
  togglePin(secondId);
  togglePin(firstId);
  const readyResult = result('ready');
  multiAnalysisState.set('ready');
  multiAnalysisResult.set(readyResult);
  multiAnalysisError.set('old error');
  multiCompositePath.set('/tmp/composite.png');
  return readyResult;
}

describe('multi-analysis content lifecycle', () => {
  beforeEach(() => {
    clearPins();
    clearFile();
    resetMultiAnalysis();
  });

  afterEach(() => {
    clearPins();
    clearFile();
    resetMultiAnalysis();
  });

  it('SWEEP-017: invalidates a ready aggregate when pinned content is readmitted', () => {
    const { first, second } = loadThreeImages();
    pinReady(first.id, second.id);
    const pinOrder = [...get(pinnedImageIds)];
    const priorRevision = first.contentRevision!;

    appendFile(first, { ...emptyDataset, width: 2 });

    expect(first.contentRevision).toBeGreaterThan(priorRevision);
    expect([...get(pinnedImageIds)]).toEqual(pinOrder);
    expect(get(multiAnalysisState)).toBe('idle');
    expect(get(multiAnalysisResult)).toBeNull();
    expect(get(multiAnalysisError)).toBeNull();
    expect(get(multiCompositePath)).toBeNull();
  });

  it('SWEEP-017: preserves a ready aggregate when unpinned content changes', () => {
    const { first, second, third } = loadThreeImages();
    const readyResult = pinReady(first.id, second.id);

    appendFile(third, { ...emptyDataset, width: 3 });

    expect(get(multiAnalysisState)).toBe('ready');
    expect(get(multiAnalysisResult)).toBe(readyResult);
    expect(get(multiAnalysisError)).toBe('old error');
    expect(get(multiCompositePath)).toBe('/tmp/composite.png');
  });

  it('SWEEP-017: preserves a ready aggregate across pinned preview metadata updates', () => {
    const { first, second } = loadThreeImages();
    const readyResult = pinReady(first.id, second.id);
    const revision = first.contentRevision;

    updateEntryPreview(first.id, 'asset:///tmp/updated-preview.png');

    expect(
      get(images).find((entry) => entry.id === first.id)?.contentRevision
    ).toBe(revision);
    expect(get(multiAnalysisState)).toBe('ready');
    expect(get(multiAnalysisResult)).toBe(readyResult);
  });

  it('SWEEP-017: preserves a ready aggregate across unchanged stored-entry selection', () => {
    const { first, second } = loadThreeImages();
    const readyResult = pinReady(first.id, second.id);
    const revisions = get(pinnedImages).map((entry) => entry.contentRevision);

    switchToFile(second.id);
    switchToFile(first.id);

    expect(get(pinnedImages).map((entry) => entry.contentRevision)).toEqual(
      revisions
    );
    expect(get(multiAnalysisState)).toBe('ready');
    expect(get(multiAnalysisResult)).toBe(readyResult);
  });

  it('SWEEP-017: prunes removed pins in place and resets the aggregate', () => {
    const { first, second } = loadThreeImages();
    pinReady(first.id, second.id);

    removeFile(second.id);

    expect([...get(pinnedImageIds)]).toEqual([first.id]);
    expect(get(pinnedImages).map((entry) => entry.id)).toEqual([first.id]);
    expect(get(multiAnalysisState)).toBe('idle');
    expect(get(multiAnalysisResult)).toBeNull();
    expect(get(multiCompositePath)).toBeNull();
  });
});
