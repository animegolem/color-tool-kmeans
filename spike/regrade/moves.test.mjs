// Checks for moves.js. Run: node moves.test.mjs
import assert from 'node:assert/strict';
import {
  netWeights,
  buildPath,
  defaultAnchors,
  curveBlend,
  applyCurve,
} from './moves.js';
import { mulberry32 } from './kmeans.js';

const K = 12,
  rnd = mulberry32(3);
const C = new Float32Array(K * 3).map((_, i) =>
  i % 3 === 0 ? 0.2 + 0.7 * rnd() : 0.3 * rnd() - 0.15
);
const close = (a, b, e = 1e-6) =>
  assert.ok(Math.abs(a - b) <= e, `${a} vs ${b}`);

// net: the dragged centre moves fully; infinite reach is rigid; tiny reach moves only it.
let w = netWeights(C, K, 4, 0.1);
close(w[4], 1);
assert.ok([...w].every((v) => v > 0 && v <= 1));
assert.ok(netWeights(C, K, 4, Infinity).every((v) => v === 1));
assert.ok(
  netWeights(C, K, 4, 1e-6).every((v, i) => (i === 4 ? v === 1 : v < 1e-9))
);

for (const order of ['light', 'hue']) {
  const path = buildPath(C, K, order);
  assert.deepEqual(
    [...path.chain].sort((a, b) => a - b),
    [...Array(K).keys()]
  );
  for (let k = 1; k <= K; k++) assert.ok(path.s[k] >= path.s[k - 1]);
  const A = defaultAnchors(C, path, 4);
  assert.equal(A.length, 4);
  if (order === 'light') assert.deepEqual([A[0], A[3]], [0, K - 1]); // ends of an open path
  for (const ease of ['linear', 'smooth', 'sine']) {
    const b = curveBlend(path, A, ease);
    // Anchors map to themselves; everything else blends two anchors with u in [0, 1].
    for (const p of A) {
      const j = path.chain[p];
      assert.equal(b.lo[j], j);
      assert.equal(b.hi[j], j);
    }
    assert.ok([...b.u].every((v) => v >= 0 && v <= 1));
    // Equal anchor moves give a rigid move of every centre.
    const OFF = new Float32Array(K * 3);
    for (const p of A) OFF.set([0.01, -0.02, 0.03], path.chain[p] * 3);
    applyCurve(OFF, b, K);
    for (let j = 0; j < K; j++) {
      close(OFF[j * 3], 0.01);
      close(OFF[j * 3 + 1], -0.02);
      close(OFF[j * 3 + 2], 0.03);
    }
    // One anchor moved: the move never exceeds it and falls off along the path.
    OFF.fill(0);
    OFF.set([0.05, 0, 0], path.chain[A[1]] * 3);
    applyCurve(OFF, b, K);
    assert.ok([...OFF].every((v) => v >= -1e-9 && v <= 0.05 + 1e-9));
  }
}
// An open path: centres beyond the end anchors hold the end anchor's move.
const path = buildPath(C, K, 'light');
const b = curveBlend(path, [2, 8]);
const OFF = new Float32Array(K * 3);
OFF.set([0, 0.04, 0], path.chain[2] * 3);
applyCurve(OFF, b, K);
close(OFF[path.chain[0] * 3 + 1], 0.04);
close(OFF[path.chain[K - 1] * 3 + 1], 0);
console.log('moves: all checks passed');
