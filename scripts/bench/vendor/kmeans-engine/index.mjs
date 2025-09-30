// Minimal offline implementation matching the kmeans-engine@1.5.0 API surface
// we need for the Observable baseline. It supports:
//   kmeans.clusterize(points, { k, maxIterations? }, cb)
// where points is an array of sparse-like objects (feature:value pairs).
// Returns clusters: [{ centroid: object, vectorIds: number[] }].

function keysUnion(points) {
  const set = new Set();
  for (const p of points) for (const k of Object.keys(p)) set.add(k);
  return Array.from(set);
}

function toVector(p, dims) {
  const v = new Float64Array(dims.length);
  for (let i = 0; i < dims.length; i++) v[i] = Number(p[dims[i]] || 0);
  return v;
}

function fromVector(v, dims) {
  const o = {};
  for (let i = 0; i < dims.length; i++) o[dims[i]] = v[i];
  return o;
}

function sqDist(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return s;
}

function kppInit(vectors, k, rng) {
  const n = vectors.length;
  const d = vectors[0].length;
  const centroids = Array.from({ length: k }, () => new Float64Array(d));
  const chosen = new Set();
  let idx = Math.floor(rng() * n);
  chosen.add(idx);
  centroids[0].set(vectors[idx]);
  const dist = new Float64Array(n);
  for (let i = 0; i < n; i++) dist[i] = sqDist(vectors[i], centroids[0]);
  for (let c = 1; c < k; c++) {
    let sum = 0;
    for (let i = 0; i < n; i++) if (!chosen.has(i)) sum += dist[i];
    if (sum === 0) {
      do { idx = Math.floor(rng() * n); } while (chosen.has(idx));
      centroids[c].set(vectors[idx]);
      chosen.add(idx);
      continue;
    }
    let r = rng() * sum;
    idx = -1;
    for (let i = 0; i < n; i++) {
      if (chosen.has(i)) continue;
      r -= dist[i];
      if (r <= 0) { idx = i; break; }
    }
    if (idx < 0) idx = Math.floor(rng() * n);
    centroids[c].set(vectors[idx]);
    chosen.add(idx);
    for (let i = 0; i < n; i++) {
      const d2 = sqDist(vectors[i], centroids[c]);
      if (d2 < dist[i]) dist[i] = d2;
    }
  }
  return centroids;
}

function rngFactory(seed = 1) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 0xffffffff;
  };
}

function kmeansVectors(vectors, k, { maxIterations = 100, seed = 1 } = {}) {
  const n = vectors.length;
  const dims = vectors[0].length;
  k = Math.max(1, Math.min(k, n));
  const rng = rngFactory(seed);
  const centroids = kppInit(vectors, k, rng);
  const labels = new Int32Array(n);
  const counts = new Int32Array(k);
  const sums = Array.from({ length: k }, () => new Float64Array(dims));

  for (let iter = 0; iter < maxIterations; iter++) {
    counts.fill(0);
    for (let c = 0; c < k; c++) sums[c].fill(0);

    // assign
    for (let i = 0; i < n; i++) {
      let best = 0, bestD = Infinity;
      const v = vectors[i];
      for (let c = 0; c < k; c++) {
        const d2 = sqDist(v, centroids[c]);
        if (d2 < bestD) { bestD = d2; best = c; }
      }
      labels[i] = best;
      counts[best]++;
      const s = sums[best];
      for (let j = 0; j < dims; j++) s[j] += v[j];
    }

    // update
    let moved = 0;
    for (let c = 0; c < k; c++) {
      if (counts[c] === 0) continue;
      for (let j = 0; j < dims; j++) {
        const next = sums[c][j] / counts[c];
        moved += Math.abs(centroids[c][j] - next);
        centroids[c][j] = next;
      }
    }
    if (moved < 1e-6) break;
  }

  // clusters
  const clusters = Array.from({ length: k }, () => ({ vectorIds: [] }));
  for (let i = 0; i < n; i++) clusters[labels[i]].vectorIds.push(i);
  for (let c = 0; c < k; c++) clusters[c].centroid = centroids[c];
  return { labels, centroids, clusters };
}

const kmeans = {
  clusterize(points, options, cb) {
    try {
      const dims = keysUnion(points);
      const vectors = points.map((p) => toVector(p, dims));
      const { clusters } = kmeansVectors(vectors, options?.k || 1, options);
      // map back centroid arrays → objects with the same dims
      for (const c of clusters) c.centroid = fromVector(c.centroid, dims);
      cb(null, clusters);
    } catch (err) {
      cb(err);
    }
  }
};

export default kmeans;

