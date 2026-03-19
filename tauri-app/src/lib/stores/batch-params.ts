import { writable } from 'svelte/store';

export interface BatchChartParams {
  polarMode: 'oklch' | 'okhsv' | 'hsv';
  histogramSort: 'frequency' | 'hue' | 'lightness';
  hueLightnessSizeMode: 'frequency' | 'chroma';
  symbolScale: number;
  showClusterOutline: boolean;
  showAxisLabels: boolean;
}

export const batchChartParams = writable<BatchChartParams>({
  polarMode: 'oklch',
  histogramSort: 'frequency',
  hueLightnessSizeMode: 'chroma',
  symbolScale: 1,
  showClusterOutline: true,
  showAxisLabels: true
});
