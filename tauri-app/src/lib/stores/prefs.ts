import { LazyStore } from '@tauri-apps/plugin-store';
import type { View } from './ui';

export interface PrefsV1 {
  version: 1;
  view: View;
  analysis: {
    clusters: number;
    quality: number;
    ignoreTopN: number;
    mergeThreshold: number;
    symbolScale: number;
    showClusterOutline: boolean;
    showAxisLabels: boolean;
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
  };
  limits: {
    clusterMax: number;
    excludeTopMax: number;
  };
  exportScale: number;
  exportDir: string | null;
}

export const DEFAULTS: PrefsV1 = {
  version: 1,
  view: 'home',
  analysis: {
    clusters: 25,
    quality: 2,
    ignoreTopN: 0,
    mergeThreshold: 0.04,
    symbolScale: 1,
    showClusterOutline: false,
    showAxisLabels: true,
    polarMode: 'hsv',
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
    showSimplifiedTones: true
  },
  limits: {
    clusterMax: 2000,
    excludeTopMax: 100
  },
  exportScale: 2,
  exportDir: null
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

  if (typeof partial.view === 'string') {
    const valid: View[] = ['home', 'values', 'exports', 'settings'];
    if (valid.includes(partial.view as View)) {
      result.view = partial.view as View;
    }
  }

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
  }

  if (partial.limits && typeof partial.limits === 'object') {
    const lim = partial.limits as Record<string, unknown>;
    result.limits = { ...defaults.limits };
    if (typeof lim.clusterMax === 'number') result.limits.clusterMax = lim.clusterMax;
    if (typeof lim.excludeTopMax === 'number') result.limits.excludeTopMax = lim.excludeTopMax;
  }

  if (typeof partial.exportScale === 'number') {
    result.exportScale = partial.exportScale;
  }

  if (partial.exportDir === null || typeof partial.exportDir === 'string') {
    result.exportDir = partial.exportDir as string | null;
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

    if (partial.view !== undefined) base.view = partial.view;
    if (partial.analysis) base.analysis = { ...base.analysis, ...partial.analysis };
    if (partial.valueAnalysis) base.valueAnalysis = { ...base.valueAnalysis, ...partial.valueAnalysis };
    if (partial.display) base.display = { ...base.display, ...partial.display };
    if (partial.limits) base.limits = { ...base.limits, ...partial.limits };
    if (partial.exportScale !== undefined) base.exportScale = partial.exportScale;
    if (partial.exportDir !== undefined) base.exportDir = partial.exportDir;

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
