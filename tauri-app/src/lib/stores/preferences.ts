import { get, writable } from 'svelte/store';
import type { Readable } from 'svelte/store';
import type { PrefsV1 } from './prefs';
import { DEFAULTS, loadPrefs, resetPrefs, savePrefs } from './prefs';
import type { PreferenceOperation } from '../bridges/preferences';
import type { AnalysisParams } from './analysis';
import { params } from './analysis';
import { batchParams } from './batch-params';
import { valueAnalysisLevels } from './value-analysis';
import {
  exportScale,
  exportDir,
  exportChecks,
  clusterMax,
  excludeTopMax,
  showSimplifiedTones,
  videoStripMode,
  videoFrameLabel,
  graphExportFormat,
} from './exports';
import { compactSidebars } from './navigation';

export interface PreferencePersistenceWarning {
  operation: PreferenceOperation;
  message: string;
}

export const preferencePersistenceWarning =
  writable<PreferencePersistenceWarning | null>(null);

let hydratingPreferences = false;

function warningMessage(operation: PreferenceOperation): string {
  if (operation === 'load') {
    return 'Preferences could not be loaded. Defaults are in use; the stored value was not overwritten.';
  }
  if (operation === 'reset') {
    return 'Preferences could not be reset. Your current settings are still in use.';
  }
  return 'Preferences could not be saved. Your current settings remain usable but may not survive a reload.';
}

export function reportPreferenceFailure(
  operation: PreferenceOperation,
  error: unknown
) {
  console.warn(`[prefs] ${operation} failed`, error);
  preferencePersistenceWarning.set({
    operation,
    message: warningMessage(operation),
  });
}

export function clearPreferenceWarning(operation: PreferenceOperation) {
  if (get(preferencePersistenceWarning)?.operation === operation) {
    preferencePersistenceWarning.set(null);
  }
}

export function dismissPreferenceWarning() {
  preferencePersistenceWarning.set(null);
}

export function hydrateFromPrefs(prefs: PrefsV1) {
  hydratingPreferences = true;
  try {
    params.set({
      clusters: prefs.analysis.clusters,
      quality: prefs.analysis.quality,
      ignoreTopN: prefs.analysis.ignoreTopN,
      mergeThreshold: prefs.analysis.mergeThreshold,
      symbolScale: prefs.analysis.symbolScale,
      showClusterOutline: prefs.analysis.showClusterOutline,
      showAxisLabels: prefs.analysis.showAxisLabels,
      snapToReal: prefs.analysis.snapToReal,
      polarMode: prefs.analysis.polarMode as AnalysisParams['polarMode'],
      hueLightnessSizeMode: prefs.analysis
        .hueLightnessSizeMode as AnalysisParams['hueLightnessSizeMode'],
      histogramSort: prefs.analysis
        .histogramSort as AnalysisParams['histogramSort'],
      showHistogram: prefs.display.showHistogram,
      showPolarChart: prefs.display.showPolarChart,
      showHueLightness: prefs.display.showHueLightness,
    });
    batchParams.set({
      clusters: prefs.batchAnalysis.clusters,
      quality: prefs.batchAnalysis.quality,
      ignoreTopN: prefs.batchAnalysis.ignoreTopN,
      mergeThreshold: prefs.batchAnalysis.mergeThreshold,
      symbolScale: prefs.batchAnalysis.symbolScale,
      showClusterOutline: prefs.batchAnalysis.showClusterOutline,
      showAxisLabels: prefs.batchAnalysis.showAxisLabels,
      snapToReal: prefs.batchAnalysis.snapToReal,
      polarMode: prefs.batchAnalysis.polarMode as AnalysisParams['polarMode'],
      hueLightnessSizeMode: prefs.batchAnalysis
        .hueLightnessSizeMode as AnalysisParams['hueLightnessSizeMode'],
      histogramSort: prefs.batchAnalysis
        .histogramSort as AnalysisParams['histogramSort'],
      showHistogram: true,
      showPolarChart: true,
      showHueLightness: true,
    });
    valueAnalysisLevels.set(prefs.valueAnalysis.levels);
    exportScale.set(prefs.exportScale);
    exportDir.set(prefs.exportDir);
    exportChecks.set({ ...prefs.exports });
    clusterMax.set(prefs.limits.clusterMax);
    excludeTopMax.set(prefs.limits.excludeTopMax);
    showSimplifiedTones.set(prefs.display.showSimplifiedTones);
    videoStripMode.set(prefs.display.videoStripMode ?? 'barcode');
    videoFrameLabel.set(prefs.display.videoFrameLabel ?? 'timestamp');
    graphExportFormat.set(prefs.graphExportFormat ?? 'svg');
    compactSidebars.set(prefs.display.compactSidebars ?? false);
  } finally {
    hydratingPreferences = false;
  }
}

export async function loadAndHydratePreferences(): Promise<void> {
  try {
    hydrateFromPrefs(await loadPrefs());
    clearPreferenceWarning('load');
  } catch (error) {
    hydrateFromPrefs(DEFAULTS);
    reportPreferenceFailure('load', error);
  }
}

export async function resetAndHydratePreferences(): Promise<boolean> {
  try {
    await resetPrefs();
    hydrateFromPrefs(DEFAULTS);
    clearPreferenceWarning('reset');
    return true;
  } catch (error) {
    reportPreferenceFailure('reset', error);
    return false;
  }
}

// --- Write-back helpers ---

export function persistStore<T>(
  store: Readable<T>,
  toPayload: (val: T) => Partial<PrefsV1>,
  delay = 0,
  persistValue: (partial: Partial<PrefsV1>) => Promise<void> = savePrefs
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let skipFirst = true;
  return store.subscribe((val) => {
    if (skipFirst) {
      skipFirst = false;
      return;
    }
    if (hydratingPreferences) return;
    if (timer) clearTimeout(timer);
    const runPersist = () => {
      void persistValue(toPayload(val))
        .then(() => clearPreferenceWarning('save'))
        .catch((error) => reportPreferenceFailure('save', error));
    };
    if (delay > 0) {
      timer = setTimeout(runPersist, delay);
    } else {
      runPersist();
    }
  });
}

function displayPayload(
  overrides: Partial<PrefsV1['display']> = {}
): Pick<PrefsV1, 'display'> {
  const p = get(params);
  return {
    display: {
      showHistogram: p.showHistogram,
      showPolarChart: p.showPolarChart,
      showHueLightness: p.showHueLightness,
      showSimplifiedTones: get(showSimplifiedTones),
      videoStripMode: get(videoStripMode),
      videoFrameLabel: get(videoFrameLabel),
      compactSidebars: get(compactSidebars),
      ...overrides,
    },
  };
}

// Debounced subscriptions
persistStore(params, (val) => ({ analysis: val, ...displayPayload() }), 500);
persistStore(batchParams, (val) => ({ batchAnalysis: val }), 500);
persistStore(
  valueAnalysisLevels,
  (val) => ({ valueAnalysis: { levels: val } }),
  500
);
persistStore(exportScale, (val) => ({ exportScale: val }), 500);
persistStore(exportChecks, (val) => ({ exports: val }), 500);
persistStore(
  clusterMax,
  (val) => ({ limits: { clusterMax: val, excludeTopMax: get(excludeTopMax) } }),
  500
);
persistStore(
  excludeTopMax,
  (val) => ({ limits: { clusterMax: get(clusterMax), excludeTopMax: val } }),
  500
);
persistStore(graphExportFormat, (val) => ({ graphExportFormat: val }), 500);

// Immediate subscriptions
persistStore(exportDir, (val) => ({ exportDir: val }));
persistStore(showSimplifiedTones, (val) =>
  displayPayload({ showSimplifiedTones: val })
);
persistStore(videoStripMode, (val) => displayPayload({ videoStripMode: val }));
persistStore(videoFrameLabel, (val) =>
  displayPayload({ videoFrameLabel: val })
);
persistStore(compactSidebars, (val) =>
  displayPayload({ compactSidebars: val })
);
