import { get } from 'svelte/store';
import type { Readable } from 'svelte/store';
import type { PrefsV1 } from './prefs';
import { savePrefs } from './prefs';
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

export function hydrateFromPrefs(prefs: PrefsV1) {
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
}

// --- Write-back helpers ---

function persistStore<T>(
  store: Readable<T>,
  toPayload: (val: T) => Partial<PrefsV1>,
  delay = 0
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let skipFirst = true;
  store.subscribe((val) => {
    if (skipFirst) {
      skipFirst = false;
      return;
    }
    if (timer) clearTimeout(timer);
    if (delay > 0) {
      timer = setTimeout(() => void savePrefs(toPayload(val)), delay);
    } else {
      void savePrefs(toPayload(val));
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
