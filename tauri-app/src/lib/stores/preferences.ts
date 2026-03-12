import { get } from 'svelte/store';
import type { PrefsV1 } from './prefs';
import { savePrefs } from './prefs';
import type { AnalysisParams } from './analysis';
import { params } from './analysis';
import { valueAnalysisLevels } from './value-analysis';
import {
  exportScale, exportDir, exportChecks, clusterMax, excludeTopMax,
  showSimplifiedTones, videoStripMode, graphExportFormat
} from './exports';

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
    hueLightnessSizeMode: prefs.analysis.hueLightnessSizeMode as AnalysisParams['hueLightnessSizeMode'],
    histogramSort: prefs.analysis.histogramSort as AnalysisParams['histogramSort'],
    showHistogram: prefs.display.showHistogram,
    showPolarChart: prefs.display.showPolarChart,
    showHueLightness: prefs.display.showHueLightness
  });
  valueAnalysisLevels.set(prefs.valueAnalysis.levels);
  exportScale.set(prefs.exportScale);
  exportDir.set(prefs.exportDir);
  exportChecks.set({ ...prefs.exports });
  clusterMax.set(prefs.limits.clusterMax);
  excludeTopMax.set(prefs.limits.excludeTopMax);
  showSimplifiedTones.set(prefs.display.showSimplifiedTones);
  videoStripMode.set(prefs.display.videoStripMode ?? 'barcode');
  graphExportFormat.set(prefs.graphExportFormat ?? 'svg');
}

// Write-back: debounced subscriptions that persist store changes
let _debounceParams: ReturnType<typeof setTimeout> | null = null;
let _skipParamsFirst = true;
params.subscribe((val) => {
  if (_skipParamsFirst) { _skipParamsFirst = false; return; }
  if (_debounceParams) clearTimeout(_debounceParams);
  _debounceParams = setTimeout(() => void savePrefs({
    analysis: val,
    display: { showHistogram: val.showHistogram, showPolarChart: val.showPolarChart, showHueLightness: val.showHueLightness, showSimplifiedTones: get(showSimplifiedTones), videoStripMode: get(videoStripMode) }
  }), 500);
});

let _debounceVaLevels: ReturnType<typeof setTimeout> | null = null;
let _skipVaLevelsFirst = true;
valueAnalysisLevels.subscribe((val) => {
  if (_skipVaLevelsFirst) { _skipVaLevelsFirst = false; return; }
  if (_debounceVaLevels) clearTimeout(_debounceVaLevels);
  _debounceVaLevels = setTimeout(() => void savePrefs({ valueAnalysis: { levels: val } }), 500);
});

let _debounceExportScale: ReturnType<typeof setTimeout> | null = null;
let _skipExportScaleFirst = true;
exportScale.subscribe((val) => {
  if (_skipExportScaleFirst) { _skipExportScaleFirst = false; return; }
  if (_debounceExportScale) clearTimeout(_debounceExportScale);
  _debounceExportScale = setTimeout(() => void savePrefs({ exportScale: val }), 500);
});

let _skipExportDirFirst = true;
exportDir.subscribe((val) => {
  if (_skipExportDirFirst) { _skipExportDirFirst = false; return; }
  void savePrefs({ exportDir: val });
});

let _debounceExportChecks: ReturnType<typeof setTimeout> | null = null;
let _skipExportChecksFirst = true;
exportChecks.subscribe((val) => {
  if (_skipExportChecksFirst) { _skipExportChecksFirst = false; return; }
  if (_debounceExportChecks) clearTimeout(_debounceExportChecks);
  _debounceExportChecks = setTimeout(() => void savePrefs({ exports: val }), 500);
});

let _debounceClusterMax: ReturnType<typeof setTimeout> | null = null;
let _skipClusterMaxFirst = true;
clusterMax.subscribe((val) => {
  if (_skipClusterMaxFirst) { _skipClusterMaxFirst = false; return; }
  if (_debounceClusterMax) clearTimeout(_debounceClusterMax);
  _debounceClusterMax = setTimeout(() => void savePrefs({ limits: { clusterMax: val, excludeTopMax: get(excludeTopMax) } }), 500);
});

let _debounceExcludeTopMax: ReturnType<typeof setTimeout> | null = null;
let _skipExcludeTopMaxFirst = true;
excludeTopMax.subscribe((val) => {
  if (_skipExcludeTopMaxFirst) { _skipExcludeTopMaxFirst = false; return; }
  if (_debounceExcludeTopMax) clearTimeout(_debounceExcludeTopMax);
  _debounceExcludeTopMax = setTimeout(() => void savePrefs({ limits: { clusterMax: get(clusterMax), excludeTopMax: val } }), 500);
});

let _skipSimplifiedTonesFirst = true;
showSimplifiedTones.subscribe((val) => {
  if (_skipSimplifiedTonesFirst) { _skipSimplifiedTonesFirst = false; return; }
  void savePrefs({ display: { showHistogram: get(params).showHistogram, showPolarChart: get(params).showPolarChart, showHueLightness: get(params).showHueLightness, showSimplifiedTones: val, videoStripMode: get(videoStripMode) } });
});

let _skipVideoStripModeFirst = true;
videoStripMode.subscribe((val) => {
  if (_skipVideoStripModeFirst) { _skipVideoStripModeFirst = false; return; }
  void savePrefs({ display: { showHistogram: get(params).showHistogram, showPolarChart: get(params).showPolarChart, showHueLightness: get(params).showHueLightness, showSimplifiedTones: get(showSimplifiedTones), videoStripMode: val } });
});

let _debounceGraphExportFormat: ReturnType<typeof setTimeout> | null = null;
let _skipGraphExportFormatFirst = true;
graphExportFormat.subscribe((val) => {
  if (_skipGraphExportFormatFirst) { _skipGraphExportFormatFirst = false; return; }
  if (_debounceGraphExportFormat) clearTimeout(_debounceGraphExportFormat);
  _debounceGraphExportFormat = setTimeout(() => void savePrefs({ graphExportFormat: val }), 500);
});
