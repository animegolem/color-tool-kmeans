import { describe, expect, it, vi } from 'vitest';
import {
  analyzeBlobInWorker,
  WorkerClientError,
  type AnalysisWorker,
} from './worker-client';
import type { ResolvedAnalyzeOptions, WorkerRequest } from './worker-protocol';

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

class FakeWorker implements AnalysisWorker {
  readonly messages: WorkerRequest[] = [];
  readonly transfers: Transferable[][] = [];
  readonly terminate = vi.fn();
  private readonly messageListeners = new Set<
    (event: MessageEvent<unknown>) => void
  >();
  private readonly errorListeners = new Set<(event: ErrorEvent) => void>();

  postMessage(message: WorkerRequest, transfer: Transferable[]) {
    this.messages.push(message);
    this.transfers.push(transfer);
  }

  addEventListener(
    type: 'message' | 'error',
    listener:
      | ((event: MessageEvent<unknown>) => void)
      | ((event: ErrorEvent) => void)
  ) {
    if (type === 'message') {
      this.messageListeners.add(
        listener as (event: MessageEvent<unknown>) => void
      );
    } else {
      this.errorListeners.add(listener as (event: ErrorEvent) => void);
    }
  }

  removeEventListener(
    type: 'message' | 'error',
    listener:
      | ((event: MessageEvent<unknown>) => void)
      | ((event: ErrorEvent) => void)
  ) {
    if (type === 'message') {
      this.messageListeners.delete(
        listener as (event: MessageEvent<unknown>) => void
      );
    } else {
      this.errorListeners.delete(listener as (event: ErrorEvent) => void);
    }
  }

  emitMessage(data: unknown) {
    for (const listener of [...this.messageListeners]) {
      listener({ data } as MessageEvent<unknown>);
    }
  }

  get listenerCount() {
    return this.messageListeners.size + this.errorListeners.size;
  }
}

async function dispatched(worker: FakeWorker) {
  await vi.waitFor(() => expect(worker.messages).toHaveLength(1));
}

describe('worker analysis client', () => {
  it('transfers encoded bytes and resolves one matching reply', async () => {
    const worker = new FakeWorker();
    const promise = analyzeBlobInWorker(
      new Blob([new Uint8Array([1, 2, 3])]),
      params,
      { requestId: 'request-1', signal: new AbortController().signal },
      () => worker
    );
    await dispatched(worker);

    expect(worker.messages[0]).toMatchObject({
      type: 'analyze',
      requestId: 'request-1',
      params,
    });
    expect(worker.transfers[0]).toEqual([worker.messages[0].encodedBytes]);
    worker.emitMessage({
      type: 'result',
      requestId: 'request-1',
      result: { variant: 'wasm-worker' },
    });

    await expect(promise).resolves.toEqual({ variant: 'wasm-worker' });
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(worker.listenerCount).toBe(0);
  });

  it('rejects a wrong request ID and ignores a later matching reply', async () => {
    const worker = new FakeWorker();
    const promise = analyzeBlobInWorker(
      new Blob(['encoded']),
      params,
      { requestId: 'request-1', signal: new AbortController().signal },
      () => worker
    );
    await dispatched(worker);
    worker.emitMessage({ type: 'result', requestId: 'wrong', result: {} });
    worker.emitMessage({
      type: 'result',
      requestId: 'request-1',
      result: { stale: true },
    });

    await expect(promise).rejects.toMatchObject({
      code: 'invalid-reply',
    });
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(worker.listenerCount).toBe(0);
  });

  it('terminates on abort, rejects once as cancelled, and ignores late replies', async () => {
    const worker = new FakeWorker();
    const controller = new AbortController();
    const promise = analyzeBlobInWorker(
      new Blob(['encoded']),
      params,
      { requestId: 'request-1', signal: controller.signal },
      () => worker
    );
    await dispatched(worker);
    controller.abort();
    worker.emitMessage({
      type: 'result',
      requestId: 'request-1',
      result: { stale: true },
    });

    await expect(promise).rejects.toMatchObject({ code: 'cancelled' });
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(worker.listenerCount).toBe(0);
  });

  it('settles once and detaches before a duplicate reply', async () => {
    const worker = new FakeWorker();
    const promise = analyzeBlobInWorker(
      new Blob(['encoded']),
      params,
      { requestId: 'request-1', signal: new AbortController().signal },
      () => worker
    );
    await dispatched(worker);
    worker.emitMessage({
      type: 'result',
      requestId: 'request-1',
      result: { accepted: true },
    });
    await expect(promise).resolves.toEqual({ accepted: true });
    worker.emitMessage({
      type: 'result',
      requestId: 'request-1',
      result: { duplicate: true },
    });

    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(worker.listenerCount).toBe(0);
  });

  it('maps a serialized worker failure to a typed client error', async () => {
    const worker = new FakeWorker();
    const promise = analyzeBlobInWorker(
      new Blob(['encoded']),
      params,
      { requestId: 'request-1', signal: new AbortController().signal },
      () => worker
    );
    await dispatched(worker);
    worker.emitMessage({
      type: 'error',
      requestId: 'request-1',
      error: { code: 'analysis-failed', message: 'decode failed' },
    });

    await expect(promise).rejects.toBeInstanceOf(WorkerClientError);
    await expect(promise).rejects.toMatchObject({ code: 'worker-failed' });
  });
});
