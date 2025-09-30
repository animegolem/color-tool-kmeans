#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

const ROOT = resolve(new URL('.', import.meta.url).pathname, '..', '..');
const REPORT_DIR = join(ROOT, 'bench-reports');
const WARM_UP_ITERATIONS = 1;

async function loadJson(path) {
  const buffer = await readFile(path, 'utf8');
  return JSON.parse(buffer);
}

async function main() {
  const nativeResults = await loadJson(join(REPORT_DIR, 'rust-results.json'));
  const samplesManifest = await loadJson(join(REPORT_DIR, 'samples-manifest.json'));

  const wasmModule = await import(resolve(ROOT, 'compute-wasm/pkg-node/compute_wasm.js'));
  const analyzeImage = wasmModule.default?.analyze_image ?? wasmModule.analyze_image;
  if (!analyzeImage) {
    throw new Error('compute-wasm module did not expose analyze_image');
  }

  const comparisons = [];

  for (const job of nativeResults.jobs ?? []) {
    const sampleInfo = samplesManifest.jobs.find((entry) => entry.label === job.label);
    if (!sampleInfo) {
      console.warn(`[wasm-bench] No sample info for ${job.label}, skipping.`);
      continue;
    }
    const sampleBuffer = await readFile(resolve(ROOT, 'bench-reports', sampleInfo.sampleFile));
    const sampleFloat = new Float32Array(sampleBuffer.buffer, sampleBuffer.byteOffset, sampleBuffer.byteLength / Float32Array.BYTES_PER_ELEMENT);
    const pixels = float32DatasetToRgb(sampleFloat);

    // Warm-up run (not measured)
    for (let i = 0; i < WARM_UP_ITERATIONS; i++) {
      await analyzeImage(pixels, buildParams(sampleInfo));
    }

    const start = performance.now();
    const wasmResult = await analyzeImage(pixels, buildParams(sampleInfo));
    const durationMs = performance.now() - start;

    comparisons.push({
      label: job.label,
      nativeMs: job.rustMetrics.durationMs,
      wasmMs: durationMs,
      nativeIterations: job.rustMetrics.iterations,
      wasmIterations: wasmResult.iterations,
      nativeTotalSamples: job.rustMetrics.totalSamples,
      wasmTotalSamples: wasmResult.totalSamples
    });
  }

  await mkdir(REPORT_DIR, { recursive: true });
  await writeFile(join(REPORT_DIR, 'wasm-bench.json'), JSON.stringify({ generatedAt: new Date().toISOString(), comparisons }, null, 2), 'utf8');

  console.log('Wasm bench results saved to bench-reports/wasm-bench.json');
  for (const entry of comparisons) {
    const delta = entry.wasmMs - entry.nativeMs;
    console.log(`- ${entry.label}: wasm ${entry.wasmMs.toFixed(2)}ms vs native ${entry.nativeMs.toFixed(2)}ms (Δ ${delta.toFixed(2)}ms)`);
  }
}

function buildParams(sampleInfo) {
  const opts = sampleInfo.options ?? {};
  return {
    width: sampleInfo.sampleCount,
    height: 1,
    stride: 1,
    minLum: opts.minLum ?? 0,
    maxSamples: opts.maxSamples ?? sampleInfo.sampleCount,
    k: opts.k ?? 16,
    space: opts.space ?? 'CIELAB',
    tol: opts.tol ?? 1e-3,
    maxIter: opts.maxIter ?? 40,
    seed: opts.seed ?? 1
  };
}

function float32DatasetToRgb(floatDataset) {
  const result = new Uint8Array(floatDataset.length);
  for (let i = 0; i < floatDataset.length; i++) {
    const value = Math.round(floatDataset[i]);
    result[i] = Math.max(0, Math.min(255, value));
  }
  return result;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
