import { LazyStore } from '@tauri-apps/plugin-store';

export interface PrefsV1 {
  version: 1;
  analysis: {
    clusters: number;
    quality: number;
    ignoreTopN: number;
    mergeThreshold: number;
    symbolScale: number;
    showClusterOutline: boolean;
    showAxisLabels: boolean;
    snapToReal: boolean;
    polarMode: string;
    hueLightnessSizeMode: string;
    histogramSort: string;
  };
  valueAnalysis: {
    levels: number;
  };
  display: {
    showHistogram: boolean;
    showPolarChart: boolean;
    showHueLightness: boolean;
    showSimplifiedTones: boolean;
    videoStripMode: 'filmstrip' | 'barcode';
    videoFrameLabel: 'timestamp' | 'frame';
    compactSidebars: boolean;
  };
  limits: {
    clusterMax: number;
    excludeTopMax: number;
  };
  batchAnalysis: {
    clusters: number;
    quality: number;
    ignoreTopN: number;
    mergeThreshold: number;
    symbolScale: number;
    showClusterOutline: boolean;
    showAxisLabels: boolean;
    snapToReal: boolean;
    polarMode: string;
    hueLightnessSizeMode: string;
    histogramSort: string;
  };
  exports: {
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
    batchCompositeGrid: boolean;
    batchPolarChart: boolean;
    batchHistogram: boolean;
    batchHistogramAll: boolean;
    batchHueLightness: boolean;
    batchPaletteStrip: boolean;
  };
  exportScale: number;
  exportDir: string | null;
  graphExportFormat: 'png' | 'svg';
}

export const DEFAULTS: PrefsV1 = {
  version: 1,
  analysis: {
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
    histogramSort: 'frequency'
  },
  valueAnalysis: {
    levels: 3
  },
  display: {
    showHistogram: true,
    showPolarChart: true,
    showHueLightness: true,
    showSimplifiedTones: true,
    videoStripMode: 'barcode',
    videoFrameLabel: 'timestamp',
    compactSidebars: false
  },
  limits: {
    clusterMax: 200,
    excludeTopMax: 10
  },
  batchAnalysis: {
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
    histogramSort: 'frequency'
  },
  exports: {
    colorsSourceImage: true,
    colorsPolarChart: true,
    colorsHistogram: true,
    colorsHueLightness: true,
    colorsPaletteStrip: false,
    colorsHistogramAll: false,
    colorsVideoBarcode: false,
    valuesNeutral: true,
    valuesIncludeOriginal: true,
    valuesRangeFinder: true,
    valuesHistogram: true,
    valuesSimplified: true,
    valuesAllStudies: false,
    batchCompositeGrid: true,
    batchPolarChart: true,
    batchHistogram: true,
    batchHistogramAll: false,
    batchHueLightness: true,
    batchPaletteStrip: false
  },
  exportScale: 2,
  exportDir: null,
  graphExportFormat: 'svg'
};

let store: LazyStore | null = null;

function getStore(): LazyStore {
  if (!store) {
    store = new LazyStore('settings.json');
  }
  return store;
}

function deepMerge(defaults: PrefsV1, partial: Record<string, unknown>): PrefsV1 {
  const result = { ...defaults };

  if (partial.analysis && typeof partial.analysis === 'object') {
    const a = partial.analysis as Record<string, unknown>;
    result.analysis = { ...defaults.analysis };
    for (const key of Object.keys(defaults.analysis) as (keyof PrefsV1['analysis'])[]) {
      if (key in a && typeof a[key] === typeof defaults.analysis[key]) {
        (result.analysis as Record<string, unknown>)[key] = a[key];
      }
    }
  }

  if (partial.valueAnalysis && typeof partial.valueAnalysis === 'object') {
    const v = partial.valueAnalysis as Record<string, unknown>;
    result.valueAnalysis = { ...defaults.valueAnalysis };
    if (typeof v.levels === 'number') result.valueAnalysis.levels = v.levels;
  }

  if (partial.display && typeof partial.display === 'object') {
    const d = partial.display as Record<string, unknown>;
    result.display = { ...defaults.display };
    if (typeof d.showHistogram === 'boolean') result.display.showHistogram = d.showHistogram;
    if (typeof d.showPolarChart === 'boolean') result.display.showPolarChart = d.showPolarChart;
    if (typeof d.showHueLightness === 'boolean') result.display.showHueLightness = d.showHueLightness;
    if (typeof d.showSimplifiedTones === 'boolean') result.display.showSimplifiedTones = d.showSimplifiedTones;
    if (d.videoStripMode === 'filmstrip' || d.videoStripMode === 'barcode') result.display.videoStripMode = d.videoStripMode;
    if (d.videoFrameLabel === 'timestamp' || d.videoFrameLabel === 'frame') result.display.videoFrameLabel = d.videoFrameLabel;
    if (typeof d.compactSidebars === 'boolean') result.display.compactSidebars = d.compactSidebars;
  }

  if (partial.limits && typeof partial.limits === 'object') {
    const lim = partial.limits as Record<string, unknown>;
    result.limits = { ...defaults.limits };
    if (typeof lim.clusterMax === 'number') result.limits.clusterMax = lim.clusterMax;
    if (typeof lim.excludeTopMax === 'number') result.limits.excludeTopMax = lim.excludeTopMax;
  }

  if (partial.batchAnalysis && typeof partial.batchAnalysis === 'object') {
    const ba = partial.batchAnalysis as Record<string, unknown>;
    result.batchAnalysis = { ...defaults.batchAnalysis };
    for (const key of Object.keys(defaults.batchAnalysis) as (keyof PrefsV1['batchAnalysis'])[]) {
      if (key in ba && typeof ba[key] === typeof defaults.batchAnalysis[key]) {
        (result.batchAnalysis as Record<string, unknown>)[key] = ba[key];
      }
    }
  }

  if (partial.exports && typeof partial.exports === 'object') {
    const e = partial.exports as Record<string, unknown>;
    result.exports = { ...defaults.exports };
    for (const key of Object.keys(defaults.exports) as (keyof PrefsV1['exports'])[]) {
      if (key in e && typeof e[key] === 'boolean') {
        (result.exports as Record<string, unknown>)[key] = e[key];
      }
    }
  }

  if (typeof partial.exportScale === 'number') {
    result.exportScale = partial.exportScale;
  }

  if (partial.exportDir === null || typeof partial.exportDir === 'string') {
    result.exportDir = partial.exportDir as string | null;
  }

  if (partial.graphExportFormat === 'png' || partial.graphExportFormat === 'svg') {
    result.graphExportFormat = partial.graphExportFormat;
  }

  return result;
}

export async function loadPrefs(): Promise<PrefsV1> {
  try {
    const s = getStore();
    const raw = await s.get<Record<string, unknown>>('prefs');
    if (!raw || typeof raw !== 'object') {
      return { ...DEFAULTS };
    }
    return deepMerge(DEFAULTS, raw);
  } catch (err) {
    console.warn('[prefs] failed to load preferences, using defaults', err);
    return { ...DEFAULTS };
  }
}

export async function savePrefs(partial: Partial<PrefsV1>): Promise<void> {
  try {
    const s = getStore();
    const current = await s.get<Record<string, unknown>>('prefs');
    const base = current && typeof current === 'object' ? deepMerge(DEFAULTS, current) : { ...DEFAULTS };

    if (partial.analysis) base.analysis = { ...base.analysis, ...partial.analysis };
    if (partial.valueAnalysis) base.valueAnalysis = { ...base.valueAnalysis, ...partial.valueAnalysis };
    if (partial.display) base.display = { ...base.display, ...partial.display };
    if (partial.limits) base.limits = { ...base.limits, ...partial.limits };
    if (partial.batchAnalysis) base.batchAnalysis = { ...base.batchAnalysis, ...partial.batchAnalysis };
    if (partial.exports) base.exports = { ...base.exports, ...partial.exports };
    if (partial.exportScale !== undefined) base.exportScale = partial.exportScale;
    if (partial.exportDir !== undefined) base.exportDir = partial.exportDir;
    if (partial.graphExportFormat !== undefined) base.graphExportFormat = partial.graphExportFormat;

    await s.set('prefs', base);
    await s.save();
  } catch (err) {
    console.warn('[prefs] failed to save preferences', err);
  }
}

export async function resetPrefs(): Promise<void> {
  try {
    const s = getStore();
    await s.set('prefs', { ...DEFAULTS });
    await s.save();
  } catch (err) {
    console.warn('[prefs] failed to reset preferences', err);
  }
}
