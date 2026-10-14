import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  parseWorkerReply,
  parseWorkerRequest,
  WorkerProtocolError,
  type ResolvedAnalyzeOptions,
} from './worker-protocol';

const wasmMocks = vi.hoisted(() => ({
  init: vi.fn(async () => ({})),
  analyze: vi.fn(() => ({
    clusters: [],
    durationMs: 0,
    resultDigest: 'a'.repeat(64),
  })),
}));

vi.mock('@color-core-wasm', () => ({
  default: wasmMocks.init,
  analyze_image: wasmMocks.analyze,
}));

const params: ResolvedAnalyzeOptions = {
  path: '',
  k: 16,
  quality: 2,
  ignoreTopN: 0,
  mergeThreshold: 0,
  snapToReal: true,
  minLum: 0,
  tol: 1e-3,
  maxIter: 40,
  seed: 1,
  maxSamples: 300_000,
};

describe('worker protocol', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts the closed analyze request shape', () => {
    const encodedBytes = new ArrayBuffer(4);
    expect(
      parseWorkerRequest({
        type: 'analyze',
        requestId: 'request-1',
        encodedBytes,
        params,
      })
    ).toEqual({
      type: 'analyze',
      requestId: 'request-1',
      encodedBytes,
      params,
    });
  });

  it('rejects request extensions and decoded-pixel substitutes', () => {
    expect(() =>
      parseWorkerRequest({
        type: 'analyze',
        requestId: 'request-1',
        encodedBytes: new Uint8Array(4),
        params,
      })
    ).toThrow(WorkerProtocolError);
    expect(() =>
      parseWorkerRequest({
        type: 'analyze',
        requestId: 'request-1',
        encodedBytes: new ArrayBuffer(4),
        params,
        pixels: new Uint8Array(4),
      })
    ).toThrow(WorkerProtocolError);
  });

  it('accepts only matching result and serialized-error unions', () => {
    expect(
      parseWorkerReply({
        type: 'result',
        requestId: 'request-1',
        result: { clusters: [] },
      })
    ).toMatchObject({ type: 'result', requestId: 'request-1' });
    expect(
      parseWorkerReply({
        type: 'error',
        requestId: 'request-1',
        error: { code: 'analysis-failed', message: 'decode failed' },
      })
    ).toMatchObject({ type: 'error', requestId: 'request-1' });
  });

  it('rejects unknown reply variants, error codes, and extra fields', () => {
    expect(() =>
      parseWorkerReply({ type: 'progress', requestId: 'request-1' })
    ).toThrow(WorkerProtocolError);
    expect(() =>
      parseWorkerReply({
        type: 'error',
        requestId: 'request-1',
        error: { code: 'mystery', message: 'bad' },
      })
    ).toThrow(WorkerProtocolError);
    expect(() =>
      parseWorkerReply({
        type: 'result',
        requestId: 'request-1',
        result: {},
        stale: true,
      })
    ).toThrow(WorkerProtocolError);
  });

  it('reports the worker performance measurement instead of core placeholder time', async () => {
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(10)
      .mockReturnValueOnce(15.25);
    const { handleWorkerRequest } = await import('./color-analysis.worker');

    const reply = await handleWorkerRequest({
      type: 'analyze',
      requestId: 'request-duration',
      encodedBytes: new ArrayBuffer(4),
      params,
    });

    expect(reply).toMatchObject({
      type: 'result',
      requestId: 'request-duration',
      result: { durationMs: 5.25 },
    });
    expect(
      (reply as { result: { durationMs: number } }).result.durationMs
    ).toBeGreaterThan(0);
  });
});
