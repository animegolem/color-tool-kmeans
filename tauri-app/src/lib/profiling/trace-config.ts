import type { AnalysisParams } from '../stores/analysis';
import type {
  ProfileAnalysisConfigRecord,
  ProfileRenderConfigRecord,
} from '../bridges/profiling';
import type {
  ProfileNativeRequestSettings,
  ProfileRenderExtras,
} from './trace-types';

const QUALITY = [
  [50_000, 1200],
  [100_000, 1600],
  [180_000, 2200],
  [260_000, 2600],
  [350_000, 3200],
] as const;

export function sameProfileRecord(a: object, b: object): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function cleanProfileDuration(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function createProfileAnalysisConfig(
  params: AnalysisParams
): ProfileAnalysisConfigRecord {
  const quality = Math.min(4, Math.max(0, Math.trunc(params.quality)));
  return {
    clusters: params.clusters,
    quality,
    sampleCap: QUALITY[quality][0],
    maxDimension: QUALITY[quality][1],
    ignoreTopN: params.ignoreTopN,
    mergeThreshold: params.mergeThreshold,
    snapToReal: params.snapToReal,
    seed: 1,
    maxIterations: 40,
    tolerance: 1e-3,
    warmStart: 'none',
  };
}

export function createProfileRenderConfig(
  params: AnalysisParams,
  extras: ProfileRenderExtras
): ProfileRenderConfigRecord {
  return {
    symbolScale: params.symbolScale,
    showClusterOutline: params.showClusterOutline,
    showAxisLabels: params.showAxisLabels,
    polarMode: params.polarMode,
    hueLightnessSizeMode: params.hueLightnessSizeMode,
    histogramSort: params.histogramSort,
    showHistogram: params.showHistogram,
    showPolarChart: params.showPolarChart,
    showHueLightness: params.showHueLightness,
    ...extras,
  };
}

export function createProfileNativeRequest(
  params: AnalysisParams
): ProfileNativeRequestSettings {
  return {
    clusters: params.clusters,
    quality: params.quality,
    ignoreTopN: params.ignoreTopN,
    mergeThreshold: params.mergeThreshold,
    snapToReal: params.snapToReal,
    minLum: 0,
    tolerance: 1e-3,
    maxIterations: 40,
    seed: 1,
    maxSamples: 300_000,
  };
}
