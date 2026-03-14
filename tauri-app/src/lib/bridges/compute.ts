import { z } from 'zod';
import { isTauriEnv, tauriInvoke, tauriDetectionInfo } from './tauri';
import { getActivePath } from '../services/active-image';
import type { ImageDataset } from '../compute/image-loader';
import type { AnalysisParams, AnalysisResult } from '../stores/ui';

const DEFAULT_TOLERANCE = 1e-3;
const DEFAULT_MAX_ITER = 40;
const DEFAULT_MAX_SAMPLES = 300_000;
const DEFAULT_SEED = 1;
const DEFAULT_QUALITY = 2;
const DEFAULT_IGNORE_TOP_N = 0;
const DEFAULT_MERGE_THRESHOLD = 0;

export interface AnalyzeOptions extends AnalysisParams {
  tol?: number;
  maxIter?: number;
  seed?: number;
  maxSamples?: number;
}

export interface ComputeBridge {
  readonly id: 'tauri-native';
  analyze(dataset: ImageDataset, params: AnalyzeOptions): Promise<AnalysisResult>;
}

type TauriComputeErrorCode = 'missing-path' | 'invoke-failed' | 'invalid-response';

export class TauriComputeError extends Error {
  readonly code: TauriComputeErrorCode;

  constructor(code: TauriComputeErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'TauriComputeError';
    this.code = code;
    if (options?.cause !== undefined) {
      (this as any).cause = options.cause;
    }
  }
}

const finiteNumberSchema = z
  .number()
  .refine((value) => Number.isFinite(value), { message: 'must be a finite number' });

const tauriClusterSchema = z
  .object({
    count: finiteNumberSchema.min(0, { message: 'count must be >= 0' }),
    share: finiteNumberSchema,
    centroidSpace: z.any().optional(),
    centroid_space: z.any().optional(),
    oklab: z.any().optional(),
    oklch: z.any().optional(),
    ok_lab: z.any().optional(),
    ok_lch: z.any().optional(),
    rgb: z
      .object({
        r: finiteNumberSchema,
        g: finiteNumberSchema,
        b: finiteNumberSchema
      })
      .refine(
        (value) => value.r >= 0 && value.r <= 255 && value.g >= 0 && value.g <= 255 && value.b >= 0 && value.b <= 255,
        { message: 'rgb components must be within 0-255' }
      ),
    hsv: z.any()
  })
  .transform((data, ctx) => {
    const sourceCentroid = data.centroidSpace ?? data.centroid_space;
    const oklabSource = data.oklab ?? data.ok_lab ?? sourceCentroid;
    const oklchSource = data.oklch ?? data.ok_lch;
    const centroid = coerceTriple(sourceCentroid);
    const oklab = coerceTriple(oklabSource);
    const oklch = coerceTriple(oklchSource);
    if (!centroid) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['centroidSpace'], message: 'centroidSpace must contain three finite numbers' });
    }
    if (!oklab) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['oklab'], message: 'oklab must contain three finite numbers' });
    }
    if (!oklch) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['oklch'], message: 'oklch must contain three finite numbers' });
    }
    const hsvTriple = coerceTriple(data.hsv);
    if (!hsvTriple) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['hsv'], message: 'hsv must contain three finite numbers' });
    }
    if (ctx.issues.length > 0) {
      return z.NEVER;
    }
    return {
      count: data.count,
      share: data.share,
      centroidSpace: centroid as [number, number, number],
      oklab: oklab as [number, number, number],
      oklch: oklch as [number, number, number],
      rgb: data.rgb,
      hsv: hsvTriple as [number, number, number]
    };
  });

const tauriComputeResponseSchema = z
  .object({
    clusters: z.array(tauriClusterSchema).min(1, {
      message: 'clusters missing or empty'
    }),
    iterations: finiteNumberSchema.min(0, { message: 'iterations must be >= 0' }),
    durationMs: finiteNumberSchema.min(0, { message: 'durationMs must be >= 0' }),
    totalSamples: finiteNumberSchema.min(0, { message: 'totalSamples must be >= 0' }),
    variant: z.string().min(1, { message: 'variant must be provided' })
  })
  .readonly();

type ParsedTauriCluster = z.infer<typeof tauriClusterSchema>;
type ParsedTauriResponse = z.infer<typeof tauriComputeResponseSchema>;

function coerceTriple(value: unknown): [number, number, number] | null {
  if (value instanceof Float32Array || value instanceof ArrayBuffer) {
    value = Array.from(value as ArrayLike<number>);
  }
  if (Array.isArray(value) && value.length >= 3) {
    const numbers = value.slice(0, 3).map((entry) => Number(entry));
    if (numbers.every((n) => Number.isFinite(n))) {
      return [numbers[0], numbers[1], numbers[2]];
    }
  }
  return null;
}

function normalizeTauriCluster(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const cluster = raw as Record<string, unknown>;
  const centroidSource = cluster.centroidSpace ?? cluster.centroid_space;
  const oklabSource = cluster.oklab ?? cluster.ok_lab ?? centroidSource;
  const oklchSource = cluster.oklch ?? cluster.ok_lch;
  const rgb = cluster.rgb as Record<string, unknown> | undefined;
  return {
    count: Number(cluster.count),
    share: Number(cluster.share),
    centroidSpace: centroidSource,
    centroid_space: centroidSource,
    oklab: oklabSource,
    ok_lab: oklabSource,
    oklch: oklchSource,
    ok_lch: oklchSource,
    rgb: rgb
      ? {
          r: Number(rgb.r),
          g: Number(rgb.g),
          b: Number(rgb.b)
        }
      : undefined,
    hsv: cluster.hsv
  };
}

function normalizeTauriResponse(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const payload = raw as Record<string, unknown>;
  const clustersValue = Array.isArray(payload.clusters) ? payload.clusters : [];
  return {
    clusters: clustersValue.map((entry) => normalizeTauriCluster(entry)),
    iterations: Number(payload.iterations),
    durationMs: Number((payload as any).durationMs ?? (payload as any).duration_ms),
    totalSamples: Number((payload as any).totalSamples ?? (payload as any).total_samples),
    variant: payload.variant
  };
}

function parseTauriResponse(raw: unknown): ParsedTauriResponse {
  const normalized = normalizeTauriResponse(raw);
  try {
    return tauriComputeResponseSchema.parse(normalized);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issue = error.issues[0];
      const path = issue?.path?.length ? issue.path.join('.') : 'response';
      const detail = issue?.message ?? 'unknown validation error';
      throw new TauriComputeError('invalid-response', `Invalid analyze_image response: ${path} ${detail}`, {
        cause: error
      });
    }
    throw error;
  }
}

function createTauriComputeBridge(): ComputeBridge | null {
  if (!isTauriEnv()) return null;
  return {
    id: 'tauri-native',
    async analyze(_dataset, params) {
      const req = {
        path: getActivePath() ?? '',
        k: params.clusters,
        quality: params.quality ?? DEFAULT_QUALITY,
        ignoreTopN: params.ignoreTopN ?? DEFAULT_IGNORE_TOP_N,
        mergeThreshold: params.mergeThreshold ?? DEFAULT_MERGE_THRESHOLD,
        snapToReal: params.snapToReal ?? false,
        minLum: 0,
        tol: params.tol ?? DEFAULT_TOLERANCE,
        maxIter: params.maxIter ?? DEFAULT_MAX_ITER,
        seed: params.seed ?? DEFAULT_SEED,
        maxSamples: params.maxSamples ?? DEFAULT_MAX_SAMPLES
      };
      if (!req.path) {
        throw new TauriComputeError('missing-path', 'No image path available for native analysis');
      }
      let rawResponse: unknown;
      try {
        rawResponse = await tauriInvoke('analyze_image', { req });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new TauriComputeError('invoke-failed', `Tauri analyze_image invoke failed: ${message}`, { cause: err });
      }

      const parsed = parseTauriResponse(rawResponse);
      const clusters = parsed.clusters.map((cluster: ParsedTauriCluster) => ({
        count: cluster.count,
        share: cluster.share,
        centroidSpace: cluster.centroidSpace,
        oklab: cluster.oklab,
        oklch: cluster.oklch,
        rgb: cluster.rgb,
        hsv: cluster.hsv
      })) as AnalysisResult['clusters'];

      return {
        clusters,
        iterations: parsed.iterations,
        durationMs: parsed.durationMs,
        totalSamples: parsed.totalSamples,
        variant: String(parsed.variant ?? 'tauri-native')
      } satisfies AnalysisResult;
    }
  } satisfies ComputeBridge;
}

function logSelection(label: string, id: ComputeBridge['id']) {
  console.info(`[bridges] ${label} bridge selected: ${id}`);
}

function selectComputeBridge(): ComputeBridge {
  const tauriBridge = createTauriComputeBridge();
  if (tauriBridge) {
    const info = tauriDetectionInfo();
    console.info('[bridges] tauri detection', info);
    logSelection('compute', tauriBridge.id);
    return tauriBridge;
  }
  throw new Error('Tauri environment not detected. Native compute requires Tauri runtime.');
}

let cachedComputeBridge: ComputeBridge | null = null;

export function getComputeBridge(): ComputeBridge {
  if (!cachedComputeBridge) {
    cachedComputeBridge = selectComputeBridge();
  }
  return cachedComputeBridge;
}
