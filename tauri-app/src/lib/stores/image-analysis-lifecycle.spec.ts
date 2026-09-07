import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  analysisById,
  analysisState,
  setAnalysisSuccess,
  type AnalysisResult,
} from './analysis';
import {
  setValueAnalysisError,
  setValueAnalysisPending,
  setValueAnalysisSuccess,
  valueAnalysisByKey,
  valueAnalysisErrorByKey,
  valueAnalysisKey,
  valueAnalysisStateByKey,
  type ValueAnalysisResult,
} from './value-analysis';
import {
  appendFile,
  clearFile,
  getResourceCounts,
  images,
  removeFile,
  selectedFile,
  setFile,
  switchToFile,
  updateEntryPreview,
  type ImageEntry,
} from './image';

const emptyDataset = { width: 0, height: 0, pixels: new Uint8Array(0) };

function imageEntry(overrides: Partial<ImageEntry> = {}): ImageEntry {
  return {
    id: 'image-1',
    name: 'image.png',
    path: '/tmp/image.png',
    size: 0,
    source: { kind: 'path', path: '/tmp/image.png' },
    previewUrl: 'asset:///tmp/image.png',
    ...overrides,
  };
}

function colorResult(): AnalysisResult {
  return {
    clusters: [],
    iterations: 1,
    durationMs: 1,
    totalSamples: 1,
    variant: 'test',
  };
}

function valueResult(): ValueAnalysisResult {
  return {
    neutral: '/tmp/neutral.png',
    neutralWidth: 1,
    neutralHeight: 1,
    preview: '/tmp/preview.png',
    previewWidth: 1,
    previewHeight: 1,
    bucketMap: '/tmp/bucket.png',
    bucketMapData: [0],
    p10: 0.1,
    p90: 0.9,
    p01: 0.01,
    p99: 0.99,
    centroids: [0.5],
    boundaries: [],
    bucketValues: [0.5],
    counts: [1],
    histogramBins: [1],
    levels: 3,
    notanMode: false,
  };
}

function seedReadyAnalysis(imageId: string) {
  setAnalysisSuccess(colorResult(), imageId);
  setValueAnalysisSuccess(imageId, 3, false, valueResult());
}

describe('image analysis lifecycle', () => {
  beforeEach(() => {
    clearFile();
  });

  afterEach(() => {
    clearFile();
    vi.restoreAllMocks();
  });

  it('SWEEP-010: invalidates ready Colors and Values before publishing a matched setFile replacement', () => {
    const first = imageEntry({
      id: 'original-id',
      frameTimestamp: 1,
    });
    setFile(first, emptyDataset);
    seedReadyAnalysis(first.id);
    const valueKey = valueAnalysisKey(first.id, 3, false);
    const other = imageEntry({
      id: 'other-id',
      name: 'other.png',
      path: '/tmp/other.png',
      source: { kind: 'path', path: '/tmp/other.png' },
      previewUrl: 'asset:///tmp/other.png',
    });
    appendFile(other, emptyDataset);
    switchToFile(other.id);
    setAnalysisSuccess(colorResult(), other.id);
    expect(get(analysisState)).toBe('ready');
    let observedReplacement = false;
    const unsubscribe = images.subscribe((entries) => {
      const current = entries.find((entry) => entry.id === first.id);
      if (current?.frameTimestamp !== 2) return;
      observedReplacement = true;
      expect(get(analysisById)[first.id]).toBeUndefined();
      expect(get(valueAnalysisByKey)[valueKey]).toBeUndefined();
      expect(get(valueAnalysisStateByKey)[valueKey]).toBeUndefined();
      expect(get(analysisState)).toBe('idle');
    });

    setFile(
      imageEntry({
        id: 'caller-supplied-replacement-id',
        frameTimestamp: 2,
      }),
      { ...emptyDataset, width: 1 }
    );
    unsubscribe();

    expect(observedReplacement).toBe(true);
    expect(get(selectedFile)).toMatchObject({
      id: first.id,
      frameTimestamp: 2,
      dataset: { width: 1 },
    });
  });

  it('SWEEP-010: invalidates ready Colors and Values for a same-ID append replacement', () => {
    const first = imageEntry();
    setFile(first, emptyDataset);
    seedReadyAnalysis(first.id);
    const valueKey = valueAnalysisKey(first.id, 3, false);

    appendFile(
      imageEntry({
        name: 'replacement.png',
        path: '/tmp/replacement.png',
        source: { kind: 'path', path: '/tmp/replacement.png' },
        previewUrl: 'asset:///tmp/replacement.png',
      }),
      { ...emptyDataset, width: 2 }
    );

    expect(get(analysisById)[first.id]).toBeUndefined();
    expect(get(valueAnalysisByKey)[valueKey]).toBeUndefined();
    expect(get(valueAnalysisStateByKey)[valueKey]).toBeUndefined();
    expect(get(analysisState)).toBe('idle');
    expect(get(selectedFile)).toMatchObject({
      id: first.id,
      name: 'replacement.png',
      dataset: { width: 2 },
    });
  });

  it('SWEEP-010: rejects duplicate paths without replacing tracked resources', () => {
    const revokeObjectUrl = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {});
    appendFile(
      imageEntry({
        id: 'accepted',
        source: { kind: 'blob' },
        previewUrl: 'blob:accepted',
      }),
      emptyDataset
    );

    appendFile(
      imageEntry({
        id: 'rejected',
        source: { kind: 'blob' },
        previewUrl: 'blob:rejected',
      }),
      { ...emptyDataset, width: 99 }
    );

    expect(get(images)).toEqual([
      expect.objectContaining({ id: 'accepted', previewUrl: 'blob:accepted' }),
    ]);
    expect(getResourceCounts()).toEqual({
      images: 1,
      datasets: 1,
      objectUrls: 1,
    });
    expect(revokeObjectUrl).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:rejected');
  });

  it('SWEEP-010: rejects stale Values success and error after replacement invalidation', () => {
    const first = imageEntry();
    setFile(first, emptyDataset);
    const successToken = setValueAnalysisPending(first.id, 3, false);
    const errorToken = setValueAnalysisPending(first.id, 2, true);

    setFile({ ...first, frameTimestamp: 2 }, emptyDataset);
    setValueAnalysisSuccess(first.id, 3, false, valueResult(), successToken);
    setValueAnalysisError(first.id, 2, true, 'stale error', errorToken);

    const successKey = valueAnalysisKey(first.id, 3, false);
    const errorKey = valueAnalysisKey(first.id, 2, true);
    expect(get(valueAnalysisByKey)[successKey]).toBeUndefined();
    expect(get(valueAnalysisStateByKey)[successKey]).toBeUndefined();
    expect(get(valueAnalysisStateByKey)[errorKey]).toBeUndefined();
    expect(get(valueAnalysisErrorByKey)[errorKey]).toBeUndefined();
  });

  it('SWEEP-017: assigns safe store-owned revisions and normalizes the caller object', () => {
    const forgedValues = [
      undefined,
      -1,
      1.5,
      Number.MAX_SAFE_INTEGER + 1,
      Number.NaN,
    ];
    const revisions: number[] = [];

    for (const [index, forged] of forgedValues.entries()) {
      const entry = imageEntry({
        id: `revision-${index}`,
        name: `revision-${index}.png`,
        path: `/tmp/revision-${index}.png`,
        source: { kind: 'path', path: `/tmp/revision-${index}.png` },
        previewUrl: `asset:///tmp/revision-${index}.png`,
        contentRevision: forged,
      });
      appendFile(entry, emptyDataset);
      const stored = get(images).find((item) => item.id === entry.id);

      expect(Number.isSafeInteger(entry.contentRevision)).toBe(true);
      expect(entry.contentRevision).toBeGreaterThan(0);
      expect(stored?.contentRevision).toBe(entry.contentRevision);
      revisions.push(entry.contentRevision!);
    }

    expect(revisions).toEqual([...revisions].sort((a, b) => a - b));
    expect(new Set(revisions).size).toBe(revisions.length);
  });

  it('SWEEP-017: normalizes retained path identity and revision on the supplied entry', () => {
    const first = imageEntry({ id: 'retained-id' });
    setFile(first, emptyDataset);
    const firstRevision = first.contentRevision!;
    const replacement = imageEntry({
      id: 'forged-id',
      contentRevision: -99,
      frameTimestamp: 2,
    });

    setFile(replacement, { ...emptyDataset, width: 2 });

    expect(replacement.id).toBe(first.id);
    expect(replacement.contentRevision).toBeGreaterThan(firstRevision);
    expect(get(selectedFile)?.contentRevision).toBe(
      replacement.contentRevision
    );
  });

  it('SWEEP-017: rejects a duplicate path without consuming an admission revision', () => {
    const accepted = imageEntry({ id: 'accepted' });
    appendFile(accepted, emptyDataset);
    const acceptedRevision = accepted.contentRevision!;
    const rejected = imageEntry({
      id: 'rejected',
      contentRevision: Number.MAX_SAFE_INTEGER,
    });

    appendFile(rejected, emptyDataset);
    const next = imageEntry({
      id: 'next',
      name: 'next.png',
      path: '/tmp/next.png',
      source: { kind: 'path', path: '/tmp/next.png' },
      previewUrl: 'asset:///tmp/next.png',
    });
    appendFile(next, emptyDataset);

    expect(get(images).map((entry) => entry.id)).toEqual(['accepted', 'next']);
    expect(next.contentRevision).toBe(acceptedRevision + 1);
  });

  it('SWEEP-017: never recycles a revision after remove or clear', () => {
    const first = imageEntry({ id: 'reused-id' });
    appendFile(first, emptyDataset);
    const firstRevision = first.contentRevision!;
    removeFile(first.id);

    const second = imageEntry({ id: first.id });
    appendFile(second, emptyDataset);
    const secondRevision = second.contentRevision!;
    clearFile();

    const third = imageEntry({ id: first.id });
    setFile(third, emptyDataset);

    expect(secondRevision).toBeGreaterThan(firstRevision);
    expect(third.contentRevision).toBeGreaterThan(secondRevision);
  });

  it('SWEEP-017: preserves revision for preview updates and stored-entry selection', () => {
    const first = imageEntry({ id: 'stable-id' });
    const other = imageEntry({
      id: 'other-id',
      name: 'other.png',
      path: '/tmp/other.png',
      source: { kind: 'path', path: '/tmp/other.png' },
      previewUrl: 'asset:///tmp/other.png',
    });
    setFile(first, emptyDataset);
    appendFile(other, emptyDataset);
    const revision = first.contentRevision;

    updateEntryPreview(first.id, 'asset:///tmp/new-preview.png');
    switchToFile(other.id);
    switchToFile(first.id);

    expect(get(selectedFile)).toMatchObject({
      id: first.id,
      previewUrl: 'asset:///tmp/new-preview.png',
      contentRevision: revision,
    });
  });
});
