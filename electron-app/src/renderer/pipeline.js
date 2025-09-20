import { WorkerResponseType } from '../shared/messages.js';
import { processCompute } from '../worker/color-worker.js';

let sequence = 0;

function copyBuffer(view) {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
}

export function computePaletteFromImageData(imageData, options = {}) {
  const { width, height, data } = imageData;
  if (!data || typeof width !== 'number' || typeof height !== 'number') {
    throw new Error('computePaletteFromImageData requires {width, height, data}');
  }
  const id = `job-${Date.now()}-${sequence++}`;
  const payload = {
    id,
    pixels: copyBuffer(data),
    width,
    height,
    stride: options.stride ?? 1,
    minLum: options.minLum ?? 0,
    space: options.space ?? 'RGB',
    k: options.k ?? 10,
    maxIter: options.maxIter ?? 50,
    tol: options.tol ?? 1,
    exclude: options.exclude ?? 0,
    warmStart: options.warmStart,
    seed: options.seed ?? 1,
    maxSamples: options.maxSamples ?? 300000
  };
  const response = processCompute(payload);
  if (response.type === WorkerResponseType.ERROR) {
    throw new Error(response.payload?.message || 'Worker compute error');
  }
  if (response.type === WorkerResponseType.CANCELLED) {
    const error = new Error('Computation cancelled');
    error.code = 'CANCELLED';
    throw error;
  }
  if (response.type !== WorkerResponseType.RESULT) {
    throw new Error(`Unexpected worker response: ${response.type}`);
  }
  return response.payload;
}
