import { analyzeImage } from '../../compute/bridge';
import { TauriComputeError } from '../../bridges/compute';
import type {
  AnalysisParams,
  SelectedImage,
  AnalysisState,
  AnalysisResult
} from '../../stores/ui';
import type { DevBannerDetails } from './dev-banner-types';

const ANALYZE_DEBOUNCE_MS = 200;
const SPINNER_THRESHOLD_MS = 150;

interface AnalysisRunnerDeps {
  getStatus: () => AnalysisState;
  getFile: () => SelectedImage | null;
  getParams: () => AnalysisParams;
  setSpinnerVisible: (visible: boolean) => void;
  onPending: () => void;
  onSuccess: (result: AnalysisResult) => void;
  onError: (message: string) => void;
  clearError: () => void;
  recordDevEvent: (update: Partial<DevBannerDetails>, type: 'analysis') => void;
}

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

export function createAnalysisRunner(deps: AnalysisRunnerDeps) {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let spinnerTimer: ReturnType<typeof setTimeout> | null = null;
  let currentToken = 0;
  let lastRequestKey: string | null = null;

  function clearTimer(timer: ReturnType<typeof setTimeout> | null) {
    if (timer) clearTimeout(timer);
  }

  function cancelPending() {
    currentToken += 1;
    clearTimer(debounceTimer);
    clearTimer(spinnerTimer);
    debounceTimer = null;
    spinnerTimer = null;
    deps.setSpinnerVisible(false);
    lastRequestKey = null;
  }

  function scheduleAnalysisWith(fileHandle: SelectedImage, paramSnapshot: AnalysisParams) {
    const keyObj = {
      id: fileHandle.id,
      clusters: paramSnapshot.clusters,
      stride: paramSnapshot.stride,
      minLum: paramSnapshot.minLum,
      space: paramSnapshot.colorSpace,
      tol: 1e-3,
      maxIter: 40,
      seed: 1,
      maxSamples: 300_000
    };
    const key = JSON.stringify(keyObj);
    if (key === lastRequestKey && deps.getStatus() === 'ready') {
      return;
    }
    lastRequestKey = key;
    clearTimer(debounceTimer);
    const snapshot: AnalysisParams = { ...paramSnapshot };
    debounceTimer = setTimeout(() => runAnalysis(fileHandle, snapshot), ANALYZE_DEBOUNCE_MS);
  }

  async function runAnalysis(image: SelectedImage, paramSnapshot: AnalysisParams) {
    currentToken += 1;
    const token = currentToken;
    deps.onPending();
    deps.setSpinnerVisible(false);
    clearTimer(spinnerTimer);
    spinnerTimer = setTimeout(() => {
      if (token === currentToken && deps.getStatus() === 'pending') {
        deps.setSpinnerVisible(true);
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
      deps.onSuccess(response);
    } catch (err) {
      if (token !== currentToken) {
        return;
      }
      deps.recordDevEvent({ computeVariant: 'error' }, 'analysis');
      console.error('[home] analysis failed', err);
      deps.onError(mapErrorToMessage(err));
    } finally {
      if (token === currentToken) {
        clearTimer(spinnerTimer);
        spinnerTimer = null;
        deps.setSpinnerVisible(false);
      }
    }
  }

  function retryAnalysis() {
    deps.clearError();
    const file = deps.getFile();
    const currentParams = deps.getParams();
    if (file) {
      scheduleAnalysisWith(file, currentParams);
    }
  }

  return {
    scheduleAnalysisWith,
    cancelPending,
    retryAnalysis
  };
}
