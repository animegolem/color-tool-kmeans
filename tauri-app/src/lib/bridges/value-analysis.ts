import { z } from 'zod';
import type { ValueAnalysisResult } from '../stores/ui';
import { isTauriEnv, tauriInvoke } from './tauri';

type ValueAnalysisErrorCode =
  | 'not-tauri'
  | 'invoke-failed'
  | 'invalid-response';

export class ValueAnalysisError extends Error {
  readonly code: ValueAnalysisErrorCode;

  constructor(
    code: ValueAnalysisErrorCode,
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message);
    this.name = 'ValueAnalysisError';
    this.code = code;
    if (options?.cause !== undefined) {
      (this as any).cause = options.cause;
    }
  }
}

const finiteNumberSchema = z
  .number()
  .refine((value) => Number.isFinite(value), {
    message: 'must be a finite number',
  });

const valueAnalysisResponseSchema = z
  .object({
    neutral: z.string().min(1),
    neutralWidth: finiteNumberSchema.min(1, {
      message: 'neutralWidth must be >= 1',
    }),
    neutralHeight: finiteNumberSchema.min(1, {
      message: 'neutralHeight must be >= 1',
    }),
    preview: z.string().min(1),
    previewWidth: finiteNumberSchema.min(1, {
      message: 'previewWidth must be >= 1',
    }),
    previewHeight: finiteNumberSchema.min(1, {
      message: 'previewHeight must be >= 1',
    }),
    bucketMap: z.string().min(1),
    bucketMapData: z.array(finiteNumberSchema),
    p10: finiteNumberSchema,
    p90: finiteNumberSchema,
    p01: finiteNumberSchema,
    p99: finiteNumberSchema,
    centroids: z.array(finiteNumberSchema).min(1),
    boundaries: z.array(finiteNumberSchema),
    bucketValues: z.array(finiteNumberSchema).min(1),
    counts: z.array(z.number().int().nonnegative()),
    histogramBins: z.array(z.number().int().nonnegative()),
    levels: z.number().int().min(2).max(5),
    notanMode: z.boolean(),
  })
  .readonly();

type ParsedValueAnalysis = z.infer<typeof valueAnalysisResponseSchema>;

function normalizeValueAnalysisResponse(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const payload = raw as Record<string, unknown>;
  return {
    neutral: typeof payload.neutral === 'string' ? payload.neutral : '',
    neutralWidth: Number(
      payload.neutralWidth ?? (payload as any).neutral_width
    ),
    neutralHeight: Number(
      payload.neutralHeight ?? (payload as any).neutral_height
    ),
    preview: typeof payload.preview === 'string' ? payload.preview : '',
    previewWidth: Number(
      payload.previewWidth ?? (payload as any).preview_width
    ),
    previewHeight: Number(
      payload.previewHeight ?? (payload as any).preview_height
    ),
    bucketMap:
      typeof payload.bucketMap === 'string'
        ? payload.bucketMap
        : typeof (payload as any).bucket_map === 'string'
          ? (payload as any).bucket_map
          : '',
    bucketMapData: Array.isArray(payload.bucketMapData)
      ? payload.bucketMapData.map(Number)
      : Array.isArray((payload as any).bucket_map_data)
        ? (payload as any).bucket_map_data.map(Number)
        : [],
    p10: Number(payload.p10),
    p90: Number(payload.p90),
    p01: Number(payload.p01),
    p99: Number(payload.p99),
    centroids: Array.isArray(payload.centroids)
      ? payload.centroids.map(Number)
      : [],
    boundaries: Array.isArray(payload.boundaries)
      ? payload.boundaries.map(Number)
      : [],
    bucketValues: Array.isArray(payload.bucketValues)
      ? payload.bucketValues.map(Number)
      : Array.isArray((payload as any).bucket_values)
        ? (payload as any).bucket_values.map(Number)
        : [],
    counts: Array.isArray(payload.counts) ? payload.counts.map(Number) : [],
    histogramBins: Array.isArray(payload.histogramBins)
      ? payload.histogramBins.map(Number)
      : Array.isArray((payload as any).histogram_bins)
        ? (payload as any).histogram_bins.map(Number)
        : [],
    levels: Number(payload.levels ?? (payload as any).levels),
    notanMode: Boolean(payload.notanMode ?? (payload as any).notan_mode),
  };
}

function parseValueAnalysisResponse(raw: unknown): ParsedValueAnalysis {
  const normalized = normalizeValueAnalysisResponse(raw);
  try {
    return valueAnalysisResponseSchema.parse(normalized);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issue = error.issues[0];
      const path = issue?.path?.length ? issue.path.join('.') : 'response';
      const detail = issue?.message ?? 'unknown validation error';
      throw new ValueAnalysisError(
        'invalid-response',
        `Invalid value_analysis response: ${path} ${detail}`,
        { cause: error }
      );
    }
    throw error;
  }
}

export async function requestValueAnalysis(
  path: string,
  imageId: string,
  levels: number,
  notanMode: boolean
): Promise<ValueAnalysisResult> {
  if (!isTauriEnv()) {
    throw new ValueAnalysisError(
      'not-tauri',
      'Value analysis requires the Tauri runtime.'
    );
  }
  if (!path) {
    throw new ValueAnalysisError(
      'invoke-failed',
      'Missing image path for value analysis.'
    );
  }
  let rawResponse: unknown;
  try {
    rawResponse = await tauriInvoke('value_analysis', {
      req: { path, imageId, levels, notanMode },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ValueAnalysisError(
      'invoke-failed',
      `Tauri value_analysis invoke failed: ${message}`,
      {
        cause: err,
      }
    );
  }
  const parsed = parseValueAnalysisResponse(rawResponse);
  return {
    neutral: parsed.neutral,
    neutralWidth: parsed.neutralWidth,
    neutralHeight: parsed.neutralHeight,
    preview: parsed.preview,
    previewWidth: parsed.previewWidth,
    previewHeight: parsed.previewHeight,
    bucketMap: parsed.bucketMap,
    bucketMapData: parsed.bucketMapData,
    p10: parsed.p10,
    p90: parsed.p90,
    p01: parsed.p01,
    p99: parsed.p99,
    centroids: parsed.centroids,
    boundaries: parsed.boundaries,
    bucketValues: parsed.bucketValues,
    counts: parsed.counts,
    histogramBins: parsed.histogramBins,
    levels: parsed.levels,
    notanMode: parsed.notanMode,
  };
}
