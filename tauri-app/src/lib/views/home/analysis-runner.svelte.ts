import type { AnalysisParams, SelectedImage, AnalysisResult } from '../../stores/ui';
import { resetAnalysisPending } from '../../stores/ui';
import { TauriComputeError } from '../../bridges/compute';
import { analyzeImage } from '../../compute/bridge';

export interface AnalysisRunnerDeps {
  setAnalysisPending: () => number;
  setAnalysisSuccess: (
    result: AnalysisResult,
    imageId: string | null,
    requestToken?: number
  ) => void;
  setAnalysisError: (message: string, requestToken?: number) => void;
  recordDevEvent: (update: { computeVariant?: string }, type: 'analysis') => void;
}

const ANALYZE_DEBOUNCE_MS = 400;
const SPINNER_THRESHOLD_MS = 150;

export function createAnalysisRunner(deps: AnalysisRunnerDeps) {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let spinnerTimer: ReturnType<typeof setTimeout> | null = null;
  let currentToken = 0;
  let pendingRequest: { token: number; storeToken: number } | null = null;
  let lastRequestKey: string | null = null;
  let spinnerVisible = $state(false);
  let analysisScrollLock: { top: number; token: number | null } | null = null;

  function mapErrorToMessage(error: unknown): string {
    if (error instanceof TauriComputeError) {
      switch (error.code) {
        case 'missing-path':
          return 'Native analysis could not find the original file. Please reselect the image.';
        case 'invalid-response':
          return 'Native analysis returned unexpected data. Review the Tauri console for details.';
        case 'invoke-failed':
          return 'Native analysis failed to start. Restart the app or check the console output.';
        default:
          return 'Native analysis reported an unexpected error.';
      }
    }
    if (error instanceof Error) {
      return error.message || 'Unexpected error. Check console output for details.';
    }
    return 'Unexpected error. Check console output for details.';
  }

  function cancelPending() {
    currentToken += 1;
    if (pendingRequest) {
      resetAnalysisPending(pendingRequest.storeToken);
      pendingRequest = null;
    }
    analysisScrollLock = null;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (spinnerTimer) {
      clearTimeout(spinnerTimer);
      spinnerTimer = null;
    }
    spinnerVisible = false;
  }

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

  function scheduleAnalysisWith(
    fileHandle: SelectedImage,
    paramSnapshot: AnalysisParams,
    status: string
  ) {
    const keyObj = {
      id: fileHandle.id,
      clusters: paramSnapshot.clusters,
      quality: paramSnapshot.quality,
      ignoreTopN: paramSnapshot.ignoreTopN,
      mergeThreshold: paramSnapshot.mergeThreshold,
      snapToReal: paramSnapshot.snapToReal,
      tol: 1e-3,
      maxIter: 40,
      seed: 1,
      maxSamples: 300_000
    };
    const key = JSON.stringify(keyObj);
    if (key === lastRequestKey && status !== 'error') {
      return;
    }
    lastRequestKey = key;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    const snapshot: AnalysisParams = { ...paramSnapshot };
    debounceTimer = setTimeout(() => runAnalysis(fileHandle, snapshot), ANALYZE_DEBOUNCE_MS);
  }

  async function runAnalysis(image: SelectedImage, paramSnapshot: AnalysisParams) {
    currentToken += 1;
    const token = currentToken;
    if (analysisScrollLock) {
      analysisScrollLock.token = token;
    }
    const storeToken = deps.setAnalysisPending();
    pendingRequest = { token, storeToken };
    spinnerVisible = false;
    if (spinnerTimer) {
      clearTimeout(spinnerTimer);
    }
    spinnerTimer = setTimeout(() => {
      if (token === currentToken) {
        spinnerVisible = true;
      }
    }, SPINNER_THRESHOLD_MS);

    try {
      const response = await analyzeImage(image.dataset, {
        ...paramSnapshot,
        tol: 1e-3,
        maxIter: 40,
        seed: 1,
        maxSamples: 300_000
      });
      if (token !== currentToken) {
        return;
      }
      deps.recordDevEvent({ computeVariant: response.variant }, 'analysis');
      deps.setAnalysisSuccess(response, image.id, storeToken);
      restoreAnalysisScroll(token);
    } catch (err) {
      if (token !== currentToken) {
        return;
      }
      deps.recordDevEvent({ computeVariant: 'error' }, 'analysis');
      console.error('[home] analysis failed', err);
      const message = mapErrorToMessage(err);
      deps.setAnalysisError(message, storeToken);
      restoreAnalysisScroll(token);
    } finally {
      if (token === currentToken) {
        if (pendingRequest?.token === token) {
          pendingRequest = null;
        }
        if (spinnerTimer) {
          clearTimeout(spinnerTimer);
          spinnerTimer = null;
        }
        spinnerVisible = false;
      }
    }
  }

  function clearLastRequestKey() {
    lastRequestKey = null;
  }

  function seedLastRequestKey(file: SelectedImage, paramSnapshot: AnalysisParams) {
    lastRequestKey = JSON.stringify({
      id: file.id,
      clusters: paramSnapshot.clusters,
      quality: paramSnapshot.quality,
      ignoreTopN: paramSnapshot.ignoreTopN,
      mergeThreshold: paramSnapshot.mergeThreshold,
      snapToReal: paramSnapshot.snapToReal,
      tol: 1e-3,
      maxIter: 40,
      seed: 1,
      maxSamples: 300_000
    });
  }

  return {
    get spinnerVisible() { return spinnerVisible; },
    scheduleAnalysisWith,
    cancelPending,
    captureAnalysisScroll,
    clearLastRequestKey,
    seedLastRequestKey
  };
}
