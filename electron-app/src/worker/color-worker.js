import { WorkerMessageType, WorkerResponseType, makeWorkerResponse } from '../shared/messages.js';
import { ensureValidSpace, fromRgb, toRgb, rgbToHsv } from './colorspaces.js';
import { runKMeans, buildDatasetFromRgbBuffer } from './kmeans.js';

const cancelledJobs = new Set();
const activeJobs = new Map();

const now = typeof performance !== 'undefined' ? () => performance.now() : () => Date.now();

function convertDatasetToSpace(dataset, space) {
  if (space === 'RGB') return dataset;
  const converted = new Float32Array(dataset.length);
  const total = dataset.length / 3;
  for (let i = 0; i < total; i++) {
    const r = dataset[i * 3];
    const g = dataset[i * 3 + 1];
    const b = dataset[i * 3 + 2];
    const [c1, c2, c3] = fromRgb(space, r, g, b);
    converted[i * 3] = c1;
    converted[i * 3 + 1] = c2;
    converted[i * 3 + 2] = c3;
  }
  return converted;
}

function buildClusters(space, centroids, counts, totalSamples) {
  const clusters = [];
  const k = counts.length;
  for (let c = 0; c < k; c++) {
    const count = counts[c];
    if (count === 0) continue;
    const base = c * 3;
    const centroidSpace = new Float32Array([
      centroids[base],
      centroids[base + 1],
      centroids[base + 2]
    ]);
    const rgb = toRgb(space, centroidSpace[0], centroidSpace[1], centroidSpace[2]);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    clusters.push({
      count,
      share: count / Math.max(1, totalSamples),
      centroidSpace,
      rgb,
      hsv: new Float32Array([hsv.h, hsv.s, hsv.v])
    });
  }
  return clusters;
}

function processCompute(payload) {
  ensureValidSpace(payload.space);
  const {
    id,
    pixels,
    stride,
    minLum,
    space,
    k,
    maxIter,
    tol,
    warmStart,
    seed
  } = payload;

  const effectiveMaxSamples = payload.maxSamples ?? 300000;
  const datasetRgb = buildDatasetFromRgbBuffer(
    pixels,
    Math.max(1, stride || 1),
    Math.max(0, minLum || 0),
    effectiveMaxSamples,
    seed ?? 1
  );
  const totalSamples = datasetRgb.length / 3;
  if (totalSamples === 0) {
    return makeWorkerResponse(WorkerResponseType.RESULT, {
      id,
      totalSamples,
      durationMs: 0,
      iterations: 0,
      converged: true,
      clusters: [],
      centroids: new Float32Array(0)
    });
  }

  const dataset = convertDatasetToSpace(datasetRgb, space);
  const warmStartFloat = warmStart instanceof Float32Array ? warmStart : undefined;
  const jobToken = { cancelled: false };
  activeJobs.set(id, jobToken);

  const start = now();
  const result = runKMeans(dataset, k, {
    maxIter,
    tol,
    warmStart: warmStartFloat,
    rngSeed: seed,
    shouldCancel: () => jobToken.cancelled || cancelledJobs.has(id)
  });
  const durationMs = now() - start;

  activeJobs.delete(id);
  cancelledJobs.delete(id);

  if (result.cancelled) {
    return makeWorkerResponse(WorkerResponseType.CANCELLED, { id });
  }

  const clusters = buildClusters(space, result.centroids, result.counts, totalSamples);
  clusters.sort((a, b) => b.count - a.count);

  return makeWorkerResponse(WorkerResponseType.RESULT, {
    id,
    totalSamples,
    durationMs,
    iterations: result.iterations,
    converged: result.converged,
    centroids: result.centroids,
    counts: result.counts,
    clusters
  });
}

function handleMessage(event) {
  const { type, payload } = event.data;
  switch (type) {
    case WorkerMessageType.COMPUTE: {
      try {
        const response = processCompute(payload);
        postMessage(response, transferableFromResponse(response));
      } catch (error) {
        postMessage(makeWorkerResponse(WorkerResponseType.ERROR, {
          id: payload?.id,
          message: error.message,
          stack: error.stack
        }));
      }
      break;
    }
    case WorkerMessageType.CANCEL: {
      const job = activeJobs.get(payload.id);
      if (job) job.cancelled = true;
      cancelledJobs.add(payload.id);
      postMessage(makeWorkerResponse(WorkerResponseType.CANCELLED, { id: payload.id }));
      break;
    }
    case WorkerMessageType.PING: {
      postMessage(makeWorkerResponse(WorkerResponseType.PONG, { ts: payload.ts, now: Date.now() }));
      break;
    }
    default:
      postMessage(makeWorkerResponse(WorkerResponseType.ERROR, { message: `Unknown message type: ${type}` }));
  }
}

function transferableFromResponse(response) {
  const transfers = [];
  if (response.payload) {
    if (response.payload.centroids instanceof Float32Array) {
      transfers.push(response.payload.centroids.buffer);
    }
    if (response.payload.counts instanceof Uint32Array) {
      transfers.push(response.payload.counts.buffer);
    }
    if (Array.isArray(response.payload.clusters)) {
      for (const cluster of response.payload.clusters) {
        if (cluster.centroidSpace instanceof Float32Array) {
          transfers.push(cluster.centroidSpace.buffer);
        }
        if (cluster.hsv instanceof Float32Array) {
          transfers.push(cluster.hsv.buffer);
        }
      }
    }
  }
  return transfers;
}

if (typeof self !== 'undefined' && typeof self.addEventListener === 'function') {
  self.addEventListener('message', handleMessage);
}

export { handleMessage, processCompute };
