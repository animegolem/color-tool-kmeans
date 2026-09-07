import { z } from 'zod';

export type ValidatedIpcCommand =
  | 'extract_video_frame'
  | 'probe_video'
  | 'extract_video_strip'
  | 'compose_grid';

export class IpcResponseError extends Error {
  readonly code = 'invalid-response' as const;
  readonly command: ValidatedIpcCommand;
  override readonly cause: unknown;

  constructor(command: ValidatedIpcCommand, message: string, cause: unknown) {
    super(message);
    this.name = 'IpcResponseError';
    this.command = command;
    this.cause = cause;
  }
}

const nonEmptyStringSchema = z.string().min(1, {
  message: 'must be a non-empty string',
});

const finiteNumberSchema = z.number().refine(Number.isFinite, {
  message: 'must be a finite number',
});

const positiveU32Schema = finiteNumberSchema
  .pipe(z.number().int())
  .pipe(z.number().min(1).max(0xffff_ffff));

const videoFrameResponseSchema = z.object({
  path: nonEmptyStringSchema,
  timestampUsed: nonEmptyStringSchema,
});

const videoProbeResponseSchema = z.object({
  duration: finiteNumberSchema.pipe(z.number().nonnegative()),
  fps: finiteNumberSchema.pipe(z.number().positive()).nullable(),
});

const videoStripResponseSchema = z.object({
  path: nonEmptyStringSchema,
});

const composeGridResponseSchema = z.object({
  path: nonEmptyStringSchema,
  width: positiveU32Schema,
  height: positiveU32Schema,
  gridCols: positiveU32Schema,
  gridRows: positiveU32Schema,
});

export type VideoFrameResponse = z.infer<typeof videoFrameResponseSchema>;
export type VideoProbeResponse = z.infer<typeof videoProbeResponseSchema>;
export type VideoStripResponse = z.infer<typeof videoStripResponseSchema>;
export type ComposeGridResult = z.infer<typeof composeGridResponseSchema>;

function parseResponse<Output>(
  command: ValidatedIpcCommand,
  schema: z.ZodType<Output>,
  raw: unknown
): Output {
  const parsed = schema.safeParse(raw);
  if (parsed.success) return parsed.data;

  const issue = parsed.error.issues[0];
  const path = issue?.path.length ? issue.path.join('.') : 'response';
  const detail = issue?.message ?? 'unknown validation error';
  throw new IpcResponseError(
    command,
    `Invalid ${command} response: ${path} ${detail}`,
    parsed.error
  );
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
