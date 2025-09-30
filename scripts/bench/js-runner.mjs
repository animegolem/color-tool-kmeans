import { performance } from 'node:perf_hooks';
import path from 'node:path';
import { promises as fs } from 'node:fs';

import { computePaletteFromImageData } from '../../electron-app/src/renderer/pipeline.js';
import { buildDatasetFromRgbBuffer } from '../../electron-app/src/worker/kmeans.js';
import { decodePng } from './png.mjs';
import { BENCH_IMAGES, DEFAULT_OPTIONS } from './config.mjs';

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function toArrayBuffer(view) {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
}

function serializeCluster(cluster) {
  const centroidSpace = Array.from(cluster.centroidSpace ?? []);
  const hsv = Array.from(cluster.hsv ?? []);
  return {
    count: cluster.count,
    share: cluster.share,
    centroidSpace,
    rgb: {
      r: Number(cluster.rgb?.r ?? 0),
      g: Number(cluster.rgb?.g ?? 0),
      b: Number(cluster.rgb?.b ?? 0)
    },
    hsv
  };
}

export async function runJsBench(rootDir) {
  const assetsDir = path.join(rootDir, 'bench-assets');
  const outputDir = path.join(rootDir, DEFAULT_OPTIONS.outputDir);
  const samplesDir = path.join(rootDir, DEFAULT_OPTIONS.samplesDir);
  await ensureDir(samplesDir);

  const results = [];

  for (const imageConfig of BENCH_IMAGES) {
    const imagePath = path.join(assetsDir, imageConfig.file);
    const imageData = await decodePng(imagePath);

    const options = {
      stride: imageConfig.stride,
      minLum: imageConfig.minLum,
      space: imageConfig.space,
      k: imageConfig.k,
      maxSamples: imageConfig.maxSamples,
      seed: imageConfig.seed,
      maxIter: imageConfig.maxIter ?? DEFAULT_OPTIONS.maxIter,
      tol: imageConfig.tol ?? DEFAULT_OPTIONS.tol,
      interactiveMiniBatch: imageConfig.interactiveMiniBatch ?? DEFAULT_OPTIONS.interactiveMiniBatch,
      interactiveMaxIters: imageConfig.interactiveMaxIters ?? DEFAULT_OPTIONS.interactiveMaxIters,
      interactiveBudgetMs: imageConfig.interactiveBudgetMs ?? DEFAULT_OPTIONS.interactiveBudgetMs,
      interactiveMinBatch: imageConfig.interactiveMinBatch ?? DEFAULT_OPTIONS.interactiveMinBatch,
      interactiveShiftTol: imageConfig.interactiveShiftTol ?? DEFAULT_OPTIONS.interactiveShiftTol
    };

    const jsStart = performance.now();
    const jsResult = computePaletteFromImageData(imageData, options);
    const jsDurationMeasured = performance.now() - jsStart;

    const jsClusters = (jsResult.clusters ?? []).map(serializeCluster);

    const rgbaBuffer = toArrayBuffer(imageData.data);
    const dataset = buildDatasetFromRgbBuffer(
      rgbaBuffer,
      options.stride,
      options.minLum,
      options.maxSamples,
      options.seed
    );
    const sampleCount = dataset.length / 3;

    const sampleFileName = `${path.parse(imageConfig.file).name}.rgb32`;
    const samplePath = path.join(samplesDir, sampleFileName);
    await fs.writeFile(samplePath, Buffer.from(dataset.buffer));

    results.push({
      imagePath,
      relativeImage: imageConfig.file,
      width: imageData.width,
      height: imageData.height,
      options,
      metrics: {
        jsDurationReportedMs: jsResult.durationMs,
        jsDurationMeasuredMs: jsDurationMeasured,
        jsIterations: jsResult.iterations,
        totalSamples: jsResult.totalSamples,
        clusterCount: jsClusters.length
      },
      clusters: jsClusters,
      samplePath,
      sampleFileName,
      sampleCount
    });
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    samplesDir: DEFAULT_OPTIONS.samplesDir,
    jobs: results.map(result => ({
      label: BENCH_IMAGES.find(img => img.file === result.relativeImage)?.label ?? result.relativeImage,
      imageFile: result.relativeImage,
      sampleFile: path.relative(outputDir, result.samplePath),
      sampleCount: result.sampleCount,
      width: result.width,
      height: result.height,
      options: result.options,
      jsMetrics: result.metrics,
      jsClusters: result.clusters
    }))
  };

  await ensureDir(outputDir);
  await fs.writeFile(
    path.join(outputDir, 'js-results.json'),
    JSON.stringify({ generatedAt: manifest.generatedAt, results }, null, 2)
  );
  await fs.writeFile(
    path.join(outputDir, 'samples-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  return { results, manifestPath: path.join(outputDir, 'samples-manifest.json') };
}
