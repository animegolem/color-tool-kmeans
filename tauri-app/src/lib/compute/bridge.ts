import type { AnalysisParams, AnalysisResult } from '../stores/ui';
import type { ImageDataset } from './image-loader';
import { analyzeImageWasm } from './wasm';

export interface AnalyzeOptions extends AnalysisParams {
  tol?: number;
  maxIter?: number;
  seed?: number;
  maxSamples?: number;
}

export async function analyzeImage(dataset: ImageDataset, params: AnalyzeOptions): Promise<AnalysisResult> {
  const payload = {
    width: dataset.width,
    height: dataset.height,
    k: params.clusters,
    stride: params.stride,
    minLum: params.minLum,
    space: params.colorSpace,
    tol: params.tol ?? 1e-3,
    maxIter: params.maxIter ?? 40,
    seed: params.seed ?? 1,
    maxSamples: params.maxSamples ?? 300_000
  };

  const start = performance.now();
  const result = await analyzeImageWasm(dataset.pixels, payload);
  const durationOverride = performance.now() - start;

  return {
    clusters: result.clusters,
    iterations: result.iterations,
    durationMs: result.durationMs ?? durationOverride,
    totalSamples: result.totalSamples,
    variant: result.variant ?? 'wasm'
  };
}
