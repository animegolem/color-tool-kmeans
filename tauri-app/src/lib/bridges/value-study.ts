import { z } from 'zod';
import { isTauriEnv, tauriInvoke } from './tauri';

export interface ValueStudyResult {
  tiles: string[];
  neutral: string;
  width: number;
  height: number;
  percentileLow: number;
  percentileHigh: number;
}

type ValueStudyErrorCode = 'not-tauri' | 'invoke-failed' | 'invalid-response';

export class ValueStudyError extends Error {
  readonly code: ValueStudyErrorCode;

  constructor(code: ValueStudyErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'ValueStudyError';
    this.code = code;
    if (options?.cause !== undefined) {
      (this as any).cause = options.cause;
    }
  }
}

const finiteNumberSchema = z
  .number()
  .refine((value) => Number.isFinite(value), { message: 'must be a finite number' });

const valueStudyResponseSchema = z
  .object({
    tiles: z.array(z.string().min(1)).min(9, { message: 'tiles must include 9 paths' }),
    neutral: z.string().min(1),
    width: finiteNumberSchema.min(1, { message: 'width must be >= 1' }),
    height: finiteNumberSchema.min(1, { message: 'height must be >= 1' }),
    percentileLow: finiteNumberSchema,
    percentileHigh: finiteNumberSchema
  })
  .readonly();

type ParsedValueStudy = z.infer<typeof valueStudyResponseSchema>;

function normalizeValueStudyResponse(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const payload = raw as Record<string, unknown>;
  return {
    tiles: Array.isArray(payload.tiles) ? payload.tiles : [],
    neutral: typeof payload.neutral === 'string' ? payload.neutral : '',
    width: Number(payload.width),
    height: Number(payload.height),
    percentileLow: Number(payload.percentileLow ?? (payload as any).percentile_low),
    percentileHigh: Number(payload.percentileHigh ?? (payload as any).percentile_high)
  };
}

function parseValueStudyResponse(raw: unknown): ParsedValueStudy {
  const normalized = normalizeValueStudyResponse(raw);
  try {
    return valueStudyResponseSchema.parse(normalized);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issue = error.issues[0];
      const path = issue?.path?.length ? issue.path.join('.') : 'response';
      const detail = issue?.message ?? 'unknown validation error';
      throw new ValueStudyError('invalid-response', `Invalid value_study response: ${path} ${detail}`, {
        cause: error
      });
    }
    throw error;
  }
}

export async function requestValueStudy(path: string, imageId: string): Promise<ValueStudyResult> {
  if (!isTauriEnv()) {
    throw new ValueStudyError('not-tauri', 'Value study requires the Tauri runtime.');
  }
  if (!path) {
    throw new ValueStudyError('invoke-failed', 'Missing image path for value study.');
  }
  let rawResponse: unknown;
  try {
    rawResponse = await tauriInvoke('value_study', { req: { path, imageId } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ValueStudyError('invoke-failed', `Tauri value_study invoke failed: ${message}`, { cause: err });
  }
  const parsed = parseValueStudyResponse(rawResponse);
  return {
    tiles: parsed.tiles,
    neutral: parsed.neutral,
    width: parsed.width,
    height: parsed.height,
    percentileLow: parsed.percentileLow,
    percentileHigh: parsed.percentileHigh
  };
}
