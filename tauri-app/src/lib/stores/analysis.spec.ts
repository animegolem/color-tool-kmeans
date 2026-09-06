import { beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import {
  analysisById,
  analysisError,
  analysisState,
  resetAnalysis,
  setAnalysisError,
  setAnalysisPending,
  setAnalysisSuccess,
  type AnalysisResult,
} from './analysis';

const RESULT: AnalysisResult = {
  clusters: [
    {
      count: 1,
      share: 1,
      centroidSpace: [0.5, 0, 0],
      oklab: [0.5, 0, 0],
      oklch: [0.5, 0, 0],
      rgb: { r: 128, g: 128, b: 128 },
      hsv: [0, 0, 0.5],
    },
  ],
  iterations: 1,
  durationMs: 2,
  totalSamples: 1,
  variant: 'test',
};

beforeEach(() => {
  resetAnalysis();
  analysisById.set({});
});

describe('analysis store acceptance receipts', () => {
  it('accepts the current success token after preserving writes', () => {
    const token = setAnalysisPending();
    const receipt = setAnalysisSuccess(RESULT, 'image-a', token);

    expect(receipt).toEqual({ status: 'accepted', imageId: 'image-a' });
    expect(get(analysisById)).toEqual({ 'image-a': RESULT });
    expect(get(analysisState)).toBe('ready');
    expect(get(analysisError)).toBeNull();
    expect(Object.isFrozen(receipt)).toBe(true);
  });

  it('rejects a stale success token without changing state or cache', () => {
    const staleToken = setAnalysisPending();
    setAnalysisPending();
    const beforeCache = get(analysisById);
    const receipt = setAnalysisSuccess(RESULT, 'image-a', staleToken);

    expect(receipt).toEqual({ status: 'stale-token', imageId: 'image-a' });
    expect(get(analysisById)).toBe(beforeCache);
    expect(get(analysisState)).toBe('pending');
    expect(get(analysisError)).toBeNull();
  });

  it('keeps the optional-token legacy success behavior', () => {
    const receipt = setAnalysisSuccess(RESULT, null);

    expect(receipt).toEqual({ status: 'accepted', imageId: null });
    expect(get(analysisById)).toEqual({});
    expect(get(analysisState)).toBe('ready');
    expect(get(analysisError)).toBeNull();
  });

  it('accepts an error for the current token with the original write order', () => {
    const seen: string[] = [];
    const unError = analysisError.subscribe((value) =>
      seen.push(`error:${value}`)
    );
    const unState = analysisState.subscribe((value) =>
      seen.push(`state:${value}`)
    );
    const token = setAnalysisPending();
    seen.length = 0;

    const receipt = setAnalysisError('failed', token);

    expect(receipt).toEqual({ status: 'accepted-error' });
    expect(seen).toEqual(['error:failed', 'state:error']);
    expect(get(analysisError)).toBe('failed');
    expect(get(analysisState)).toBe('error');
    unError();
    unState();
  });

  it('rejects a stale error and preserves current pending state', () => {
    const staleToken = setAnalysisPending();
    setAnalysisPending();
    const receipt = setAnalysisError('stale failure', staleToken);

    expect(receipt).toEqual({ status: 'stale-token' });
    expect(get(analysisError)).toBeNull();
    expect(get(analysisState)).toBe('pending');
  });

  it('keeps the optional-token legacy error behavior', () => {
    const receipt = setAnalysisError('legacy failure');

    expect(receipt).toEqual({ status: 'accepted-error' });
    expect(get(analysisError)).toBe('legacy failure');
    expect(get(analysisState)).toBe('error');
  });
});
