import { z } from 'zod';

export type ValidatedIpcCommand =
  | 'extract_video_frame'
  | 'probe_video'
  | 'extract_video_strip'
  | 'compose_grid';

export class IpcResponseError extends Error {
  readonly code = 'invalid-response' as const;
  readonly command: ValidatedIpcCommand;

  constructor(
    command: ValidatedIpcCommand,
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message);
    this.name = 'IpcResponseError';
    this.command = command;
    if (options?.cause !== undefined) {
      (this as any).cause = options.cause;
    }
  }
}

const nonEmptyStringSchema = z.string().min(1, {
  message: 'must be a non-empty string',
});

const finiteNumberSchema = z
  .number()
  .refine((value) => Number.isFinite(value), {
    message: 'must be a finite number',
  });

const positiveIntegerSchema = z.number().int().positive();

const videoFrameResponseSchema = z.object({
  path: nonEmptyStringSchema,
  timestampUsed: nonEmptyStringSchema,
});

const videoProbeResponseSchema = z.object({
  duration: finiteNumberSchema.nonnegative(),
  fps: finiteNumberSchema.positive().nullable(),
});

const videoStripResponseSchema = z.object({
  path: nonEmptyStringSchema,
});

const composeGridResponseSchema = z.object({
  path: nonEmptyStringSchema,
  width: positiveIntegerSchema,
  height: positiveIntegerSchema,
  gridCols: positiveIntegerSchema,
  gridRows: positiveIntegerSchema,
});

export type VideoFrameResponse = z.infer<typeof videoFrameResponseSchema>;
export type VideoProbeResponse = z.infer<typeof videoProbeResponseSchema>;
export type VideoStripResponse = z.infer<typeof videoStripResponseSchema>;
export type ComposeGridResult = z.infer<typeof composeGridResponseSchema>;

function parseResponse<Schema extends z.ZodType>(
  command: ValidatedIpcCommand,
  schema: Schema,
  raw: unknown
): z.infer<Schema> {
  try {
    return schema.parse(raw) as z.infer<Schema>;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issue = error.issues[0];
      const path = issue?.path?.length ? issue.path.join('.') : 'response';
      const detail = issue?.message ?? 'unknown validation error';
      throw new IpcResponseError(
        command,
        `Invalid ${command} response: ${path} ${detail}`,
        { cause: error }
      );
    }
    throw error;
  }
}

export function parseVideoFrameResponse(raw: unknown): VideoFrameResponse {
  return parseResponse('extract_video_frame', videoFrameResponseSchema, raw);
}

export function parseVideoProbeResponse(raw: unknown): VideoProbeResponse {
  return parseResponse('probe_video', videoProbeResponseSchema, raw);
}

export function parseVideoStripResponse(raw: unknown): VideoStripResponse {
  return parseResponse('extract_video_strip', videoStripResponseSchema, raw);
}

export function parseComposeGridResponse(raw: unknown): ComposeGridResult {
  return parseResponse('compose_grid', composeGridResponseSchema, raw);
}
