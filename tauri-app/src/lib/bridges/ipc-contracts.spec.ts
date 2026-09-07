import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const mocks = vi.hoisted(() => ({
  tauriInvoke: vi.fn(),
}));

vi.mock('./tauri', () => mocks);

import { composeGrid } from './compose';
import {
  IpcResponseError,
  parseComposeGridResponse,
  parseVideoFrameResponse,
  parseVideoProbeResponse,
  parseVideoStripResponse,
  type ValidatedIpcCommand,
} from './ipc-contracts';
import { extractVideoFrame, extractVideoStrip, probeVideo } from './video';

const frameRequest = {
  path: '/tmp/video.mp4',
  frameId: 'frame-1',
  timestamp: 1.25,
  maxDimension: 800,
};

const stripRequest = {
  path: '/tmp/video.mp4',
  stripId: 'strip-1',
  duration: 12.5,
  thumbCount: 8,
  thumbWidth: 80,
  thumbHeight: 60,
} as const;

const validGrid = {
  path: '/tmp/grid.png',
  width: 200,
  height: 100,
  gridCols: 2,
  gridRows: 1,
};

type InvalidCase = {
  label: string;
  command: ValidatedIpcCommand;
  raw: unknown;
  field?: string;
  parse: (raw: unknown) => unknown;
};

const invalidParserCases: InvalidCase[] = [
  {
    label: 'frame primitive response',
    command: 'extract_video_frame',
    raw: 'frame',
    parse: parseVideoFrameResponse,
  },
  {
    label: 'frame array response',
    command: 'extract_video_frame',
    raw: [],
    parse: parseVideoFrameResponse,
  },
  {
    label: 'frame null response',
    command: 'extract_video_frame',
    raw: null,
    parse: parseVideoFrameResponse,
  },
  {
    label: 'frame empty path',
    command: 'extract_video_frame',
    raw: { path: '', timestampUsed: '1.250' },
    field: 'path',
    parse: parseVideoFrameResponse,
  },
  {
    label: 'frame missing timestamp',
    command: 'extract_video_frame',
    raw: { path: '/tmp/frame.png' },
    field: 'timestampUsed',
    parse: parseVideoFrameResponse,
  },
  {
    label: 'frame empty timestamp',
    command: 'extract_video_frame',
    raw: { path: '/tmp/frame.png', timestampUsed: '' },
    field: 'timestampUsed',
    parse: parseVideoFrameResponse,
  },
  {
    label: 'probe missing fps',
    command: 'probe_video',
    raw: { duration: 12.5 },
    field: 'fps',
    parse: parseVideoProbeResponse,
  },
  {
    label: 'probe numeric string duration',
    command: 'probe_video',
    raw: { duration: '12.5', fps: 24 },
    field: 'duration',
    parse: parseVideoProbeResponse,
  },
  ...[Number.NaN, Number.POSITIVE_INFINITY, -1].map((duration) => ({
    label: `probe invalid duration ${String(duration)}`,
    command: 'probe_video' as const,
    raw: { duration, fps: 24 },
    field: 'duration',
    parse: parseVideoProbeResponse,
  })),
  ...[0, -1, Number.NaN, Number.POSITIVE_INFINITY, '24'].map((fps) => ({
    label: `probe invalid fps ${String(fps)}`,
    command: 'probe_video' as const,
    raw: { duration: 12.5, fps },
    field: 'fps',
    parse: parseVideoProbeResponse,
  })),
  {
    label: 'strip wrong path type',
    command: 'extract_video_strip',
    raw: { path: 42 },
    field: 'path',
    parse: parseVideoStripResponse,
  },
  {
    label: 'strip empty path',
    command: 'extract_video_strip',
    raw: { path: '' },
    field: 'path',
    parse: parseVideoStripResponse,
  },
  {
    label: 'grid primitive response',
    command: 'compose_grid',
    raw: 42,
    parse: parseComposeGridResponse,
  },
  {
    label: 'grid missing rows',
    command: 'compose_grid',
    raw: { ...validGrid, gridRows: undefined },
    field: 'gridRows',
    parse: parseComposeGridResponse,
  },
  {
    label: 'grid empty path',
    command: 'compose_grid',
    raw: { ...validGrid, path: '' },
    field: 'path',
    parse: parseComposeGridResponse,
  },
  ...[
    ['width', 0],
    ['height', -1],
    ['gridCols', 1.5],
    ['gridRows', Number.POSITIVE_INFINITY],
    ['width', Number.NaN],
    ['height', 0x1_0000_0000],
    ['gridCols', '2'],
  ].map(([field, value]) => ({
    label: `grid invalid ${String(field)} ${String(value)}`,
    command: 'compose_grid' as const,
    raw: { ...validGrid, [String(field)]: value },
    field: String(field),
    parse: parseComposeGridResponse,
  })),
];

describe('validated video and compose IPC contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    {
      label: 'required frame timestamp',
      command: 'extract_video_frame',
      response: { path: '/tmp/frame.png' },
      invoke: () => extractVideoFrame(frameRequest),
    },
    {
      label: 'finite probe duration',
      command: 'probe_video',
      response: { duration: Number.POSITIVE_INFINITY, fps: 24 },
      invoke: () => probeVideo('/tmp/video.mp4'),
    },
    {
      label: 'non-empty strip path',
      command: 'extract_video_strip',
      response: { path: '' },
      invoke: () => extractVideoStrip(stripRequest),
    },
    {
      label: 'complete grid dimensions',
      command: 'compose_grid',
      response: { ...validGrid, gridRows: undefined },
      invoke: () => composeGrid(['/tmp/a.png', '/tmp/b.png']),
    },
  ])(
    'SWEEP-027 rejects malformed $label at the real bridge',
    async ({ command, response, invoke }) => {
      mocks.tauriInvoke.mockResolvedValueOnce(response);

      const error = await invoke().catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(IpcResponseError);
      expect(error).toMatchObject({ code: 'invalid-response', command });
    }
  );

  it('accepts and projects valid frame and strip replies without changing arguments', async () => {
    mocks.tauriInvoke
      .mockResolvedValueOnce({
        path: '  /tmp/frame.png  ',
        timestampUsed: '1.250',
        internal: 'discard',
      })
      .mockResolvedValueOnce({ path: '/tmp/strip.png', internal: 'discard' });

    await expect(extractVideoFrame(frameRequest)).resolves.toEqual({
      path: '  /tmp/frame.png  ',
      timestampUsed: '1.250',
    });
    await expect(extractVideoStrip(stripRequest)).resolves.toEqual({
      path: '/tmp/strip.png',
    });
    expect(mocks.tauriInvoke).toHaveBeenNthCalledWith(
      1,
      'extract_video_frame',
      {
        req: frameRequest,
      }
    );
    expect(mocks.tauriInvoke).toHaveBeenNthCalledWith(
      2,
      'extract_video_strip',
      {
        req: stripRequest,
      }
    );
  });

  it('accepts duration zero and both nullable and positive fps replies', async () => {
    mocks.tauriInvoke
      .mockResolvedValueOnce({ duration: 0, fps: null, internal: 'discard' })
      .mockResolvedValueOnce({ duration: 12.5, fps: 24 });

    await expect(probeVideo('/tmp/zero.mp4')).resolves.toEqual({
      duration: 0,
      fps: null,
    });
    await expect(probeVideo('/tmp/video.mp4')).resolves.toEqual({
      duration: 12.5,
      fps: 24,
    });
    expect(mocks.tauriInvoke).toHaveBeenNthCalledWith(1, 'probe_video', {
      req: { path: '/tmp/zero.mp4' },
    });
    expect(mocks.tauriInvoke).toHaveBeenNthCalledWith(2, 'probe_video', {
      req: { path: '/tmp/video.mp4' },
    });
  });

  it('accepts and projects full grid replies while preserving null and explicit defaults', async () => {
    mocks.tauriInvoke
      .mockResolvedValueOnce({ ...validGrid, internal: 'discard' })
      .mockResolvedValueOnce(validGrid);

    await expect(composeGrid(['/tmp/a.png', '/tmp/b.png'])).resolves.toEqual(
      validGrid
    );
    await expect(
      composeGrid(['/tmp/a.png', '/tmp/b.png'], 640)
    ).resolves.toEqual(validGrid);
    expect(mocks.tauriInvoke).toHaveBeenNthCalledWith(1, 'compose_grid', {
      req: { paths: ['/tmp/a.png', '/tmp/b.png'], maxCellDim: null },
    });
    expect(mocks.tauriInvoke).toHaveBeenNthCalledWith(2, 'compose_grid', {
      req: { paths: ['/tmp/a.png', '/tmp/b.png'], maxCellDim: 640 },
    });
  });

  it.each(invalidParserCases)(
    'rejects $label without coercion',
    ({ command, raw, field, parse }) => {
      let caught: unknown;
      try {
        parse(raw);
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(IpcResponseError);
      expect(caught).toMatchObject({ code: 'invalid-response', command });
      expect((caught as Error).message).toContain(field ?? 'response');
      expect((caught as IpcResponseError).cause).toBeInstanceOf(z.ZodError);
    }
  );

  it.each([
    ['extract_video_frame', () => extractVideoFrame(frameRequest)],
    ['probe_video', () => probeVideo('/tmp/video.mp4')],
    ['extract_video_strip', () => extractVideoStrip(stripRequest)],
    ['compose_grid', () => composeGrid(['/tmp/a.png', '/tmp/b.png'])],
  ])('preserves %s invoke rejections unchanged', async (_command, invoke) => {
    const failure = new Error('native invocation failed');
    mocks.tauriInvoke.mockRejectedValueOnce(failure);

    await expect(invoke()).rejects.toBe(failure);
  });
});
