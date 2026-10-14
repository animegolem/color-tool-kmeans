import { describe, expect, it, vi } from 'vitest';
import {
  createBrowserComputeBridge,
  createTauriComputeBridge,
  parseComputeResponse,
  TauriComputeError,
  type AnalyzeOptions,
} from './compute';
import {
  WorkerClientError,
  type AnalyzeInvocation,
  type analyzeBlobInWorker,
} from '../compute/worker-client';

const params: AnalyzeOptions = {
  clusters: 1,
  quality: 2,
  ignoreTopN: 0,
  mergeThreshold: 0,
  symbolScale: 1,
  showClusterOutline: false,
  showAxisLabels: true,
  polarMode: 'oklch',
  hueLightnessSizeMode: 'frequency',
  histogramSort: 'frequency',
  snapToReal: true,
  showHistogram: true,
  showPolarChart: true,
  showHueLightness: true,
};

const response = {
  clusters: [
    {
      count: 1,
      share: 1,
      centroidSpace: [0.5, 0, 0],
      oklab: [0.5, 0, 0],
      oklch: [0.5, 0, 0],
      rgb: { r: 128, g: 128, b: 128 },
      hsv: [0, 0, 0.5],
    },
  ],
  iterations: 1,
  durationMs: 2,
  totalSamples: 1,
  variant: 'inhouse',
  resultDigest: 'a'.repeat(64),
};

function invocation(controller = new AbortController()): AnalyzeInvocation {
  return { requestId: 'request-1', signal: controller.signal };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

describe('compute response contract', () => {
  it('normalizes native snake_case and worker camelCase through one parser', () => {
    expect(parseComputeResponse(response)).toMatchObject({
      resultDigest: 'a'.repeat(64),
      totalSamples: 1,
    });
    expect(
      parseComputeResponse({
        ...response,
        durationMs: undefined,
        totalSamples: undefined,
        resultDigest: undefined,
        duration_ms: 2,
        total_samples: 1,
        result_digest: 'b'.repeat(64),
      })
    ).toMatchObject({ resultDigest: 'b'.repeat(64) });
  });

  it('rejects a missing digest and malformed numeric triples', () => {
    expect(() =>
      parseComputeResponse({ ...response, resultDigest: undefined })
    ).toThrow(TauriComputeError);
    expect(() =>
      parseComputeResponse({
        ...response,
        clusters: [{ ...response.clusters[0], oklch: [0.5, 0] }],
      })
    ).toThrow(TauriComputeError);
  });
});

describe('source-aware compute bridges', () => {
  it('sends a path source to native IPC and validates the response', async () => {
    const invoke = vi.fn(async () => response);
    const bridge = createTauriComputeBridge(invoke);

    await expect(
      bridge.analyze(
        { kind: 'path', path: '/tmp/image.png' },
        params,
        invocation()
      )
    ).resolves.toMatchObject({ variant: 'inhouse', totalSamples: 1 });
    expect(invoke).toHaveBeenCalledWith('analyze_image', {
      req: expect.objectContaining({ path: '/tmp/image.png', k: 1 }),
    });
  });

  it('revokes a native completion that returns after abort', async () => {
    const pending = deferred<unknown>();
    const controller = new AbortController();
    const bridge = createTauriComputeBridge(() => pending.promise);
    const result = bridge.analyze(
      { kind: 'path', path: '/tmp/image.png' },
      params,
      invocation(controller)
    );

    controller.abort();
    pending.resolve(response);
    await expect(result).rejects.toMatchObject({ code: 'cancelled' });
  });

  it('sends an encoded Blob to the worker and validates the same response', async () => {
    const analyze = vi.fn(
      async () => response
    ) as unknown as typeof analyzeBlobInWorker;
    const bridge = createBrowserComputeBridge(analyze);
    const blob = new Blob(['encoded'], { type: 'image/png' });

    await expect(
      bridge.analyze({ kind: 'blob', blob }, params, invocation())
    ).resolves.toMatchObject({ variant: 'inhouse', totalSamples: 1 });
    expect(analyze).toHaveBeenCalledWith(
      blob,
      expect.objectContaining({ path: '', k: 1 }),
      expect.objectContaining({ requestId: 'request-1' })
    );
  });

  it('maps worker cancellation and rejects source mismatches', async () => {
    const analyze = vi.fn(async () => {
      throw new WorkerClientError('cancelled', 'cancelled');
    }) as unknown as typeof analyzeBlobInWorker;
    const bridge = createBrowserComputeBridge(analyze);

    await expect(
      bridge.analyze(
        { kind: 'blob', blob: new Blob(['encoded']) },
        params,
        invocation()
      )
    ).rejects.toMatchObject({ code: 'cancelled' });
    await expect(
      bridge.analyze(
        { kind: 'path', path: '/tmp/image.png' },
        params,
        invocation()
      )
    ).rejects.toMatchObject({ code: 'source-mismatch' });
  });
});
