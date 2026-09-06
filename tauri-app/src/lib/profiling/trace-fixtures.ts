import { expect } from 'vitest';
import type { AnalysisParams, AnalysisResult } from '../stores/analysis';
import type {
  ProfileAppendReceipt,
  ProfileFinalizeReceipt,
  ProfileRendererBatch,
  ProfileStatus,
} from '../bridges/profiling';
import {
  RendererProfileTrace,
  createProfileAnalysisConfig,
  createProfileNativeRequest,
  createProfileRenderConfig,
  type ProfileActionRef,
  type ProfileResolvedSnapshot,
} from './trace';

export const PROFILE_TEST_PARAMS: AnalysisParams = {
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
  showPolarChart: false,
  showHueLightness: false,
};

export const PROFILE_TEST_RESULT: AnalysisResult = {
  clusters: [
    {
      count: 1,
      share: 1,
      centroidSpace: [0.5, 0, 0],
      oklab: [0.5, 0, 0],
      oklch: [0.5, 0, 0],
      rgb: { r: 128, g: 128, b: 128 },
      hsv: [0, 0, 0.5],
    },
  ],
  iterations: 3,
  durationMs: 12,
  totalSamples: 1,
  variant: 'test',
};

export const PROFILE_TEST_STATUS: ProfileStatus = {
  enabled: true,
  sessionId: 'session-a',
  clockId: 'native-clock-a',
  nativeMonotonicNs: '100',
  wallUnixMs: 1_000,
  maxBatchEvents: 128,
  maxBatchBytes: 128 * 1024,
  rendererBeforeMs: 1,
  rendererAfterMs: 2,
};

export function profileTestSnapshot(
  params = PROFILE_TEST_PARAMS
): ProfileResolvedSnapshot {
  return {
    imageRuntimeId: 'image-a',
    expectedSourcePath: '/private/source-a.png',
    analysisConfig: createProfileAnalysisConfig(params),
    renderConfig: createProfileRenderConfig(params, {
      showSimplifiedTones: true,
      frameLabel: 'timestamp',
      stripMode: 'barcode',
      compactSidebars: false,
    }),
  };
}

export function createProfileTraceHarness(options?: {
  visible?: boolean;
  append?: (
    batch: ProfileRendererBatch,
    status: ProfileStatus
  ) => Promise<ProfileAppendReceipt>;
  finalize?: (sessionId: string) => Promise<ProfileFinalizeReceipt>;
}) {
  const batches: ProfileRendererBatch[] = [];
  const finalizeCalls: string[] = [];
  const frames: FrameRequestCallback[] = [];
  const visibilityCallbacks = new Set<() => void>();
  let visible = options?.visible ?? true;
  let now = 10;
  let id = 0;
  const trace = new RendererProfileTrace({
    status: PROFILE_TEST_STATUS,
    now: () => now++,
    nextId: () => String(++id),
    requestFrame: (callback) => {
      frames.push(callback);
      return frames.length;
    },
    cancelFrame: () => undefined,
    visibilityState: () => (visible ? 'visible' : 'hidden'),
    subscribeVisibility: (callback) => {
      visibilityCallbacks.add(callback);
      return () => visibilityCallbacks.delete(callback);
    },
    append: async (batch, status) => {
      batches.push(batch);
      if (options?.append) return options.append(batch, status);
      return {
        sessionId: batch.sessionId,
        batchSequence: batch.batchSequence,
        actionId: batch.actionId,
        acceptedCount: batch.events.length,
        acceptedByteCount: JSON.stringify(batch).length,
        droppedCount: 0,
        closed: true,
        outcomeAccepted: true,
        nativeReceiveRecorded: true,
        nativeReturnRecorded: true,
        sessionTainted: false,
      };
    },
    finalize: async (sessionId) => {
      finalizeCalls.push(sessionId);
      if (options?.finalize) return options.finalize(sessionId);
      return {
        sessionId,
        sealed: true,
        openActionCount: 0,
        recordCount: 2,
        eventCount: 2,
        artifactByteCount: 256,
        droppedEventCount: 0,
        lastBatchSequence: batches.at(-1)?.batchSequence ?? 0,
        errorCode: null,
      };
    },
  });
  return {
    trace,
    batches,
    finalizeCalls,
    frames,
    setVisible(value: boolean) {
      visible = value;
      visibilityCallbacks.forEach((callback) => callback());
    },
  };
}

export function deliverProfileTestAction(
  trace: RendererProfileTrace,
  targetValue = 46
): ProfileActionRef {
  const candidate = profileTestSnapshot();
  const action = trace.startDeliveredAction({
    control: 'clusters',
    targetValue,
    imageRuntimeId: candidate.imageRuntimeId,
    expectedSourcePath: candidate.expectedSourcePath,
    deliveredAt: 5,
    candidateSnapshot: candidate,
  });
  expect(action).not.toBeNull();
  return action as ProfileActionRef;
}

export function admitProfileTestAction(
  trace: RendererProfileTrace,
  action: ProfileActionRef
) {
  const resolved = profileTestSnapshot();
  expect(trace.resolveDeliveredAction(action, resolved)).toBe(true);
  expect(trace.observeSchedule(action, 'request-a', false)).toBe('bound');
  const request = createProfileNativeRequest(PROFILE_TEST_PARAMS);
  const context = trace.admitAction(action, request);
  expect(context).not.toBeNull();
  trace.markNativeIssue(context!, resolved.expectedSourcePath, request);
  trace.markNativeSettle(context!, true);
  trace.markResponseParsed(context!);
  return context!;
}
