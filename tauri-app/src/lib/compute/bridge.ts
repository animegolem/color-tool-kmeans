import type { AnalysisParams, AnalysisResult, ImageSource } from '../stores/ui';
import type { ImageDataset } from './image-loader';
import {
  getComputeBridge,
  type AnalyzeOptions as BridgeAnalyzeOptions,
} from '../bridges/compute';
import type { AnalyzeInvocation } from './worker-client';
import { getActivePath } from '../services/active-image';

export interface AnalyzeOptions extends AnalysisParams {
  tol?: number;
  maxIter?: number;
  seed?: number;
  maxSamples?: number;
}

export function analyzeImage(
  source: ImageSource,
  params: AnalyzeOptions,
  invocation: AnalyzeInvocation
): Promise<AnalysisResult>;
export function analyzeImage(
  dataset: ImageDataset,
  params: AnalyzeOptions
): Promise<AnalysisResult>;
export async function analyzeImage(
  sourceOrDataset: ImageSource | ImageDataset,
  params: AnalyzeOptions,
  invocation?: AnalyzeInvocation
): Promise<AnalysisResult> {
  const merged: BridgeAnalyzeOptions = { ...params };
  const source: ImageSource =
    'kind' in sourceOrDataset
      ? sourceOrDataset
      : { kind: 'path', path: getActivePath() ?? '' };
  const fallbackController = new AbortController();
  const activeInvocation = invocation ?? {
    requestId:
      globalThis.crypto?.randomUUID?.() ??
      `analysis-${Date.now()}-${Math.random()}`,
    signal: fallbackController.signal,
  };
  return getComputeBridge().analyze(source, merged, activeInvocation);
}
