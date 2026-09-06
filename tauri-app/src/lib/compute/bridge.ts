import type { AnalysisParams, AnalysisResult } from '../stores/ui';
import type { ImageDataset } from './image-loader';
import {
  getComputeBridge,
  type AnalyzeOptions as BridgeAnalyzeOptions,
  type ComputeProfileObservation,
} from '../bridges/compute';

export interface AnalyzeOptions extends AnalysisParams {
  tol?: number;
  maxIter?: number;
  seed?: number;
  maxSamples?: number;
}

export async function analyzeImage(
  dataset: ImageDataset,
  params: AnalyzeOptions,
  observation?: ComputeProfileObservation
): Promise<AnalysisResult> {
  const merged: BridgeAnalyzeOptions = { ...params };
  const bridge = await getComputeBridge();
  return bridge.analyze(dataset, merged, observation);
}
