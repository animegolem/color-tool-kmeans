import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  analyzeImage: vi.fn(),
}));

vi.mock('../../compute/bridge', () => ({
  analyzeImage: mocks.analyzeImage,
}));

import { TauriComputeError } from '../../bridges/compute';
import type {
  AnalysisParams,
  AnalysisResult,
  SelectedImage,
} from '../../stores/ui';
import type {
  ProfileAcceptedResultContext,
  ProfileActionRef,
  ProfileAnalysisContext,
  RendererProfileTrace,
} from '../../profiling/trace';
import {
  createProfileTraceHarness,
  deliverProfileTestAction,
  profileTestSnapshot,
} from '../../profiling/trace-fixtures';
import { createAnalysisRunner } from '../home/analysis-runner.svelte';

const PARAMS: AnalysisParams = {
  clusters: 46,
  quality: 2,
  ignoreTopN: 0,
  mergeThreshold: 0,
  symbolScale: 1,
  showClusterOutline: false,
  showAxisLabels: true,
  polarMode: 'okhsv',
  hueLightnessSizeMode: 'chroma',
  histogramSort: 'frequency',
  snapToReal: true,
  showHistogram: true,
  showPolarChart: true,
  showHueLightness: true,
};

const RESULT: AnalysisResult = {
  clusters: [],
  iterations: 4,
  durationMs: 12,
  totalSamples: 100,
  variant: 'profile-test',
};

const FILE: SelectedImage = {
  id: 'image-a',
  name: 'image.png',
  path: '/private/image.png',
  size: 1,
  source: { kind: 'path', path: '/private/image.png' },
  previewUrl: null,
  dataset: { width: 0, height: 0, pixels: new Uint8Array() },
};

const ACTION: ProfileActionRef = Object.freeze({
  sessionId: 'session-a',
  actionId: 'action-a',
  rendererClockId: 'renderer-a',
});

function installRuneShims() {
  Object.defineProperty(globalThis, '$state', {
    configurable: true,
    value: <T>(value: T) => value,
  });
}

function traceHarness() {
  const analysis: ProfileAnalysisContext = {
    action: ACTION,
    expectedSourcePath: '/private/image.png',
    nativeRequest: {
      clusters: 46,
      quality: 2,
      ignoreTopN: 0,
      mergeThreshold: 0,
      snapToReal: true,
      minLum: 0,
      tolerance: 1e-3,
      maxIterations: 40,
      seed: 1,
      maxSamples: 300_000,
    },
  };
  const accepted: ProfileAcceptedResultContext = {
    analysis,
    result: RESULT,
    resultObservationId: 'result-a',
  };
  const trace = {
    observeSchedule: vi.fn(() => 'bound'),
    cancelAction: vi.fn(),
    staleAction: vi.fn(),
    unverifyAction: vi.fn(),
    admitAction: vi.fn(() => analysis),
    nativeInvocationContext: vi.fn(() => ({
      sessionId: ACTION.sessionId,
      actionId: ACTION.actionId,
      rendererClockId: ACTION.rendererClockId,
    })),
    markNativeIssue: vi.fn(),
    markNativeSettle: vi.fn(),
    markResponseParsed: vi.fn(),
    markStoreSuccess: vi.fn(() => accepted),
    markStoreError: vi.fn(),
  } as unknown as RendererProfileTrace;
  return { trace, analysis, accepted };
}

function createRunner(
  trace: RendererProfileTrace,
  overrides: Partial<Parameters<typeof createAnalysisRunner>[0]> = {}
) {
  let token = 0;
  return createAnalysisRunner({
    setAnalysisPending: () => ++token,
    setAnalysisSuccess: () => ({ status: 'accepted', imageId: FILE.id }),
    setAnalysisError: () => ({ status: 'accepted-error' }),
    recordDevEvent: vi.fn(),
    getProfileTrace: () => trace,
    onProfileAccepted: vi.fn(),
    ...overrides,
  });
}

describe('Colors profiling runner contract', () => {
  beforeEach(() => {
    installRuneShims();
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps a repeated reactive schedule bound to one delivered action', async () => {
    const { trace, accepted } = traceHarness();
    vi.mocked(trace.observeSchedule)
      .mockReturnValueOnce('bound')
      .mockReturnValueOnce('repeated');
    mocks.analyzeImage.mockImplementation(
      async (_dataset, _params, observer) => {
        observer.requestIssued({
          actualSourcePath: '/private/image.png',
          request: {
            k: 46,
            quality: 2,
            ignoreTopN: 0,
            mergeThreshold: 0,
            snapToReal: true,
            minLum: 0,
            tol: 1e-3,
            maxIter: 40,
            seed: 1,
            maxSamples: 300_000,
          },
        });
        observer.requestSettled('success');
        observer.responseParsed();
        return RESULT;
      }
    );
    const onProfileAccepted = vi.fn();
    const runner = createRunner(trace, { onProfileAccepted });

    runner.scheduleAnalysisWith(FILE, PARAMS, 'idle', ACTION);
    runner.scheduleAnalysisWith(FILE, PARAMS, 'pending', ACTION);
    await vi.advanceTimersByTimeAsync(400);

    expect(mocks.analyzeImage).toHaveBeenCalledOnce();
    expect(trace.cancelAction).not.toHaveBeenCalled();
    expect(trace.markNativeIssue).toHaveBeenCalledWith(
      accepted.analysis,
      '/private/image.png',
      accepted.analysis.nativeRequest
    );
    expect(trace.markNativeSettle).toHaveBeenCalledWith(
      accepted.analysis,
      true
    );
    expect(trace.markResponseParsed).toHaveBeenCalledWith(accepted.analysis);
    expect(onProfileAccepted).toHaveBeenCalledWith(accepted);
  });

  it('observes revision-distinct opaque keys while production deduplicates repeated B', async () => {
    const { trace } = createProfileTraceHarness();
    const observeSchedule = vi.spyOn(trace, 'observeSchedule');
    const actionA = deliverProfileTestAction(trace);
    trace.resolveDeliveredAction(actionA, profileTestSnapshot());
    const fileA: SelectedImage = {
      ...FILE,
      path: '/private/source-a.png',
      source: { kind: 'path', path: '/private/source-a.png' },
      contentRevision: 11,
    };
    const fileB: SelectedImage = { ...fileA, contentRevision: 12 };
    const setAnalysisSuccess = vi.fn(() => ({
      status: 'accepted' as const,
      imageId: fileB.id,
    }));
    const onProfileAccepted = vi.fn();
    mocks.analyzeImage.mockImplementation(
      async (_dataset, request, observer) => {
        observer?.requestIssued({
          actualSourcePath: '/private/source-a.png',
          request: {
            k: request.clusters,
            quality: request.quality,
            ignoreTopN: request.ignoreTopN,
            mergeThreshold: request.mergeThreshold,
            snapToReal: request.snapToReal,
            minLum: 0,
            tol: request.tol,
            maxIter: request.maxIter,
            seed: request.seed,
            maxSamples: request.maxSamples,
          },
        });
        observer?.requestSettled('success');
        observer?.responseParsed();
        return RESULT;
      }
    );
    const runner = createRunner(trace, {
      setAnalysisSuccess,
      onProfileAccepted,
    });

    runner.scheduleAnalysisWith(fileA, PARAMS, 'idle', actionA);
    const actionB = deliverProfileTestAction(trace);
    trace.resolveDeliveredAction(actionB, profileTestSnapshot());
    runner.scheduleAnalysisWith(fileB, PARAMS, 'idle', actionB);
    runner.scheduleAnalysisWith(fileB, PARAMS, 'pending', actionB);
    await vi.advanceTimersByTimeAsync(400);

    const [keyA, keyB, repeatedKeyB] = observeSchedule.mock.calls.map(
      ([, key]) => JSON.parse(key) as Record<string, unknown>
    );
    expect(keyA).toEqual({ ...keyB, contentRevision: 11 });
    expect(repeatedKeyB).toEqual(keyB);
    expect(observeSchedule.mock.calls.map(([, , deduped]) => deduped)).toEqual([
      false,
      false,
      true,
    ]);
    expect(mocks.analyzeImage).toHaveBeenCalledOnce();
    const nativeRequest = mocks.analyzeImage.mock.calls[0][1];
    expect(nativeRequest).toEqual({
      ...PARAMS,
      tol: 1e-3,
      maxIter: 40,
      seed: 1,
      maxSamples: 300_000,
    });
    expect(setAnalysisSuccess).toHaveBeenCalledWith(RESULT, fileB.id, 1);
    expect(onProfileAccepted).toHaveBeenCalledOnce();
    trace.cancelAction(actionB, 'view-unmounted');
  });

  it('does not run a same-key action that production deduplicates', async () => {
    const { trace } = traceHarness();
    vi.mocked(trace.observeSchedule)
      .mockReturnValueOnce('bound')
      .mockReturnValueOnce('closed');
    mocks.analyzeImage.mockResolvedValue(RESULT);
    const runner = createRunner(trace);

    runner.scheduleAnalysisWith(FILE, PARAMS, 'idle', ACTION);
    await vi.advanceTimersByTimeAsync(400);
    runner.scheduleAnalysisWith(FILE, PARAMS, 'ready', {
      ...ACTION,
      actionId: 'action-b',
    });
    await vi.advanceTimersByTimeAsync(400);

    expect(mocks.analyzeImage).toHaveBeenCalledOnce();
    expect(trace.observeSchedule).toHaveBeenLastCalledWith(
      expect.objectContaining({ actionId: 'action-b' }),
      expect.any(String),
      true
    );
  });

  it('marks a legacy void success callback unverified', async () => {
    const { trace } = traceHarness();
    mocks.analyzeImage.mockResolvedValue(RESULT);
    const runner = createRunner(trace, {
      setAnalysisSuccess: () => undefined,
    });

    runner.scheduleAnalysisWith(FILE, PARAMS, 'idle', ACTION);
    await vi.advanceTimersByTimeAsync(400);

    expect(trace.unverifyAction).toHaveBeenCalledWith(
      ACTION,
      'result-association-unverified'
    );
    expect(trace.markStoreSuccess).not.toHaveBeenCalled();
  });

  it('keeps the production success path when a profiling observer throws', async () => {
    const { trace } = traceHarness();
    vi.mocked(trace.observeSchedule).mockImplementation(() => {
      throw new Error('observer failed');
    });
    mocks.analyzeImage.mockResolvedValue(RESULT);
    const setAnalysisSuccess = vi.fn(() => ({
      status: 'accepted' as const,
      imageId: FILE.id,
    }));
    const runner = createRunner(trace, { setAnalysisSuccess });

    expect(() =>
      runner.scheduleAnalysisWith(FILE, PARAMS, 'idle', ACTION)
    ).not.toThrow();
    await vi.advanceTimersByTimeAsync(400);

    expect(mocks.analyzeImage).toHaveBeenCalledOnce();
    expect(setAnalysisSuccess).toHaveBeenCalledWith(RESULT, FILE.id, 1);
  });

  it('classifies a parsed-response failure after native settle', async () => {
    const { trace, analysis } = traceHarness();
    mocks.analyzeImage.mockImplementation(
      async (_dataset, _params, observer) => {
        observer.requestSettled('success');
        throw new TauriComputeError('invalid-response', 'bad response');
      }
    );
    const runner = createRunner(trace);

    runner.scheduleAnalysisWith(FILE, PARAMS, 'idle', ACTION);
    await vi.advanceTimersByTimeAsync(400);

    expect(trace.markStoreError).toHaveBeenCalledWith(
      analysis,
      { status: 'accepted-error' },
      'invalid-response'
    );
  });

  it('classifies an invoke rejection after recording native settle', async () => {
    const { trace, analysis } = traceHarness();
    mocks.analyzeImage.mockImplementation(
      async (_dataset, _params, observer) => {
        observer.requestSettled('error');
        throw new TauriComputeError('invoke-failed', 'invoke rejected');
      }
    );
    const runner = createRunner(trace);

    runner.scheduleAnalysisWith(FILE, PARAMS, 'idle', ACTION);
    await vi.advanceTimersByTimeAsync(400);

    expect(trace.markNativeSettle).toHaveBeenCalledWith(analysis, false);
    expect(trace.markStoreError).toHaveBeenCalledWith(
      analysis,
      { status: 'accepted-error' },
      'native-invoke'
    );
  });

  it('keeps an open production debounce pending after Finish until its normal lifecycle closes', async () => {
    const { trace, finalizeCalls } = createProfileTraceHarness();
    const action = deliverProfileTestAction(trace);
    mocks.analyzeImage.mockResolvedValue(RESULT);
    const runner = createRunner(trace);

    runner.scheduleAnalysisWith(FILE, PARAMS, 'idle', action);
    await expect(trace.finishCapture()).resolves.toMatchObject({
      phase: 'renderer-pending',
      rendererOpenCount: 1,
    });
    expect(finalizeCalls).toEqual([]);

    await vi.advanceTimersByTimeAsync(400);
    expect(mocks.analyzeImage).toHaveBeenCalledOnce();
    expect(trace.getOutcome(action)).toBeNull();
    trace.cancelAction(action, 'view-unmounted');
    await trace.getPersistence(action);
    await expect(trace.finishCapture()).resolves.toMatchObject({
      phase: 'sealed',
    });
  });
});
