import { clamp } from './colorspaces.js';

function createRng(seed = 1) {
  let state = (seed >>> 0) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0xffffffff;
  };
}

function copyPoint(data, index, target, offset = 0) {
  const base = index * 3;
  target[offset] = data[base];
  target[offset + 1] = data[base + 1];
  target[offset + 2] = data[base + 2];
}

function squaredDistance(a, ai, b, bi) {
  const dx = a[ai] - b[bi];
  const dy = a[ai + 1] - b[bi + 1];
  const dz = a[ai + 2] - b[bi + 2];
  return dx * dx + dy * dy + dz * dz;
}

function kmeansPlusPlusInit(data, k, rng) {
  const n = data.length / 3;
  const centroids = new Float32Array(k * 3);
  const chosen = new Set();
  let idx = Math.floor(rng() * n);
  chosen.add(idx);
  copyPoint(data, idx, centroids, 0);

  const dist = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    dist[i] = squaredDistance(data, i * 3, centroids, 0);
  }

  for (let c = 1; c < k; c++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      if (chosen.has(i)) continue;
      const d = dist[i];
      sum += d;
    }
    if (sum === 0) {
      // All distances zero (identical points). pick random remaining.
      do {
        idx = Math.floor(rng() * n);
      } while (chosen.has(idx) && chosen.size < n);
      copyPoint(data, idx, centroids, c * 3);
      chosen.add(idx);
      continue;
    }
    let threshold = rng() * sum;
    idx = -1;
    for (let i = 0; i < n; i++) {
      if (chosen.has(i)) continue;
      threshold -= dist[i];
      if (threshold <= 0) {
        idx = i;
        break;
      }
    }
    if (idx === -1) {
      idx = Math.floor(rng() * n);
      while (chosen.has(idx) && chosen.size < n) {
        idx = (idx + 1) % n;
      }
    }
    copyPoint(data, idx, centroids, c * 3);
    chosen.add(idx);
    for (let i = 0; i < n; i++) {
      const d = squaredDistance(data, i * 3, centroids, c * 3);
      if (d < dist[i]) dist[i] = d;
    }
  }
  return centroids;
}

function reassignEmptyCluster(data, rng) {
  const n = data.length / 3;
  const idx = Math.floor(rng() * n);
  return [data[idx * 3], data[idx * 3 + 1], data[idx * 3 + 2]];
}

export function runKMeans(data, k, options = {}) {
  const { maxIter = 100, tol = 1e-3, warmStart, rngSeed = 1, shouldCancel } = options;
  const n = data.length / 3;
  if (k <= 0 || n === 0) {
    return {
      centroids: new Float32Array(0),
      counts: new Uint32Array(0),
      iterations: 0,
      converged: true,
      cancelled: false
    };
  }
  const rng = createRng(rngSeed);
  const effectiveK = Math.min(k, n);
  let centroids;
  if (warmStart instanceof Float32Array && warmStart.length === effectiveK * 3) {
    centroids = new Float32Array(warmStart);
  } else {
    centroids = kmeansPlusPlusInit(data, effectiveK, rng);
  }

  const counts = new Uint32Array(effectiveK);
  const sums = new Float32Array(effectiveK * 3);
  const labels = new Uint16Array(n);
  let converged = false;
  let iterations = 0;

  for (let iter = 0; iter < maxIter; iter++) {
    iterations = iter + 1;
    counts.fill(0);
    sums.fill(0);
    let maxShift = 0;

    // Assignment step
    for (let i = 0; i < n; i++) {
      if (shouldCancel && shouldCancel()) {
        return {
          centroids,
          counts,
          iterations,
          converged,
          cancelled: true
        };
      }
      let bestIdx = 0;
      let bestDist = Infinity;
      const px = data[i * 3];
      const py = data[i * 3 + 1];
      const pz = data[i * 3 + 2];
      for (let c = 0; c < effectiveK; c++) {
        const cx = centroids[c * 3];
        const cy = centroids[c * 3 + 1];
        const cz = centroids[c * 3 + 2];
        const dx = px - cx;
        const dy = py - cy;
        const dz = pz - cz;
        const dist = dx * dx + dy * dy + dz * dz;
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = c;
        }
      }
      labels[i] = bestIdx;
      counts[bestIdx] += 1;
      sums[bestIdx * 3] += px;
      sums[bestIdx * 3 + 1] += py;
      sums[bestIdx * 3 + 2] += pz;
    }

    // Update step
    for (let c = 0; c < effectiveK; c++) {
      if (counts[c] === 0) {
        const [rx, ry, rz] = reassignEmptyCluster(data, rng);
        centroids[c * 3] = rx;
        centroids[c * 3 + 1] = ry;
        centroids[c * 3 + 2] = rz;
        continue;
      }
      const inv = 1 / counts[c];
      const nx = sums[c * 3] * inv;
      const ny = sums[c * 3 + 1] * inv;
      const nz = sums[c * 3 + 2] * inv;
      const dx = centroids[c * 3] - nx;
      const dy = centroids[c * 3 + 1] - ny;
      const dz = centroids[c * 3 + 2] - nz;
      const shift = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (shift > maxShift) maxShift = shift;
      centroids[c * 3] = nx;
      centroids[c * 3 + 1] = ny;
      centroids[c * 3 + 2] = nz;
    }

    if (maxShift <= tol) {
      converged = true;
      break;
    }
    if (shouldCancel && shouldCancel()) {
      return {
        centroids,
        counts,
        iterations,
        converged,
        cancelled: true
      };
    }
  }

  return {
    centroids,
    counts,
    iterations,
    converged,
    cancelled: false
  };
}

export function buildDatasetFromRgbBuffer(buffer, stride = 1, minLum = 0, maxSamples = Infinity, rngSeed = 1) {
  const pixels = new Uint8ClampedArray(buffer);
  const total = Math.floor(pixels.length / 4);
  const estimated = Math.ceil(total / Math.max(1, stride));
  const cap = Math.min(estimated, maxSamples);
  const out = new Float32Array(cap * 3);
  let count = 0;
  const rng = createRng(rngSeed);
  for (let i = 0; i < total; i += stride) {
    const r = pixels[i * 4];
    const g = pixels[i * 4 + 1];
    const b = pixels[i * 4 + 2];
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (y < minLum) continue;
    if (count < cap) {
      out[count * 3] = r;
      out[count * 3 + 1] = g;
      out[count * 3 + 2] = b;
    } else {
      const j = Math.floor(rng() * (count + 1));
      if (j < cap) {
        out[j * 3] = r;
        out[j * 3 + 1] = g;
        out[j * 3 + 2] = b;
      }
    }
    count++;
  }
  const actual = Math.min(count, cap);
  return out.slice(0, actual * 3);
}

export function sortClustersByCount(clusters) {
  return [...clusters].sort((a, b) => b.count - a.count);
}

export function hexFromRgb({ r, g, b }) {
  return `#${clamp(Math.round(r)).toString(16).padStart(2, '0')}${clamp(Math.round(g)).toString(16).padStart(2, '0')}${clamp(Math.round(b)).toString(16).padStart(2, '0')}`.toUpperCase();
}
