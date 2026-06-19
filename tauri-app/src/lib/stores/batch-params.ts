import { writable } from 'svelte/store';
import type { AnalysisParams } from './analysis';

export const batchParams = writable<AnalysisParams>({
  clusters: 45,
  quality: 2,
  ignoreTopN: 0,
  mergeThreshold: 0,
  symbolScale: 1,
  showClusterOutline: false,
  showAxisLabels: true,
  snapToReal: true,
  polarMode: 'okhsv',
  hueLightnessSizeMode: 'chroma',
  histogramSort: 'frequency',
  showHistogram: true,
  showPolarChart: true,
  showHueLightness: true
});
