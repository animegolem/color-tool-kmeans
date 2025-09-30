#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..', '..');

const width = 8;
const height = 8;
const params = {
  width,
  height,
  stride: 1,
  minLum: 0,
  k: 3,
  maxIter: 25,
  tol: 1e-3,
  seed: 42,
  space: 'CIELAB',
  maxSamples: 512
};

// Build a synthetic RGBA image with three dominant clusters.
const data = new Uint8Array(width * height * 4);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    if (y < height / 3) {
      data[idx + 0] = 240;
      data[idx + 1] = 30;
      data[idx + 2] = 50;
    } else if (y < (2 * height) / 3) {
      data[idx + 0] = 40;
      data[idx + 1] = 200;
      data[idx + 2] = 120;
    } else {
      data[idx + 0] = 30;
      data[idx + 1] = 60;
      data[idx + 2] = 220;
    }
    data[idx + 3] = 255;
  }
}

function loadWasmExports() {
  const modulePath = join(ROOT, 'compute-wasm', 'pkg-node', 'compute_wasm.js');
  return import(modulePath).then((module) => module.default ?? module);
}

async function runWasm() {
  const wasm = await loadWasmExports();
  if (typeof wasm.analyze_image !== 'function') {
    throw new Error('wasm exports missing analyze_image');
  }
  const wasmResult = wasm.analyze_image(data, params);
  return wasmResult;
}

async function runNative() {
  const cliPath = join(ROOT, 'tauri-app', 'src-tauri');
  const payload = JSON.stringify({ ...params, data: Array.from(data) });

  return new Promise((resolvePromise, rejectPromise) => {
    const proc = spawn(
      'cargo',
      ['run', '--quiet', '--manifest-path', join(cliPath, 'Cargo.toml'), '--bin', 'compute_cli'],
      { stdio: ['pipe', 'pipe', 'inherit'] }
    );

    let stdout = '';
    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    proc.on('error', (err) => rejectPromise(err));
    proc.on('close', (code) => {
      if (code !== 0) {
        rejectPromise(new Error(`compute_cli exited with code ${code}`));
        return;
      }
      try {
        const parsed = JSON.parse(stdout);
        resolvePromise(parsed);
      } catch (err) {
        rejectPromise(err);
      }
    });

    proc.stdin.write(payload);
    proc.stdin.end();
  });
}

function diffClusters(wasmClusters, nativeClusters) {
  const len = Math.min(wasmClusters.length, nativeClusters.length);
  const deltas = [];
  for (let i = 0; i < len; i++) {
    const w = wasmClusters[i];
    const n = nativeClusters[i];
    const shareDelta = Math.abs(w.share - n.share);
    const centroidDelta = Math.sqrt(
      (w.centroidSpace[0] - n.centroidSpace[0]) ** 2 +
        (w.centroidSpace[1] - n.centroidSpace[1]) ** 2 +
        (w.centroidSpace[2] - n.centroidSpace[2]) ** 2
    );
    deltas.push({ shareDelta, centroidDelta });
  }
  return deltas;
}

async function main() {
  const [wasmOut, nativeOut] = await Promise.all([runWasm(), runNative()]);

  console.log('wasm clusters:', wasmOut.clusters.length, 'iterations:', wasmOut.iterations);
  console.log('native clusters:', nativeOut.clusters.length, 'iterations:', nativeOut.iterations);

  if (wasmOut.clusters.length !== nativeOut.clusters.length) {
    throw new Error('cluster length mismatch');
  }
  if (wasmOut.totalSamples !== nativeOut.totalSamples) {
    throw new Error('totalSamples mismatch');
  }

  const deltas = diffClusters(wasmOut.clusters, nativeOut.clusters);
  const maxShare = Math.max(...deltas.map((d) => d.shareDelta));
  const maxCentroid = Math.max(...deltas.map((d) => d.centroidDelta));

  console.log('max share delta:', maxShare.toExponential(4));
  console.log('max centroid delta:', maxCentroid.toFixed(6));

  const shareTolerance = 1e-6;
  const centroidTolerance = 1e-4;
  if (maxShare > shareTolerance) {
    throw new Error(`share delta ${maxShare} exceeds tolerance ${shareTolerance}`);
  }
  if (maxCentroid > centroidTolerance) {
    throw new Error(`centroid delta ${maxCentroid} exceeds tolerance ${centroidTolerance}`);
  }

  console.log('Parity check passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

