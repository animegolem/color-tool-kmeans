/**
 * Worker message contracts for the color compute pipeline.
 * @module messages
 */

export const WorkerMessageType = Object.freeze({
  COMPUTE: 'compute',
  CANCEL: 'cancel',
  PING: 'ping'
});

export const WorkerResponseType = Object.freeze({
  RESULT: 'result',
  ERROR: 'error',
  PONG: 'pong',
  CANCELLED: 'cancelled'
});

/**
 * @typedef {Object} ComputeRequest
 * @property {string} id
 * @property {ArrayBuffer} pixels - RGBA byte buffer (Uint8ClampedArray source).
 * @property {number} width
 * @property {number} height
 * @property {number} stride - Sample every Nth pixel (>=1).
 * @property {number} minLum - Minimum luma (0-255) to keep.
 * @property {('RGB'|'HSL'|'YUV'|'CIELAB'|'CIELUV')} space
 * @property {number} k
 * @property {number} maxIter
 * @property {number} tol
 * @property {number} [maxSamples]
 * @property {number} exclude - Number of leading clusters UI may drop (metadata).
 * @property {Float32Array|undefined} warmStart - Optional centroid warm-start (k*3 length).
 * @property {number|undefined} seed
 */

/**
 * Create a compute request payload.
 * @param {ComputeRequest} payload
 * @returns {{type:string,payload:ComputeRequest}}
 */
export function makeComputeMessage(payload) {
  return { type: WorkerMessageType.COMPUTE, payload };
}

/**
 * Create a cancel message for a given job id.
 * @param {string} id
 * @returns {{type:string,payload:{id:string}}}
 */
export function makeCancelMessage(id) {
  return { type: WorkerMessageType.CANCEL, payload: { id } };
}

/**
 * Create a ping message.
 * @param {number} [ts]
 * @returns {{type:string,payload:{ts:number}}}
 */
export function makePingMessage(ts = Date.now()) {
  return { type: WorkerMessageType.PING, payload: { ts } };
}

/**
 * @typedef {Object} ClusterResult
 * @property {number} count
 * @property {number} share
 * @property {Float32Array} centroidSpace - centroid in requested color space (length 3)
 * @property {{r:number,g:number,b:number}} rgb
 * @property {Float32Array} hsv - hue (0-360), sat (0-1), val (0-1)
 */

/**
 * @typedef {Object} ComputeResult
 * @property {string} id
 * @property {number} totalSamples
 * @property {number} durationMs
 * @property {number} iterations
 * @property {boolean} converged
 * @property {ClusterResult[]} clusters
 */

/**
 * Helper to build a worker response.
 * @param {'result'|'error'|'pong'|'cancelled'} type
 * @param {any} payload
 * @returns {{type:string,payload:any}}
 */
export function makeWorkerResponse(type, payload) {
  return { type, payload };
}
