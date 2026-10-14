import {
  parseWorkerReply,
  type ResolvedAnalyzeOptions,
  type WorkerRequest,
} from './worker-protocol';

export interface AnalyzeInvocation {
  requestId: string;
  signal: AbortSignal;
}

export type WorkerClientErrorCode =
  | 'cancelled'
  | 'blob-read-failed'
  | 'worker-failed'
  | 'invalid-reply';

export class WorkerClientError extends Error {
  constructor(
    readonly code: WorkerClientErrorCode,
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message);
    this.name = 'WorkerClientError';
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

export interface AnalysisWorker {
  postMessage(message: WorkerRequest, transfer: Transferable[]): void;
  terminate(): void;
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<unknown>) => void
  ): void;
  addEventListener(type: 'error', listener: (event: ErrorEvent) => void): void;
  removeEventListener(
    type: 'message',
    listener: (event: MessageEvent<unknown>) => void
  ): void;
  removeEventListener(
    type: 'error',
    listener: (event: ErrorEvent) => void
  ): void;
}

export type AnalysisWorkerFactory = () => AnalysisWorker;

function createAnalysisWorker(): AnalysisWorker {
  return new Worker(new URL('./color-analysis.worker.ts', import.meta.url), {
    type: 'module',
    name: 'color-analysis',
  });
}

function cancelledError(requestId: string) {
  return new WorkerClientError(
    'cancelled',
    `Analysis request ${requestId} was cancelled`
  );
}

async function readBlob(
  blob: Blob,
  invocation: AnalyzeInvocation
): Promise<ArrayBuffer> {
  if (invocation.signal.aborted) {
    throw cancelledError(invocation.requestId);
  }

  return new Promise<ArrayBuffer>((resolve, reject) => {
    let settled = false;
    const cleanup = () =>
      invocation.signal.removeEventListener('abort', handleAbort);
    const succeed = (buffer: ArrayBuffer) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(buffer);
    };
    const fail = (error: WorkerClientError) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const handleAbort = () => fail(cancelledError(invocation.requestId));

    invocation.signal.addEventListener('abort', handleAbort, { once: true });
    blob
      .arrayBuffer()
      .then(succeed, (error) =>
        fail(
          new WorkerClientError(
            'blob-read-failed',
            'Failed to read encoded image bytes',
            { cause: error }
          )
        )
      );
  });
}

export async function analyzeBlobInWorker(
  blob: Blob,
  params: ResolvedAnalyzeOptions,
  invocation: AnalyzeInvocation,
  workerFactory: AnalysisWorkerFactory = createAnalysisWorker
): Promise<unknown> {
  const encodedBytes = await readBlob(blob, invocation);
  if (invocation.signal.aborted) {
    throw cancelledError(invocation.requestId);
  }

  let worker: AnalysisWorker;
  try {
    worker = workerFactory();
  } catch (error) {
    throw new WorkerClientError(
      'worker-failed',
      'Failed to create the color-analysis worker',
      { cause: error }
    );
  }

  return new Promise<unknown>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      invocation.signal.removeEventListener('abort', handleAbort);
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleWorkerError);
      worker.terminate();
    };
    const succeed = (result: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };
    const fail = (error: WorkerClientError) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const handleAbort = () => fail(cancelledError(invocation.requestId));
    const handleMessage = (event: MessageEvent<unknown>) => {
      let reply;
      try {
        reply = parseWorkerReply(event.data);
      } catch (error) {
        fail(
          new WorkerClientError(
            'invalid-reply',
            'Color-analysis worker returned an invalid reply',
            { cause: error }
          )
        );
        return;
      }
      if (reply.requestId !== invocation.requestId) {
        fail(
          new WorkerClientError(
            'invalid-reply',
            `Color-analysis worker replied for ${reply.requestId}, expected ${invocation.requestId}`
          )
        );
        return;
      }
      if (reply.type === 'error') {
        fail(
          new WorkerClientError(
            'worker-failed',
            `${reply.error.code}: ${reply.error.message}`
          )
        );
        return;
      }
      succeed(reply.result);
    };
    const handleWorkerError = (event: ErrorEvent) => {
      fail(
        new WorkerClientError(
          'worker-failed',
          event.message || 'Color-analysis worker failed'
        )
      );
    };

    invocation.signal.addEventListener('abort', handleAbort, { once: true });
    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleWorkerError);

    if (invocation.signal.aborted) {
      handleAbort();
      return;
    }

    const request: WorkerRequest = {
      type: 'analyze',
      requestId: invocation.requestId,
      encodedBytes,
      params,
    };
    try {
      worker.postMessage(request, [encodedBytes]);
    } catch (error) {
      fail(
        new WorkerClientError(
          'worker-failed',
          'Failed to dispatch the color-analysis worker request',
          { cause: error }
        )
      );
    }
  });
}
