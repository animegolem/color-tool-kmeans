export const BENCH_IMAGES = [
  {
    label: '1.5mb example',
    file: '1.5m-example.png',
    k: 300,
    stride: 2,
    minLum: 0,
    space: 'CIELAB',
    maxSamples: 300000,
    seed: 1
  },
  {
    label: '4mb example',
    file: '4mb-example.png',
    k: 300,
    stride: 2,
    minLum: 0,
    space: 'CIELAB',
    maxSamples: 300000,
    seed: 1
  },
  {
    label: '11mb example',
    file: '11mb-example.png',
    k: 300,
    stride: 2,
    minLum: 0,
    space: 'CIELAB',
    maxSamples: 300000,
    seed: 1
  },
  {
    label: '24mb example',
    file: '24mb-example.PNG',
    k: 300,
    stride: 2,
    minLum: 0,
    space: 'CIELAB',
    maxSamples: 300000,
    seed: 1
  }
];

export const DEFAULT_OPTIONS = {
  maxIter: 50,
  tol: 1,
  interactiveMiniBatch: 6000,
  interactiveMaxIters: 1,
  interactiveBudgetMs: 280,
  interactiveMinBatch: 800,
  interactiveShiftTol: 3,
  outputDir: 'bench-reports',
  samplesDir: 'bench-reports/samples'
};
