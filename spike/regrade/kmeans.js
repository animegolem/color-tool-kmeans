// Clustering in OKLab (d = 3): seeded k-means++, Lloyd, e-means (batch) and e-means (streaming).
// Data is packed: X = Float32Array(n * 3), centres C = Float32Array(K * 3).
//
// e-means is ported from faiss contrib/e_means (MIT, Meta Platforms; Bessa et al. 2026,
// arXiv 2611.09501), following base.py and e_means.py at faiss main, 2026-11-21.

export const K_MAX = 64;
export const D = 3;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Nearest centre of row i. Returns the index; writes the squared distance to DIST[0].
const DIST = new Float64Array(1);
function nearest(X, i, C, K) {
  const x = X[i * 3],
    y = X[i * 3 + 1],
    z = X[i * 3 + 2];
  let best = 0,
    bd = Infinity;
  for (let j = 0; j < K; j++) {
    const dx = x - C[j * 3],
      dy = y - C[j * 3 + 1],
      dz = z - C[j * 3 + 2];
    const d = dx * dx + dy * dy + dz * dz;
    if (d < bd) {
      bd = d;
      best = j;
    }
  }
  DIST[0] = bd;
  return best;
}

// Mean squared error of the exact assignment. The score every method is judged by.
export function mse(X, C, K) {
  const n = X.length / 3;
  let s = 0;
  for (let i = 0; i < n; i++) {
    nearest(X, i, C, K);
    s += DIST[0];
  }
  return s / n;
}

export function kmeansPP(X, K, seed) {
  const n = X.length / 3;
  if (!(K >= 1 && K <= K_MAX && n >= K))
    throw new Error(`kmeansPP: K=${K} n=${n}`);
  const rnd = mulberry32(seed);
  const C = new Float32Array(K * 3);
  const d2 = new Float64Array(n).fill(Infinity);
  let pick = Math.floor(rnd() * n);
  for (let j = 0; j < K; j++) {
    C.set(X.subarray(pick * 3, pick * 3 + 3), j * 3);
    let total = 0;
    for (let i = 0; i < n; i++) {
      const dx = X[i * 3] - C[j * 3],
        dy = X[i * 3 + 1] - C[j * 3 + 1],
        dz = X[i * 3 + 2] - C[j * 3 + 2];
      const d = dx * dx + dy * dy + dz * dz;
      if (d < d2[i]) d2[i] = d;
      total += d2[i];
    }
    let r = rnd() * total;
    pick = n - 1;
    for (let i = 0; i < n; i++) {
      r -= d2[i];
      if (r <= 0) {
        pick = i;
        break;
      }
    }
  }
  return C;
}

// Random rows as starting centres: e-means' own default initialisation.
export function randomInit(X, K, seed) {
  const n = X.length / 3,
    rnd = mulberry32(seed),
    C = new Float32Array(K * 3);
  const idx = new Uint32Array(n).map((_, i) => i);
  for (let j = 0; j < K; j++) {
    const r = j + Math.floor(rnd() * (n - j));
    const t = idx[j];
    idx[j] = idx[r];
    idx[r] = t;
    C.set(X.subarray(idx[j] * 3, idx[j] * 3 + 3), j * 3);
  }
  return C;
}

// Lloyd's algorithm. Bounded by maxIter; stops when no centre moves more than tol.
export function lloyd(X, C0, K, { maxIter = 40, tol = 1e-4 } = {}) {
  const n = X.length / 3,
    C = C0.slice(),
    S = new Float64Array(K * 3),
    N = new Uint32Array(K);
  let iters = 0;
  for (; iters < maxIter; iters++) {
    S.fill(0);
    N.fill(0);
    for (let i = 0; i < n; i++) {
      const j = nearest(X, i, C, K);
      S[j * 3] += X[i * 3];
      S[j * 3 + 1] += X[i * 3 + 1];
      S[j * 3 + 2] += X[i * 3 + 2];
      N[j]++;
    }
    let moved = 0;
    for (let j = 0; j < K; j++) {
      if (!N[j]) continue;
      for (let d = 0; d < 3; d++) {
        const v = S[j * 3 + d] / N[j];
        moved = Math.max(moved, Math.abs(v - C[j * 3 + d]));
        C[j * 3 + d] = v;
      }
    }
    if (moved < tol) {
      iters++;
      break;
    }
  }
  return { C, iters, distEvals: iters * n * K };
}

// ---- e-means -------------------------------------------------------------------------------

const ALPHA_MIN_FACTOR = 0.1; // base.py: cosine anneal to one tenth of alpha0
const INIT_USAGE = 2 ** -16; // base.py: initial EMA mass N_j
const CHECK_UNUSED_EVERY = 5; // base.py: revival check period, in updates
const UNUSED_THRESHOLD = 0.1; // base.py: revive N_j < tau * mean(N), on for d > 2
const SPLIT_EPSILON = 1e-4; // base.py: donor split perturbation

// Batch and step laws (base.py, "quality" law: the default at d <= 16).
export function recipe(n, K, nepochs) {
  let B = 0.00439175 * K ** 0.134749 * n ** 0.876473 * nepochs ** 0.813344;
  B = 2 ** Math.round(Math.log2(Math.max(1, B)));
  B = Math.max(1, Math.min(B, Math.floor(n / 2)));
  let alpha0 =
    0.8244 * K ** -0.4617 * B ** 0.9003 * n ** -0.4498 * nepochs ** -0.1057;
  alpha0 = Math.min(Math.max(alpha0, 1e-4), 1);
  return { B, alpha0 };
}

// One EMA update from a batch's per-cluster sums S and counts N (Algorithm 1, line 8).
function applyStats(C, usage, S, N, K, alpha) {
  const decay = 1 - alpha;
  for (let j = 0; j < K; j++) {
    usage[j] *= decay;
    if (!N[j]) continue;
    const mass = usage[j] + alpha * N[j];
    const w = (alpha * N[j]) / mass;
    for (let d = 0; d < 3; d++) {
      const mean = S[j * 3 + d] / N[j];
      C[j * 3 + d] = w === 1 ? mean : C[j * 3 + d] + w * (mean - C[j * 3 + d]);
    }
    usage[j] = mass;
  }
}

// Revive clusters below tau * mean mass by splitting donors drawn in proportion to mass
// (Gumbel top-k, as e_means.py). The offset is additive: OKLab a and b sit near zero, where
// faiss's multiplicative offset would leave donor and child identical.
function revive(C, usage, K, rnd) {
  let mean = 0;
  for (let j = 0; j < K; j++) mean += usage[j];
  const thr = (UNUSED_THRESHOLD * mean) / K;
  const unused = [],
    keys = [];
  for (let j = 0; j < K; j++) {
    if (usage[j] < thr) unused.push(j);
    else if (usage[j] > 0)
      keys.push([
        Math.log(usage[j]) - Math.log(-Math.log(Math.max(rnd(), 1e-300))),
        j,
      ]);
  }
  const nsplit = Math.min(unused.length, keys.length);
  if (!nsplit) return 0;
  keys.sort((p, q) => q[0] - p[0]);
  for (let s = 0; s < nsplit; s++) {
    const src = keys[s][1],
      dst = unused[s];
    for (let d = 0; d < 3; d++) {
      const off = SPLIT_EPSILON * (d % 2 ? -1 : 1);
      C[dst * 3 + d] = C[src * 3 + d] + off;
      C[src * 3 + d] -= off;
    }
    usage[src] /= 2;
    usage[dst] = usage[src];
  }
  return nsplit;
}

// e-means on a fixed sample. Ends with the closing mean of the last epoch (Algorithm 1, line 12).
export function emeans(X, C0, K, { nepochs = 5, seed = 1234 } = {}) {
  const n = X.length / 3;
  if (!Number.isInteger(nepochs) || nepochs < 1 || nepochs > 50)
    throw new Error('nepochs: whole, 1..50');
  const { B, alpha0 } = recipe(n, K, nepochs);
  const steps = Math.ceil(n / B),
    totalSteps = steps * nepochs;
  const C = C0.slice(),
    usage = new Float64Array(K).fill(INIT_USAGE);
  const S = new Float64Array(K * 3),
    N = new Float64Array(K);
  const passS = new Float64Array(K * 3),
    passN = new Float64Array(K);
  const perm = new Uint32Array(n).map((_, i) => i);
  const rnd = mulberry32(seed);
  let step = 0,
    splits = 0;
  for (let e = 0; e < nepochs; e++) {
    for (let i = n - 1; i > 0; i--) {
      const r = Math.floor(rnd() * (i + 1));
      const t = perm[i];
      perm[i] = perm[r];
      perm[r] = t;
    }
    passS.fill(0);
    passN.fill(0);
    for (let b = 0; b < n; b += B) {
      S.fill(0);
      N.fill(0);
      const end = Math.min(n, b + B);
      for (let q = b; q < end; q++) {
        const i = perm[q],
          j = nearest(X, i, C, K);
        S[j * 3] += X[i * 3];
        S[j * 3 + 1] += X[i * 3 + 1];
        S[j * 3 + 2] += X[i * 3 + 2];
        N[j]++;
      }
      for (let t = 0; t < K * 3; t++) passS[t] += S[t];
      for (let j = 0; j < K; j++) passN[j] += N[j];
      const frac = Math.min(step, totalSteps) / Math.max(1, totalSteps);
      const alpha =
        alpha0 *
        (ALPHA_MIN_FACTOR +
          (1 - ALPHA_MIN_FACTOR) * 0.5 * (1 + Math.cos(Math.PI * frac)));
      applyStats(C, usage, S, N, K, alpha);
      if ((step + 1) % CHECK_UNUSED_EVERY === 0)
        splits += revive(C, usage, K, rnd);
      step++;
    }
  }
  for (let j = 0; j < K; j++) {
    if (!passN[j]) continue;
    for (let d = 0; d < 3; d++) C[j * 3 + d] = passS[j * 3 + d] / passN[j];
  }
  return {
    C,
    B,
    alpha0,
    steps: totalSteps,
    splits,
    distEvals: nepochs * n * K,
  };
}

// Streaming e-means for video: one batch per frame, constant step, no revival, so that a
// centre keeps its index (and the user's offset on it) from frame to frame.
export function createStream(C0, K, { alpha = 0.2 } = {}) {
  if (!(alpha > 0 && alpha <= 1)) throw new Error('alpha in (0, 1]');
  const C = C0.slice(),
    usage = new Float64Array(K).fill(1);
  const S = new Float64Array(K * 3),
    N = new Float64Array(K);
  return {
    C,
    step(X) {
      const n = X.length / 3;
      S.fill(0);
      N.fill(0);
      for (let i = 0; i < n; i++) {
        const j = nearest(X, i, C, K);
        S[j * 3] += X[i * 3];
        S[j * 3 + 1] += X[i * 3 + 1];
        S[j * 3 + 2] += X[i * 3 + 2];
        N[j]++;
      }
      // Normalise counts to shares so the step does not depend on the sample size.
      for (let j = 0; j < K; j++)
        if (N[j]) {
          const f = K / n;
          S[j * 3] *= f;
          S[j * 3 + 1] *= f;
          S[j * 3 + 2] *= f;
          N[j] *= f;
        }
      applyStats(C, usage, S, N, K, alpha);
    },
  };
}
