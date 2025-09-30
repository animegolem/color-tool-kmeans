import path from 'node:path';
import { promises as fs } from 'node:fs';

import { BENCH_IMAGES, DEFAULT_OPTIONS } from './config.mjs';

async function loadVendor() {
  try {
    // Prefer a vendored copy to keep offline.
    const mod = await import('./vendor/kmeans-engine/index.mjs');
    return mod.default ?? mod;
  } catch (e) {
    return null;
  }
}

function toArrayBuffer(view) {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
}

// Minimal LAB conversion aligned to our JS worker; adequate for sanity checks.
function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function rgbToXyz(r, g, b) {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  return {
    X: (R * 0.4124 + G * 0.3576 + B * 0.1805) * 100,
    Y: (R * 0.2126 + G * 0.7152 + B * 0.0722) * 100,
    Z: (R * 0.0193 + G * 0.1192 + B * 0.9505) * 100
  };
}
const WP = { X: 95.047, Y: 100.0, Z: 108.883 };
function pivotLab(t) { return t > 0.008856 ? Math.cbrt(t) : (7.787 * t) + 16 / 116; }
function rgbToLab(r, g, b) {
  const { X, Y, Z } = rgbToXyz(r, g, b);
  const x = pivotLab(X / WP.X);
  const y = pivotLab(Y / WP.Y);
  const z = pivotLab(Z / WP.Z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

function toSpace(space, r, g, b) {
  if (space === 'CIELAB') {
    const [L, a, bb] = rgbToLab(r, g, b);
    return { L_star: L, a_star: a, b_star: bb };
  }
  if (space === 'RGB') return { r, g, b };
  return { r, g, b };
}

const MAX_BASELINE_SAMPLES = 20000;

export async function runObservableBaseline(repoRoot) {
  const kmeans = await loadVendor();
  if (!kmeans) {
    console.warn('[baseline] Skipping Observable baseline: vendor/kmeans-engine not present.');
    return null;
  }
  const outputDir = path.join(repoRoot, DEFAULT_OPTIONS.outputDir);
  const manifestPath = path.join(outputDir, 'samples-manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const results = [];

  for (const job of manifest.jobs) {
    const samplePath = path.join(outputDir, job.sampleFile);
    const buf = await fs.readFile(samplePath);
    // Float32 triples
    const f32 = new Float32Array(toArrayBuffer(buf));
    const totalPts = Math.floor(f32.length / 3);
    const step = Math.max(1, Math.floor(totalPts / MAX_BASELINE_SAMPLES));
    const pts = [];
    for (let i = 0; i < f32.length; i += 3 * step) {
      const r = f32[i], g = f32[i + 1], b = f32[i + 2];
      pts.push(toSpace(job.options.space, r, g, b));
    }

    const clusters = await new Promise((resolve, reject) =>
      kmeans.clusterize(pts, { k: job.options.k }, (err, res) => (err ? reject(err) : resolve(res)))
    );

    results.push({
      label: job.label,
      k: job.options.k,
      space: job.options.space,
      count: pts.length,
      clusters: clusters.map((c, i) => ({ index: i, count: c.vectorIds.length, centroid: c.centroid }))
    });
  }

  const outPath = path.join(outputDir, 'observable-baseline.json');
  await fs.writeFile(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
  return outPath;
}

// Allow running standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
  runObservableBaseline(repoRoot).then(p => {
    if (p) console.log('[baseline] wrote', p);
  }).catch(err => {
    console.error(err);
    process.exitCode = 1;
  });
}
