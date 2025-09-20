import test from 'node:test';
import assert from 'node:assert/strict';
import { runKMeans } from '../src/worker/kmeans.js';

function createClusteredDataset() {
  const points = [];
  for (let i = 0; i < 120; i++) {
    points.push(10 + Math.random() * 5, 12 + Math.random() * 5, 14 + Math.random() * 5);
  }
  for (let i = 0; i < 150; i++) {
    points.push(200 + Math.random() * 5, 210 + Math.random() * 5, 205 + Math.random() * 5);
  }
  return new Float32Array(points);
}

test('runKMeans separates obvious clusters', () => {
  const data = createClusteredDataset();
  const result = runKMeans(data, 2, { rngSeed: 123, tol: 0.01, maxIter: 50 });
  assert.equal(result.counts.length, 2);
  assert.ok(result.converged);
  const counts = [...result.counts];
  counts.sort((a, b) => a - b);
  assert.ok(counts[0] > 80 && counts[1] > 120, 'expected cluster counts near input sizes');
});

test('runKMeans supports warm starts', () => {
  const data = createClusteredDataset();
  const first = runKMeans(data, 2, { rngSeed: 456, tol: 0.01 });
  const second = runKMeans(data, 2, { warmStart: first.centroids, tol: 0.01 });
  assert.ok(second.iterations <= first.iterations);
});

test('runKMeans cancels when shouldCancel returns true', () => {
  const data = createClusteredDataset();
  let calls = 0;
  const result = runKMeans(data, 2, {
    shouldCancel: () => {
      calls += 1;
      return calls > 1;
    }
  });
  assert.equal(result.cancelled, true);
});

test('runKMeans deterministic with same seed', () => {
  const data = createClusteredDataset();
  const first = runKMeans(data, 3, { rngSeed: 123, tol: 0.01 });
  const second = runKMeans(data, 3, { rngSeed: 123, tol: 0.01 });
  assert.equal(first.centroids.length, second.centroids.length);
  for (let i = 0; i < first.centroids.length; i++) {
    assert.ok(Math.abs(first.centroids[i] - second.centroids[i]) < 1e-6);
  }
});
