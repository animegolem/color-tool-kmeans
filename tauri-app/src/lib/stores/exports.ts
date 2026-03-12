import { writable } from 'svelte/store';
import { DEFAULTS } from './prefs';

export const exportScale = writable<number>(2);
export const exportDir = writable<string | null>(null);

export type GraphExportFormat = 'png' | 'svg';
export const graphExportFormat = writable<GraphExportFormat>('svg');

export interface ExportChecks {
  colorsSourceImage: boolean;
  colorsPolarChart: boolean;
  colorsHistogram: boolean;
  colorsHueLightness: boolean;
  colorsPaletteStrip: boolean;
  colorsHistogramAll: boolean;
  colorsVideoBarcode: boolean;
  valuesNeutral: boolean;
  valuesIncludeOriginal: boolean;
  valuesRangeFinder: boolean;
  valuesHistogram: boolean;
  valuesSimplified: boolean;
  valuesAllStudies: boolean;
}
export const exportChecks = writable<ExportChecks>({ ...DEFAULTS.exports });

export const clusterMax = writable<number>(200);
export const excludeTopMax = writable<number>(10);
export const showSimplifiedTones = writable<boolean>(true);
export type VideoStripMode = 'filmstrip' | 'barcode';
export const videoStripMode = writable<VideoStripMode>('barcode');
