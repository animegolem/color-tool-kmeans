import { beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import type { ImageDataset } from '../compute/image-loader';
import { clearFile, removeFile, setFile, type ImageEntry } from './image';
import {
  setValueAnalysisPending,
  setValueAnalysisSuccess,
  valueAnalysisByKey,
  valueAnalysisKey,
  valueAnalysisStateByKey,
  type ValueAnalysisResult,
} from './value-analysis';

const emptyDataset: ImageDataset = {
  width: 0,
  height: 0,
  pixels: new Uint8Array(),
};

function entry(id: string): ImageEntry {
  return {
    id,
    name: `${id}.png`,
    path: `/tmp/${id}.png`,
    size: 0,
    source: { kind: 'path', path: `/tmp/${id}.png` },
    previewUrl: null,
  };
}

function completeAfterRemoval(id: string, token: number) {
  setValueAnalysisSuccess(id, 3, false, {} as ValueAnalysisResult, token);
}

describe('Values analysis media lifecycle ownership', () => {
  beforeEach(() => {
    clearFile();
  });

  it('SWEEP-006 rejects an in-flight completion after its media is removed', () => {
    const file = entry('removed');
    setFile(file, emptyDataset);
    const token = setValueAnalysisPending(file.id, 3, false);

    removeFile(file.id);
    completeAfterRemoval(file.id, token);

    const key = valueAnalysisKey(file.id, 3, false);
    expect(get(valueAnalysisByKey)[key]).toBeUndefined();
    expect(get(valueAnalysisStateByKey)[key]).toBeUndefined();
  });

  it('SWEEP-006 rejects all in-flight completions after clearing media', () => {
    const first = entry('first');
    const second = entry('second');
    setFile(first, emptyDataset);
    setFile(second, emptyDataset);
    const firstToken = setValueAnalysisPending(first.id, 3, false);
    const secondToken = setValueAnalysisPending(second.id, 3, false);

    clearFile();
    completeAfterRemoval(first.id, firstToken);
    completeAfterRemoval(second.id, secondToken);

    expect(get(valueAnalysisByKey)).toEqual({});
    expect(get(valueAnalysisStateByKey)).toEqual({});
  });
});
