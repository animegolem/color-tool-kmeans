import type {
  AnalysisParams,
  AnalysisErrorReceipt,
  SelectedImage,
  AnalysisResult,
  AnalysisSuccessReceipt,
} from '../../stores/ui';
import { resetAnalysisPending } from '../../stores/ui';
import { TauriComputeError } from '../../bridges/compute';
import { analyzeImage } from '../../compute/bridge';
import type {
  ProfileAcceptedResultContext,
  ProfileActionRef,
  ProfileAnalysisContext,
  RendererProfileTrace,
} from '../../profiling/trace';
import { createProfileNativeRequest } from '../../profiling/trace';

export interface AnalysisRunnerDeps {
  setAnalysisPending: () => number;
  setAnalysisSuccess: (
    result: AnalysisResult,
    imageId: string | null,
    requestToken?: number
  ) => AnalysisSuccessReceipt | void;
  setAnalysisError: (
    message: string,
    requestToken?: number
  ) => AnalysisErrorReceipt | void;
  recordDevEvent: (
    update: { computeVariant?: string },
    type: 'analysis'
  ) => void;
  getProfileTrace?: () => RendererProfileTrace | null;
  onProfileAccepted?: (accepted: ProfileAcceptedResultContext) => void;
}

const ANALYZE_DEBOUNCE_MS = 400;
const SPINNER_THRESHOLD_MS = 150;

function observeSafely<T>(callback: () => T, fallback: T): T {
  try {
    return callback();
  } catch {
    return fallback;
  }
}

function analysisRequestKey(
  file: SelectedImage,
  paramSnapshot: AnalysisParams
): string {
  return JSON.stringify({
    id: file.id,
    contentRevision: file.contentRevision,
    clusters: paramSnapshot.clusters,
    quality: paramSnapshot.quality,
    ignoreTopN: paramSnapshot.ignoreTopN,
    mergeThreshold: paramSnapshot.mergeThreshold,
    snapToReal: paramSnapshot.snapToReal,
    tol: 1e-3,
    maxIter: 40,
    seed: 1,
    maxSamples: 300_000,
  });
}

export function createAnalysisRunner(deps: AnalysisRunnerDeps) {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let spinnerTimer: ReturnType<typeof setTimeout> | null = null;
  let currentToken = 0;
  let pendingRequest: { token: number; storeToken: number } | null = null;
  let scheduledProfileAction: ProfileActionRef | null = null;
  let runningProfileAction: ProfileActionRef | null = null;
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
      return (
        error.message || 'Unexpected error. Check console output for details.'
      );
    }
    return 'Unexpected error. Check console output for details.';
  }

  function cancelPending(
    reason: 'source-replaced' | 'view-unmounted' = 'source-replaced'
  ) {
    const trace = observeSafely(() => deps.getProfileTrace?.() ?? null, null);
    observeSafely(
      () => trace?.cancelAction(scheduledProfileAction, reason),
      null
    );
    observeSafely(
      () => trace?.cancelAction(runningProfileAction, reason),
      null
    );
    scheduledProfileAction = null;
    runningProfileAction = null;
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
    status: string,
    profileAction: ProfileActionRef | null = null
  ) {
    const key = analysisRequestKey(fileHandle, paramSnapshot);
    const trace = observeSafely(() => deps.getProfileTrace?.() ?? null, null);
    const scheduleDisposition = profileAction
      ? observeSafely(
          () =>
            trace?.observeSchedule(
              profileAction,
              key,
              key === lastRequestKey && status !== 'error'
            ),
          undefined
        )
      : undefined;
    if (key === lastRequestKey && status !== 'error') {
      return;
    }
    lastRequestKey = key;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      observeSafely(
        () => trace?.cancelAction(scheduledProfileAction, 'debounce-replaced'),
        null
      );
    }
    scheduledProfileAction =
      scheduleDisposition === 'bound' ? profileAction : null;
    const snapshot: AnalysisParams = { ...paramSnapshot };
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      const action = scheduledProfileAction;
      scheduledProfileAction = null;
      void runAnalysis(fileHandle, snapshot, action);
    }, ANALYZE_DEBOUNCE_MS);
  }

  async function runAnalysis(
    image: SelectedImage,
    paramSnapshot: AnalysisParams,
    profileAction: ProfileActionRef | null
  ) {
    const trace = observeSafely(() => deps.getProfileTrace?.() ?? null, null);
    const profileAnalysis = profileAction
      ? observeSafely(
          () =>
            trace?.admitAction(
              profileAction,
              createProfileNativeRequest(paramSnapshot)
            ) ?? null,
          null
        )
      : null;
    runningProfileAction = profileAction;
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
      const response = await analyzeImage(
        image.dataset,
        {
          ...paramSnapshot,
          tol: 1e-3,
          maxIter: 40,
          seed: 1,
          maxSamples: 300_000,
        },
        createProfileObservation(trace, profileAnalysis)
      );
      if (token !== currentToken) {
        observeSafely(
          () => trace?.staleAction(profileAction, 'runner-token-mismatch'),
          null
        );
        return;
      }
      deps.recordDevEvent({ computeVariant: response.variant }, 'analysis');
      const receipt = deps.setAnalysisSuccess(response, image.id, storeToken);
      if (!receipt) {
        observeSafely(
          () =>
            trace?.unverifyAction(
              profileAction,
              'result-association-unverified'
            ),
          null
        );
      } else if (profileAnalysis) {
        const accepted = observeSafely(
          () =>
            trace?.markStoreSuccess(profileAnalysis, response, receipt) ?? null,
          null
        );
        if (accepted)
          observeSafely(() => deps.onProfileAccepted?.(accepted), undefined);
      }
      restoreAnalysisScroll(token);
    } catch (err) {
      if (token !== currentToken) {
        observeSafely(
          () => trace?.staleAction(profileAction, 'runner-token-mismatch'),
          null
        );
        return;
      }
      deps.recordDevEvent({ computeVariant: 'error' }, 'analysis');
      console.error('[home] analysis failed', err);
      const message = mapErrorToMessage(err);
      const receipt = deps.setAnalysisError(message, storeToken);
      if (!receipt) {
        observeSafely(
          () =>
            trace?.unverifyAction(
              profileAction,
              'result-association-unverified'
            ),
          null
        );
      } else if (profileAnalysis) {
        observeSafely(
          () =>
            trace?.markStoreError(
              profileAnalysis,
              receipt,
              err instanceof TauriComputeError &&
                err.code === 'invalid-response'
                ? 'invalid-response'
                : 'native-invoke'
            ),
          undefined
        );
      }
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
        if (runningProfileAction === profileAction) {
          runningProfileAction = null;
        }
      }
    }
  }

  function clearLastRequestKey() {
    lastRequestKey = null;
  }

  function seedLastRequestKey(
    file: SelectedImage,
    paramSnapshot: AnalysisParams
  ) {
    lastRequestKey = analysisRequestKey(file, paramSnapshot);
  }

  return {
    get spinnerVisible() {
      return spinnerVisible;
    },
    scheduleAnalysisWith,
    cancelPending,
    captureAnalysisScroll,
    clearLastRequestKey,
    seedLastRequestKey,
  };
}

function createProfileObservation(
  trace: RendererProfileTrace | null | undefined,
  analysis: ProfileAnalysisContext | null
) {
  if (!trace || !analysis) return undefined;
  const invocation = observeSafely(
    () => trace.nativeInvocationContext(analysis),
    undefined
  );
  if (!invocation) return undefined;
  return {
    profileContext: invocation,
    requestIssued: ({
      actualSourcePath,
      request,
    }: {
      actualSourcePath: string;
      request: {
        k: number;
        quality: number;
        ignoreTopN: number;
        mergeThreshold: number;
        snapToReal: boolean;
        minLum: number;
        tol: number;
        maxIter: number;
        seed: number;
        maxSamples: number;
      };
    }) =>
      observeSafely(
        () =>
          trace.markNativeIssue(analysis, actualSourcePath, {
            clusters: request.k,
            quality: request.quality,
            ignoreTopN: request.ignoreTopN,
            mergeThreshold: request.mergeThreshold,
            snapToReal: request.snapToReal,
            minLum: request.minLum,
            tolerance: request.tol,
            maxIterations: request.maxIter,
            seed: request.seed,
            maxSamples: request.maxSamples,
          }),
        undefined
      ),
    requestSettled: (outcome: 'success' | 'error') =>
      observeSafely(
        () => trace.markNativeSettle(analysis, outcome === 'success'),
        undefined
      ),
    responseParsed: () =>
      observeSafely(() => trace.markResponseParsed(analysis), undefined),
  };
}
