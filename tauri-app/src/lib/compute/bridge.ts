import type { AnalysisParams, AnalysisResult } from '../stores/ui';
import type { ImageDataset } from './image-loader';
import {
  getComputeBridge,
  type AnalyzeOptions as BridgeAnalyzeOptions,
} from '../bridges/compute';

export interface AnalyzeOptions extends AnalysisParams {
  tol?: number;
  maxIter?: number;
  seed?: number;
  maxSamples?: number;
}

export async function analyzeImage(
  dataset: ImageDataset,
  params: AnalyzeOptions
): Promise<AnalysisResult> {
  const merged: BridgeAnalyzeOptions = { ...params };
  const bridge = await getComputeBridge();
  return bridge.analyze(dataset, merged);
}

export async function analyzeImagePath(
  path: string,
  params: AnalyzeOptions
): Promise<AnalysisResult> {
  const merged: BridgeAnalyzeOptions = { ...params };
  const bridge = await getComputeBridge();
  return bridge.analyzePath(path, merged);
}
