import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  tauriInvoke: vi.fn(),
}));

vi.mock('./tauri', () => mocks);

import { composeGrid } from './compose';
import { IpcResponseError } from './ipc-contracts';
import { extractVideoFrame, extractVideoStrip, probeVideo } from './video';

describe('validated video and compose IPC contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('SWEEP-027 accepts the complete Rust response shapes', async () => {
    mocks.tauriInvoke
      .mockResolvedValueOnce({ path: '/tmp/frame.png', timestampUsed: '1.250' })
      .mockResolvedValueOnce({ duration: 12.5, fps: null })
      .mockResolvedValueOnce({ path: '/tmp/strip.png' })
      .mockResolvedValueOnce({
        path: '/tmp/grid.png',
        width: 200,
        height: 100,
        gridCols: 2,
        gridRows: 1,
      });

    await expect(
      extractVideoFrame({
        path: '/tmp/video.mp4',
        frameId: 'frame-1',
        timestamp: 1.25,
        maxDimension: 800,
      })
    ).resolves.toEqual({ path: '/tmp/frame.png', timestampUsed: '1.250' });
    await expect(probeVideo('/tmp/video.mp4')).resolves.toEqual({
      duration: 12.5,
      fps: null,
    });
    await expect(
      extractVideoStrip({
        path: '/tmp/video.mp4',
        stripId: 'strip-1',
        duration: 12.5,
        thumbCount: 8,
        thumbWidth: 80,
        thumbHeight: 60,
      })
    ).resolves.toEqual({ path: '/tmp/strip.png' });
    await expect(composeGrid(['/tmp/a.png', '/tmp/b.png'])).resolves.toEqual({
      path: '/tmp/grid.png',
      width: 200,
      height: 100,
      gridCols: 2,
      gridRows: 1,
    });
  });

  it.each([
    {
      label: 'required frame timestamp',
      command: 'extract_video_frame',
      response: { path: '/tmp/frame.png' },
      invoke: () =>
        extractVideoFrame({
          path: '/tmp/video.mp4',
          frameId: 'frame-1',
          timestamp: 1.25,
          maxDimension: 800,
        }),
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
      invoke: () =>
        extractVideoStrip({
          path: '/tmp/video.mp4',
          stripId: 'strip-1',
          duration: 12.5,
          thumbCount: 8,
          thumbWidth: 80,
          thumbHeight: 60,
        }),
    },
    {
      label: 'complete compose dimensions',
      command: 'compose_grid',
      response: {
        path: '/tmp/grid.png',
        width: 200,
        height: 100,
        gridCols: 2,
      },
      invoke: () => composeGrid(['/tmp/a.png', '/tmp/b.png']),
    },
  ])(
    'SWEEP-027 rejects malformed $label',
    async ({ command, response, invoke }) => {
      mocks.tauriInvoke.mockResolvedValueOnce(response);

      const error = await invoke().catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(IpcResponseError);
      expect(error).toMatchObject({ code: 'invalid-response', command });
    }
  );
});
