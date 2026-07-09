import { get } from 'svelte/store';
import { tauriInvoke } from '../../bridges/tauri';
import { TauriComputeError, parseTauriResponse } from '../../bridges/compute';
import { composeGrid } from '../../bridges/compose';
import {
  multiAnalysisState,
  multiAnalysisResult,
  multiAnalysisError,
  multiCompositePath,
  resetMultiAnalysis,
} from '../../stores/multi-analysis';
import type { AnalysisParams, AnalysisResult } from '../../stores/analysis';
import { logEvent } from '../../bridges/log';

const ANALYZE_DEBOUNCE_MS = 400;
const SPINNER_THRESHOLD_MS = 150;
const DEFAULT_TOLERANCE = 1e-3;
const DEFAULT_MAX_ITER = 40;
const DEFAULT_MAX_SAMPLES = 300_000;
const DEFAULT_SEED = 1;

function mapErrorToMessage(error: unknown): string {
  if (error instanceof TauriComputeError) {
    switch (error.code) {
      case 'missing-path':
        return 'Composite image path was not found. Please re-pin images and try again.';
      case 'invalid-response':
        return 'Batch analysis returned unexpected data. Review the Tauri console for details.';
      case 'invoke-failed':
        return 'Batch analysis failed to start. Restart the app or check the console output.';
      default:
        return 'Batch analysis reported an unexpected error.';
    }
  }
  if (error instanceof Error) {
    return error.message || 'Unexpected error during batch analysis.';
  }
  return 'Unexpected error during batch analysis.';
}

export function createBatchRunner() {
  let currentToken = 0;
  let spinnerTimer: ReturnType<typeof setTimeout> | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastRequestKey = '';
  let spinnerVisible = $state(false);
  let analysisScrollLock: { top: number; token: number | null } | null = null;

  function captureAnalysisScroll() {
    if (typeof document === 'undefined') return;
    const el = document.querySelector('.view-container');
    if (el instanceof HTMLElement) {
      analysisScrollLock = { top: el.scrollTop, token: null };
    }
  }

  function restoreAnalysisScroll(token: number) {
    if (!analysisScrollLock || analysisScrollLock.token !== token) return;
    if (typeof document === 'undefined') return;
    const targetTop = analysisScrollLock.top;
    analysisScrollLock = null;
    Promise.resolve().then(() => {
      requestAnimationFrame(() => {
        const el = document.querySelector('.view-container');
        if (el instanceof HTMLElement) {
          el.scrollTop = targetTop;
        }
      });
    });
  }

  function clearSpinner() {
    if (spinnerTimer) {
      clearTimeout(spinnerTimer);
      spinnerTimer = null;
    }
    spinnerVisible = false;
  }

  function clearDebounce() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }

  function cancel() {
    currentToken += 1;
    analysisScrollLock = null;
    clearSpinner();
    clearDebounce();
    const state = get(multiAnalysisState);
    if (state === 'compositing' || state === 'analyzing') {
      multiAnalysisState.set('idle');
    }
  }

  function reset() {
    cancel();
    lastRequestKey = '';
    resetMultiAnalysis();
  }

  function buildRequestKey(paths: string[], params: AnalysisParams): string {
    return JSON.stringify({
      paths,
      clusters: params.clusters,
      quality: params.quality,
      ignoreTopN: params.ignoreTopN,
      mergeThreshold: params.mergeThreshold,
      snapToReal: params.snapToReal,
    });
  }

  function seedRequestKey(paths: string[], params: AnalysisParams): void {
    lastRequestKey = buildRequestKey(paths, params);
  }

  function scheduleReanalysis(paths: string[], params: AnalysisParams): void {
    const key = buildRequestKey(paths, params);
    if (key === lastRequestKey) return;
    lastRequestKey = key;
    clearDebounce();
    const snapshot = { ...params };
    debounceTimer = setTimeout(() => {
      void reanalyze(snapshot);
    }, ANALYZE_DEBOUNCE_MS);
  }

  async function reanalyze(params: AnalysisParams): Promise<void> {
    const compositePath = get(multiCompositePath);
    if (!compositePath) return;

    currentToken += 1;
    const token = currentToken;
    if (analysisScrollLock) {
      analysisScrollLock.token = token;
    }

    void logEvent(`batch:reanalysis:start clusters=${params.clusters}`);
    multiAnalysisState.set('analyzing');
    multiAnalysisError.set(null);

    spinnerVisible = false;
    clearSpinner();
    spinnerTimer = setTimeout(() => {
      if (token === currentToken) spinnerVisible = true;
    }, SPINNER_THRESHOLD_MS);

    const req = {
      path: compositePath,
      k: params.clusters,
      quality: params.quality ?? 2,
      ignoreTopN: params.ignoreTopN ?? 0,
      mergeThreshold: params.mergeThreshold ?? 0,
      snapToReal: params.snapToReal ?? false,
      minLum: 0,
      tol: DEFAULT_TOLERANCE,
      maxIter: DEFAULT_MAX_ITER,
      seed: DEFAULT_SEED,
      maxSamples: DEFAULT_MAX_SAMPLES,
    };

    try {
      const rawResponse = await tauriInvoke('analyze_image', { req });
      if (token !== currentToken) return;

      const parsed = parseTauriResponse(rawResponse);
      const clusters = parsed.clusters.map((cluster) => ({
        count: cluster.count,
        share: cluster.share,
        centroidSpace: cluster.centroidSpace,
        oklab: cluster.oklab,
        oklch: cluster.oklch,
        rgb: cluster.rgb,
        hsv: cluster.hsv,
      })) as AnalysisResult['clusters'];

      multiAnalysisResult.set({
        clusters,
        iterations: parsed.iterations,
        durationMs: parsed.durationMs,
        totalSamples: parsed.totalSamples,
        variant: String(parsed.variant ?? 'tauri-native'),
      });
      multiAnalysisState.set('ready');
      restoreAnalysisScroll(token);
      void logEvent(
        `batch:reanalysis:success ms=${Math.round(parsed.durationMs)} iterations=${parsed.iterations} samples=${parsed.totalSamples}`
      );
    } catch (err) {
      if (token !== currentToken) return;
      console.error('[batch] reanalysis failed', err);
      void logEvent('batch:reanalysis:error');
      multiAnalysisError.set(mapErrorToMessage(err));
      multiAnalysisState.set('error');
      restoreAnalysisScroll(token);
    } finally {
      if (token === currentToken) clearSpinner();
    }
  }

  async function analyze(
    paths: string[],
    params: AnalysisParams
  ): Promise<void> {
    currentToken += 1;
    const token = currentToken;

    void logEvent(`batch:compositing:start images=${paths.length}`);
    multiAnalysisState.set('compositing');
    multiAnalysisError.set(null);
    multiAnalysisResult.set(null);
    multiCompositePath.set(null);

    spinnerVisible = false;
    clearSpinner();
    spinnerTimer = setTimeout(() => {
      if (token === currentToken) {
        spinnerVisible = true;
      }
    }, SPINNER_THRESHOLD_MS);

    let compositePath: string;
    try {
      const result = await composeGrid(paths);
      if (token !== currentToken) return;
      compositePath = result.path;
      multiCompositePath.set(compositePath);
      void logEvent(
        `batch:compositing:done grid=${result.width}x${result.height}`
      );
    } catch (err) {
      if (token !== currentToken) return;
      console.error('[batch] compositing failed', err);
      void logEvent('batch:compositing:error');
      const message =
        err instanceof Error ? err.message : 'Failed to compose grid image.';
      multiAnalysisError.set(message);
      multiAnalysisState.set('error');
      clearSpinner();
      return;
    }

    multiAnalysisState.set('analyzing');
    if (token !== currentToken) return;

    const req = {
      path: compositePath,
      k: params.clusters,
      quality: params.quality ?? 2,
      ignoreTopN: params.ignoreTopN ?? 0,
      mergeThreshold: params.mergeThreshold ?? 0,
      snapToReal: params.snapToReal ?? false,
      minLum: 0,
      tol: DEFAULT_TOLERANCE,
      maxIter: DEFAULT_MAX_ITER,
      seed: DEFAULT_SEED,
      maxSamples: DEFAULT_MAX_SAMPLES,
    };

    try {
      const rawResponse = await tauriInvoke('analyze_image', { req });
      if (token !== currentToken) return;

      const parsed = parseTauriResponse(rawResponse);
      const clusters = parsed.clusters.map((cluster) => ({
        count: cluster.count,
        share: cluster.share,
        centroidSpace: cluster.centroidSpace,
        oklab: cluster.oklab,
        oklch: cluster.oklch,
        rgb: cluster.rgb,
        hsv: cluster.hsv,
      })) as AnalysisResult['clusters'];

      const analysisResult: AnalysisResult = {
        clusters,
        iterations: parsed.iterations,
        durationMs: parsed.durationMs,
        totalSamples: parsed.totalSamples,
        variant: String(parsed.variant ?? 'tauri-native'),
      };

      multiAnalysisResult.set(analysisResult);
      multiAnalysisState.set('ready');
      lastRequestKey = buildRequestKey(paths, params);
      void logEvent(
        `batch:analysis:success ms=${Math.round(analysisResult.durationMs)} iterations=${analysisResult.iterations} samples=${analysisResult.totalSamples}`
      );
    } catch (err) {
      if (token !== currentToken) return;
      console.error('[batch] analysis failed', err);
      void logEvent('batch:analysis:error');
      multiAnalysisError.set(mapErrorToMessage(err));
      multiAnalysisState.set('error');
    } finally {
      if (token === currentToken) {
        clearSpinner();
      }
    }
  }

  return {
    get spinnerVisible() {
      return spinnerVisible;
    },
    analyze,
    scheduleReanalysis,
    seedRequestKey,
    captureAnalysisScroll,
    cancel,
    reset,
  };
}
