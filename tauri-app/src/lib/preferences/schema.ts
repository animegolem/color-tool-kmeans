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

export const DEFAULT_PREFS: PrefsV1 = {
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
    histogramSort: 'frequency',
  },
  valueAnalysis: { levels: 3 },
  display: {
    showHistogram: true,
    showPolarChart: true,
    showHueLightness: true,
    showSimplifiedTones: true,
    videoStripMode: 'barcode',
    videoFrameLabel: 'timestamp',
    compactSidebars: false,
  },
  limits: { clusterMax: 200, excludeTopMax: 10 },
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
    histogramSort: 'frequency',
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
    batchPaletteStrip: false,
  },
  exportScale: 2,
  exportDir: null,
  graphExportFormat: 'svg',
};

export class PrefsSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrefsSchemaError';
  }
}

export function clonePrefsV1(prefs: PrefsV1): PrefsV1 {
  return {
    ...prefs,
    analysis: { ...prefs.analysis },
    valueAnalysis: { ...prefs.valueAnalysis },
    display: { ...prefs.display },
    limits: { ...prefs.limits },
    batchAnalysis: { ...prefs.batchAnalysis },
    exports: { ...prefs.exports },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeMatchingFields<T extends Record<string, unknown>>(
  target: T,
  source: Record<string, unknown>
) {
  for (const key of Object.keys(target) as (keyof T)[]) {
    if (!(key in source)) continue;
    if (typeof source[key as string] !== typeof target[key]) {
      throw new PrefsSchemaError(`Invalid preference field: ${String(key)}.`);
    }
    target[key] = source[key as string] as T[keyof T];
  }
}

function section(
  raw: Record<string, unknown>,
  key: string
): Record<string, unknown> | null {
  if (!(key in raw)) return null;
  const value = raw[key];
  if (!isRecord(value)) {
    throw new PrefsSchemaError(`Invalid preference section: ${key}.`);
  }
  return value;
}

export function mergePrefsV1(raw: unknown): PrefsV1 {
  if (!isRecord(raw)) {
    throw new PrefsSchemaError('Preferences must be an object.');
  }
  if ('version' in raw && raw.version !== undefined && raw.version !== 1) {
    throw new PrefsSchemaError('Unsupported preferences version.');
  }

  const result = clonePrefsV1(DEFAULT_PREFS);
  const analysis = section(raw, 'analysis');
  const valueAnalysis = section(raw, 'valueAnalysis');
  const display = section(raw, 'display');
  const limits = section(raw, 'limits');
  const batchAnalysis = section(raw, 'batchAnalysis');
  const exports = section(raw, 'exports');
  if (analysis) mergeMatchingFields(result.analysis, analysis);
  if (valueAnalysis) mergeMatchingFields(result.valueAnalysis, valueAnalysis);
  if (display) mergeMatchingFields(result.display, display);
  if (limits) mergeMatchingFields(result.limits, limits);
  if (batchAnalysis) mergeMatchingFields(result.batchAnalysis, batchAnalysis);
  if (exports) mergeMatchingFields(result.exports, exports);

  if (
    !['filmstrip', 'barcode'].includes(result.display.videoStripMode) ||
    !['timestamp', 'frame'].includes(result.display.videoFrameLabel)
  ) {
    throw new PrefsSchemaError('Invalid display preference value.');
  }

  if ('exportScale' in raw && typeof raw.exportScale !== 'number') {
    throw new PrefsSchemaError('Invalid preference field: exportScale.');
  }
  if (typeof raw.exportScale === 'number') result.exportScale = raw.exportScale;
  const exportDir = raw.exportDir;
  if (
    'exportDir' in raw &&
    exportDir !== null &&
    typeof exportDir !== 'string'
  ) {
    throw new PrefsSchemaError('Invalid preference field: exportDir.');
  }
  if (exportDir === null || typeof exportDir === 'string') {
    result.exportDir = exportDir as string | null;
  }
  if (
    'graphExportFormat' in raw &&
    raw.graphExportFormat !== 'png' &&
    raw.graphExportFormat !== 'svg'
  ) {
    throw new PrefsSchemaError('Invalid preference field: graphExportFormat.');
  }
  if (raw.graphExportFormat === 'png' || raw.graphExportFormat === 'svg') {
    result.graphExportFormat = raw.graphExportFormat;
  }
  return result;
}

export function mergePrefsPatch(
  current: PrefsV1,
  patch: Partial<PrefsV1>
): PrefsV1 {
  const combined: Record<string, unknown> = {
    ...clonePrefsV1(current),
    ...patch,
    version: 1,
  };
  const nestedKeys = [
    'analysis',
    'valueAnalysis',
    'display',
    'limits',
    'batchAnalysis',
    'exports',
  ] as const;
  for (const key of nestedKeys) {
    const value = patch[key];
    if (isRecord(value)) {
      combined[key] = { ...current[key], ...value };
    }
  }
  return mergePrefsV1(combined);
}

export function prefsEqual(left: PrefsV1, right: PrefsV1): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
