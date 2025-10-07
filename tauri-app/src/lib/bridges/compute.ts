import { z } from 'zod';
import { isTauriEnv, tauriInvoke } from './tauri';
import type { ImageDataset } from '../compute/image-loader';
import { analyzeImageWasm } from '../compute/wasm';
import type { AnalysisParams, AnalysisResult } from '../stores/ui';

const DEFAULT_TOLERANCE = 1e-3;
const DEFAULT_MAX_ITER = 40;
const DEFAULT_MAX_SAMPLES = 300_000;
const DEFAULT_SEED = 1;

export interface AnalyzeOptions extends AnalysisParams {
  tol?: number;
  maxIter?: number;
  seed?: number;
  maxSamples?: number;
}

export interface ComputeBridge {
  readonly id: 'electron-native' | 'wasm' | 'tauri-native';
  analyze(dataset: ImageDataset, params: AnalyzeOptions): Promise<AnalysisResult>;
}

const tripleLikeSchema = z.union([
  z.instanceof(Float32Array),
  z.tuple([z.number(), z.number(), z.number()]),
  z.array(z.number()).min(3)
]);

const electronClusterSchema = z.object({
  count: z.number(),
  share: z.number(),
  centroidSpace: tripleLikeSchema,
  rgb: z.object({ r: z.number(), g: z.number(), b: z.number() }),
  hsv: tripleLikeSchema
});

const electronComputeResponseSchema = z.object({
  clusters: z.array(electronClusterSchema),
  iterations: z.number(),
  durationMs: z.number(),
  totalSamples: z.number(),
  variant: z.string().optional()
});

interface ElectronComputeParamsPayload {
  k: number;
  stride: number;
  minLum: number;
  space: AnalyzeOptions['colorSpace'];
  tol: number;
  maxIter: number;
  seed: number;
  maxSamples: number;
}

interface ElectronComputeRequest {
  dataset: {
    width: number;
    height: number;
    pixels: Uint8Array;
  };
  params: ElectronComputeParamsPayload;
}

type ElectronComputeResponse = z.infer<typeof electronComputeResponseSchema>;

function tupleFrom(value: unknown): [number, number, number] {
  if (value instanceof Float32Array) {
    return [value[0] ?? 0, value[1] ?? 0, value[2] ?? 0];
  }
  if (Array.isArray(value)) {
    return [Number(value[0]) || 0, Number(value[1]) || 0, Number(value[2]) || 0];
  }
  return [0, 0, 0];
}

function createElectronComputeBridge(): ComputeBridge | null {
  if (typeof window === 'undefined' || typeof window.electronAPI === 'undefined') {
    return null;
  }
  const api = window.electronAPI;
  if (!api || typeof api.analyzeImage !== 'function') {
    return null;
  }

  return {
    id: 'electron-native',
    async analyze(dataset, params) {
      const payload: ElectronComputeRequest = {
        dataset: {
          width: dataset.width,
          height: dataset.height,
          pixels: new Uint8Array(dataset.pixels)
        },
        params: {
          k: params.clusters,
          stride: params.stride,
          minLum: params.minLum,
          space: params.colorSpace,
          tol: params.tol ?? DEFAULT_TOLERANCE,
          maxIter: params.maxIter ?? DEFAULT_MAX_ITER,
          seed: params.seed ?? DEFAULT_SEED,
          maxSamples: params.maxSamples ?? DEFAULT_MAX_SAMPLES
        }
      };

      const parsed = electronComputeResponseSchema.parse(await api.analyzeImage(payload));
      const variant = parsed.variant ?? 'electron-native';
      const clusters = parsed.clusters.map((cluster) => ({
        count: cluster.count,
        share: cluster.share,
        centroidSpace: tupleFrom(cluster.centroidSpace),
        rgb: cluster.rgb,
        hsv: tupleFrom(cluster.hsv)
      })) as AnalysisResult['clusters'];

      return {
        clusters,
        iterations: parsed.iterations,
        durationMs: parsed.durationMs,
        totalSamples: parsed.totalSamples,
        variant
      } satisfies AnalysisResult;
    }
  } satisfies ComputeBridge;
}

function createWasmComputeBridge(): ComputeBridge {
  return {
    id: 'wasm',
    async analyze(dataset, params) {
      const response = await analyzeImageWasm(dataset.pixels, {
        width: dataset.width,
        height: dataset.height,
        k: params.clusters,
        stride: params.stride,
        minLum: params.minLum,
        space: params.colorSpace,
        tol: params.tol ?? DEFAULT_TOLERANCE,
        maxIter: params.maxIter ?? DEFAULT_MAX_ITER,
        seed: params.seed ?? DEFAULT_SEED,
        maxSamples: params.maxSamples ?? DEFAULT_MAX_SAMPLES
      });

      const clusters = response.clusters.map((cluster) => {
        const centroidSpace: [number, number, number] = [
          cluster.centroidSpace[0],
          cluster.centroidSpace[1],
          cluster.centroidSpace[2]
        ];
        const hsv: [number, number, number] = [cluster.hsv[0], cluster.hsv[1], cluster.hsv[2]];
        return {
          count: cluster.count,
          share: cluster.share,
          centroidSpace,
          rgb: cluster.rgb,
          hsv
        };
      }) as AnalysisResult['clusters'];

      return {
        clusters,
        iterations: response.iterations,
        durationMs: response.durationMs,
        totalSamples: response.totalSamples,
        variant: 'wasm'
      } satisfies AnalysisResult;
    }
  } satisfies ComputeBridge;
}

function createTauriComputeBridge(): ComputeBridge | null {
  if (!isTauriEnv()) return null;
  return {
    id: 'tauri-native',
    async analyze(_dataset, params) {
      const req = {
        path: (globalThis as any).__ACTIVE_IMAGE_PATH__ ?? '',
        k: params.clusters,
        stride: params.stride,
        minLum: params.minLum,
        space: params.colorSpace,
        tol: params.tol ?? DEFAULT_TOLERANCE,
        maxIter: params.maxIter ?? DEFAULT_MAX_ITER,
        seed: params.seed ?? DEFAULT_SEED,
        maxSamples: params.maxSamples ?? DEFAULT_MAX_SAMPLES
      };
      if (!req.path) {
        throw new Error('No image path available for native analysis');
      }
      const parsed = await tauriInvoke('analyze_image', { req });
      const clusters = (parsed.clusters ?? []).map((c: any) => ({
        count: c.count ?? 0,
        share: c.share ?? 0,
        centroidSpace: [c.centroid_space?.[0] ?? 0, c.centroid_space?.[1] ?? 0, c.centroid_space?.[2] ?? 0] as [number, number, number],
        rgb: c.rgb ?? { r: 0, g: 0, b: 0 },
        hsv: [c.hsv?.[0] ?? 0, c.hsv?.[1] ?? 0, c.hsv?.[2] ?? 0] as [number, number, number]
      })) as AnalysisResult['clusters'];

      return {
        clusters,
        iterations: parsed.iterations ?? 0,
        durationMs: parsed.duration_ms ?? parsed.durationMs ?? 0,
        totalSamples: parsed.total_samples ?? 0,
        variant: String(parsed.variant ?? 'tauri-native')
      } satisfies AnalysisResult;
    }
  } satisfies ComputeBridge;
}

function logSelection(label: string, id: ComputeBridge['id']) {
  console.info(`[bridges] ${label} bridge selected: ${id}`);
}

export function selectComputeBridge(): ComputeBridge {
  const tauriBridge = createTauriComputeBridge();
  if (tauriBridge) {
    logSelection('compute', tauriBridge.id);
    return tauriBridge;
  }
  const electronBridge = createElectronComputeBridge();
  if (electronBridge) {
    logSelection('compute', electronBridge.id);
    return electronBridge;
  }

  const fallback = createWasmComputeBridge();
  logSelection('compute', fallback.id);
  return fallback;
}

let cachedComputeBridge: ComputeBridge | null = null;

export function getComputeBridge(): ComputeBridge {
  if (!cachedComputeBridge) {
    cachedComputeBridge = selectComputeBridge();
  }
  return cachedComputeBridge;
}

export const computeBridge: ComputeBridge = typeof window === 'undefined'
  ? {
      id: 'wasm',
      async analyze() {
        throw new Error('computeBridge unavailable in non-browser context');
      }
    }
  : getComputeBridge();
