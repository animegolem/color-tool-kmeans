import { beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import type { ImageDataset } from '../compute/image-loader';
import {
  analysisById,
  setAnalysisSuccess,
  type AnalysisResult,
} from './analysis';
import { clearFile, setFile, type ImageEntry } from './image';

const emptyDataset: ImageDataset = {
  width: 0,
  height: 0,
  pixels: new Uint8Array(),
};

function entry(id: string, path = '/tmp/replaced.png'): ImageEntry {
  return {
    id,
    name: 'replaced.png',
    path,
    size: 0,
    source: { kind: 'path', path },
    previewUrl: null,
  };
}

function analysisResult(): AnalysisResult {
  return {
    clusters: [],
    iterations: 1,
    durationMs: 1,
    totalSamples: 1,
    variant: 'sweep',
  };
}

describe('Colors analysis media lifecycle', () => {
  beforeEach(() => {
    clearFile();
  });

  it('SWEEP-010 invalidates Colors analysis when native bytes replace the same path', () => {
    const original = entry('retained-id');
    setFile(original, emptyDataset);
    setAnalysisSuccess(analysisResult(), original.id);

    setFile(entry('fresh-id'), emptyDataset);

    expect(get(analysisById)[original.id]).toBeUndefined();
  });

  it('SWEEP-010 preserves Colors analysis only for explicit session restoration', () => {
    const original = entry('retained-id');
    setFile(original, emptyDataset);
    setAnalysisSuccess(analysisResult(), original.id);

    setFile(entry('fresh-id'), emptyDataset, {
      preserveColorAnalysis: true,
    });

    expect(get(analysisById)[original.id]).toBeDefined();
  });
});
