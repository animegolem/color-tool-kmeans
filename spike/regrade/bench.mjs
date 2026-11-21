// Lloyd vs e-means at Color Tool's scale. Same samples, same starting centres, several seeds.
// Usage: node bench.mjs <image> [ffmpeg]
// Decodes the image with ffmpeg to RGBA, samples it as the app does, and prints a markdown table.
import { spawnSync } from 'node:child_process';
import { sampleRGBA } from './oklab.js';
import { kmeansPP, randomInit, lloyd, emeans, mse, recipe } from './kmeans.js';

const [img, ffmpeg = 'ffmpeg'] = process.argv.slice(2);
if (!img) throw new Error('usage: node bench.mjs <image> [ffmpeg]');
const probe = spawnSync(
  ffmpeg,
  ['-v', 'error', '-i', img, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'],
  { maxBuffer: 1 << 30 }
);
if (probe.status !== 0) throw new Error(probe.stderr.toString());
const rgba = new Uint8Array(
  probe.stdout.buffer,
  probe.stdout.byteOffset,
  probe.stdout.length
);
const pixels = rgba.length / 4;

const SEEDS = [1, 2, 3, 4, 5];
const now = () => performance.now();
const median = (a) => a.slice().sort((p, q) => p - q)[a.length >> 1];
const rows = [];

for (const n of [6000, 25000, 100000]) {
  const X = sampleRGBA(rgba, pixels, n);
  for (const K of [8, 16, 32, 64]) {
    const r = { n: X.length / 3, K, t: {}, e: {} };
    const add = (key, ms, err) => {
      (r.t[key] ??= []).push(ms);
      (r.e[key] ??= []).push(err);
    };
    for (const seed of SEEDS) {
      let t0 = now();
      const Cpp = kmeansPP(X, K, seed);
      const tpp = now() - t0;
      t0 = now();
      const L = lloyd(X, Cpp, K);
      add('lloyd', tpp + now() - t0, mse(X, L.C, K));
      for (const it of [2, 5, 10]) {
        t0 = now();
        const Lc = lloyd(X, Cpp, K, { maxIter: it });
        add(`ll${it}`, tpp + now() - t0, mse(X, Lc.C, K));
      }
      t0 = now();
      const Lcc = lloyd(X, Cpp, K, { tol: 1e-3, rule: 'norm' });
      add('llcc', tpp + now() - t0, mse(X, Lcc.C, K));
      (r.ccIters ??= []).push(Lcc.iters);
      for (const T of [1, 2, 5]) {
        t0 = now();
        const E = emeans(X, Cpp, K, { nepochs: T, seed });
        add(`em${T}`, tpp + now() - t0, mse(X, E.C, K));
      }
      t0 = now();
      const Cr = randomInit(X, K, seed);
      const E = emeans(X, Cr, K, { nepochs: 5, seed });
      add('em5rand', now() - t0, mse(X, E.C, K));
      (r.iters ??= []).push(L.iters);
    }
    r.recipe = recipe(r.n, K, 5);
    rows.push(r);
  }
}

const keys = [
  'lloyd',
  'll2',
  'll5',
  'll10',
  'llcc',
  'em1',
  'em2',
  'em5',
  'em5rand',
];
console.log(
  `image ${img}: ${pixels} px; median of ${SEEDS.length} seeds; error relative to Lloyd's (lower is better)\n`
);
console.log(
  '| n | K | Lloyd ms (iters) | ' +
    keys
      .slice(1)
      .map((k) => `${k} ms / err`)
      .join(' | ') +
    ' | color-core rule iters | B, α0 (5 ep) |'
);
console.log('|' + ' --- |'.repeat(keys.length + 4));
for (const r of rows) {
  const base = median(r.e.lloyd);
  const cells = keys
    .slice(1)
    .map(
      (k) =>
        `${median(r.t[k]).toFixed(1)} / ${(median(r.e[k]) / base).toFixed(3)}`
    );
  console.log(
    `| ${r.n} | ${r.K} | ${median(r.t.lloyd).toFixed(1)} (${median(r.iters)}) | ${cells.join(' | ')} | ${median(r.ccIters)} | ${r.recipe.B}, ${r.recipe.alpha0.toFixed(3)} |`
  );
}
