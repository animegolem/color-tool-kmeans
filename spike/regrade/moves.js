// How a drag on one centre moves the others. Pure; centres are packed OKLab, C = Float32Array(K * 3).
//
// one:   only the dragged centre moves.
// net:   every centre follows by w = exp(-d² / reach²), d its OKLab distance from the dragged one.
//        reach = Infinity moves the whole set rigidly.
// curve: the centres are threaded into a path (dark to light, or a closed loop by hue), a few of
//        them are anchors, and every other centre takes the blend of the two anchors around it,
//        by its arc-length position between them, through an easing. Poline's idea, in OKLab.

export const EASES = {
  linear: (u) => u,
  smooth: (u) => u * u * (3 - 2 * u),
  sine: (u) => 0.5 - 0.5 * Math.cos(Math.PI * u),
};

const dist = (C, i, j) =>
  Math.hypot(
    C[i * 3] - C[j * 3],
    C[i * 3 + 1] - C[j * 3 + 1],
    C[i * 3 + 2] - C[j * 3 + 2]
  );

export function netWeights(C, K, j, reach) {
  if (!(reach > 0)) throw new Error('reach must be > 0');
  const w = new Float32Array(K);
  for (let i = 0; i < K; i++)
    w[i] =
      reach === Infinity ? 1 : Math.exp(-(dist(C, i, j) ** 2) / reach ** 2);
  return w;
}

// The path through the centres. order 'light': by L, open. order 'hue': by hue angle, closed.
// Returns the chain (centre indices in path order) and each chain position's arc length.
export function buildPath(C, K, order) {
  if (order !== 'light' && order !== 'hue') throw new Error(`order ${order}`);
  const key = (j) =>
    order === 'light' ? C[j * 3] : Math.atan2(C[j * 3 + 2], C[j * 3 + 1]);
  const chain = [...Array(K).keys()].sort((p, q) => key(p) - key(q));
  const s = new Float64Array(K + 1);
  for (let k = 1; k <= K; k++)
    s[k] = s[k - 1] + dist(C, chain[k - 1], chain[k % K]);
  // s[K] closes the loop back to chain[0]; an open path ignores it.
  return { chain, closed: order === 'hue', s };
}

// Default anchors: the path's ends (or, for a loop, its first point) plus the points that bend it
// most, by Douglas–Peucker in OKLab, up to `max`. Returns chain positions, sorted.
export function defaultAnchors(C, path, max = 4) {
  const { chain } = path,
    K = chain.length;
  const picked = new Set(path.closed ? [0] : [0, K - 1]);
  const lineDist = (p, a, b) => {
    const P = chain[p],
      A = chain[a],
      B = chain[b % K];
    const ab = [0, 1, 2].map((t) => C[B * 3 + t] - C[A * 3 + t]);
    const ap = [0, 1, 2].map((t) => C[P * 3 + t] - C[A * 3 + t]);
    const len2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2 || 1e-12;
    const u = Math.max(
      0,
      Math.min(1, (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / len2)
    );
    return Math.hypot(ap[0] - u * ab[0], ap[1] - u * ab[1], ap[2] - u * ab[2]);
  };
  while (picked.size < Math.min(max, K)) {
    const sorted = [...picked].sort((p, q) => p - q);
    const ends = path.closed ? [...sorted, sorted[0] + K] : sorted;
    let best = -1,
      bd = -1;
    for (let k = 0; k + 1 < ends.length; k++)
      for (let p = ends[k] + 1; p < ends[k + 1]; p++) {
        const d = lineDist(p % K, ends[k] % K, ends[k + 1]);
        if (d > bd) {
          bd = d;
          best = p % K;
        }
      }
    if (best < 0) break;
    picked.add(best);
  }
  return [...picked].sort((p, q) => p - q);
}

// For each centre: the two anchors around it on the path and its eased position u between them.
// anchorPos: sorted chain positions. Returns { lo, hi, u } per centre index (lo === hi on anchors).
export function curveBlend(path, anchorPos, ease = 'linear') {
  const { chain, closed, s } = path,
    K = chain.length,
    f = EASES[ease];
  if (!f) throw new Error(`ease ${ease}`);
  if (anchorPos.length < 1) throw new Error('a curve needs an anchor');
  const lo = new Int32Array(K),
    hi = new Int32Array(K),
    u = new Float32Array(K);
  const A = anchorPos;
  for (let p = 0; p < K; p++) {
    const j = chain[p];
    let k = A.findIndex(
      (a, i) => a <= p && (i + 1 === A.length || A[i + 1] > p)
    );
    let a0,
      a1,
      s0,
      s1,
      sp = s[p];
    if (k >= 0 && A[k] === p) {
      lo[j] = hi[j] = chain[p];
      u[j] = 0;
      continue;
    }
    if (k < 0 || k + 1 === A.length) {
      if (!closed) {
        // Before the first or after the last anchor on an open path: hold that anchor's move.
        const a = k < 0 ? A[0] : A[A.length - 1];
        lo[j] = hi[j] = chain[a];
        u[j] = 0;
        continue;
      }
      // On a loop: between the last anchor and the first, wrapping through the closing segment.
      a0 = A[A.length - 1];
      a1 = A[0];
      s0 = s[a0];
      s1 = s[K] + s[a1];
      if (sp < s0) sp += s[K];
    } else {
      a0 = A[k];
      a1 = A[k + 1];
      s0 = s[a0];
      s1 = s[a1];
    }
    lo[j] = chain[a0];
    hi[j] = chain[a1];
    u[j] = f(s1 > s0 ? (sp - s0) / (s1 - s0) : 0);
  }
  return { lo, hi, u };
}

// Fill every non-anchor centre's offset from its anchors' offsets. OFF is updated in place.
export function applyCurve(OFF, blend, K) {
  for (let j = 0; j < K; j++) {
    const { lo, hi, u } = blend;
    if (lo[j] === j && hi[j] === j) continue;
    for (let t = 0; t < 3; t++)
      OFF[j * 3 + t] =
        (1 - u[j]) * OFF[lo[j] * 3 + t] + u[j] * OFF[hi[j] * 3 + t];
  }
}
