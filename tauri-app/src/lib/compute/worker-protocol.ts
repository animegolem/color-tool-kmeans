import { z } from 'zod';

const finiteNumber = z.number().refine(Number.isFinite, {
  message: 'must be a finite number',
});

export const resolvedAnalyzeOptionsSchema = z
  .object({
    path: z.string(),
    k: z.number().int().positive(),
    quality: z.number().int().min(0).max(4),
    ignoreTopN: z.number().int().nonnegative(),
    mergeThreshold: finiteNumber.nonnegative(),
    snapToReal: z.boolean(),
    minLum: z.number().int().min(0).max(255),
    tol: finiteNumber.nonnegative(),
    maxIter: z.number().int().positive(),
    seed: z.number().int().nonnegative(),
    maxSamples: z.number().int().positive(),
  })
  .strict();

export type ResolvedAnalyzeOptions = z.infer<
  typeof resolvedAnalyzeOptionsSchema
>;

const workerRequestSchema = z
  .object({
    type: z.literal('analyze'),
    requestId: z.string().min(1),
    encodedBytes: z.instanceof(ArrayBuffer),
    params: resolvedAnalyzeOptionsSchema,
  })
  .strict();

export type WorkerRequest = z.infer<typeof workerRequestSchema>;

export const serializedComputeErrorSchema = z
  .object({
    code: z.enum(['invalid-request', 'wasm-init-failed', 'analysis-failed']),
    message: z.string().min(1),
  })
  .strict();

export type SerializedComputeError = z.infer<
  typeof serializedComputeErrorSchema
>;

const workerReplySchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('result'),
      requestId: z.string().min(1),
      result: z.unknown(),
    })
    .strict(),
  z
    .object({
      type: z.literal('error'),
      requestId: z.string().min(1),
      error: serializedComputeErrorSchema,
    })
    .strict(),
]);

export type WorkerReply = z.infer<typeof workerReplySchema>;

export class WorkerProtocolError extends Error {
  readonly code = 'invalid-protocol';

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'WorkerProtocolError';
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

function parseWithSchema<T>(
  label: string,
  schema: z.ZodType<T>,
  value: unknown
): T {
  const parsed = schema.safeParse(value);
  if (parsed.success) return parsed.data;
  const issue = parsed.error.issues[0];
  const path = issue?.path.length ? issue.path.join('.') : label;
  throw new WorkerProtocolError(
    `Invalid ${label}: ${path} ${issue?.message ?? 'validation failed'}`,
    { cause: parsed.error }
  );
}

export function parseWorkerRequest(value: unknown): WorkerRequest {
  return parseWithSchema('worker request', workerRequestSchema, value);
}

export function parseWorkerReply(value: unknown): WorkerReply {
  return parseWithSchema('worker reply', workerReplySchema, value);
}
