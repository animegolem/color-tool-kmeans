import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  tauriInvoke: vi.fn(),
}));

vi.mock('./tauri', () => ({
  isTauriEnv: () => true,
  tauriInvoke: mocks.tauriInvoke,
}));

import {
  appendProfileBatch,
  finalizeProfileSession,
  profileAppendValidationErrorCode,
  type ProfileRendererBatch,
  type ProfileStatus,
} from './profiling';

const STATUS: ProfileStatus = {
  enabled: true,
  sessionId: 'session-a',
  clockId: 'native-a',
  nativeMonotonicNs: '0',
  wallUnixMs: 0,
  maxBatchEvents: 128,
  maxBatchBytes: 128 * 1024,
  rendererBeforeMs: 0,
  rendererAfterMs: 0,
};

function unavailableBatch(): ProfileRendererBatch {
  const actionId = 'action-invalid';
  const clockId = 'renderer-a';
  const input = {
    control: 'quality',
    targetState: 'invalid-or-empty' as const,
  };
  return {
    sessionId: 'session-a',
    batchSequence: 1,
    actionId,
    rendererProcessClockId: clockId,
    events: [
      {
        type: 'delivered_input',
        actionId,
        clockId,
        rendererMs: 1,
        data: input,
      },
      {
        type: 'input_resolved',
        actionId,
        clockId,
        rendererMs: 2,
        data: { sourceMatches: true, targetMatches: false },
      },
      {
        type: 'action_outcome',
        actionId,
        clockId,
        rendererMs: 3,
        data: {
          status: 'unverified',
          reasonCode: 'input-target-invalid',
          endpoint: null,
        },
      },
    ],
    observedOutcome: {
      status: 'unverified',
      reasonCode: 'input-target-invalid',
      endpoint: null,
      rendererMs: 3,
      freshExecution: false,
      associationChecks: { inputTargetResolved: false },
      measurements: {},
    },
    rendererDroppedEventCount: 0,
    analysisConfig: {
      state: 'unavailable',
      reasonCode: 'input-target-invalid',
    },
    renderConfig: {
      symbolScale: 1,
      showClusterOutline: false,
      showAxisLabels: true,
      polarMode: 'okhsv',
      hueLightnessSizeMode: 'chroma',
      histogramSort: 'frequency',
      showHistogram: true,
      showPolarChart: true,
      showHueLightness: true,
      showSimplifiedTones: true,
      frameLabel: 'timestamp',
      stripMode: 'barcode',
      compactSidebars: false,
    },
    input,
    imageRuntimeId: 'image-a',
  };
}

function resolvedBatch(): ProfileRendererBatch {
  const batch = unavailableBatch();
  batch.input = {
    control: 'clusters',
    targetState: 'number',
    targetNumber: 46,
  };
  batch.events[0].data = { ...batch.input };
  batch.events[1].data = { sourceMatches: true, targetMatches: true };
  batch.events[2].data = {
    status: 'cancelled',
    reasonCode: 'view-unmounted',
    endpoint: null,
  };
  batch.observedOutcome = {
    status: 'cancelled',
    reasonCode: 'view-unmounted',
    endpoint: null,
    rendererMs: 3,
    freshExecution: false,
    associationChecks: { inputTargetResolved: true },
    measurements: {},
  };
  batch.analysisConfig = {
    state: 'resolved',
    value: {
      clusters: 46,
      quality: 2,
      sampleCap: 180_000,
      maxDimension: 2200,
      ignoreTopN: 0,
      mergeThreshold: 0,
      snapToReal: true,
      seed: 1,
      maxIterations: 40,
      tolerance: 0.001,
      warmStart: 'none',
    },
  };
  return batch;
}

function receipt(overrides: Record<string, unknown> = {}) {
  return {
    sessionId: 'session-a',
    sealed: true,
    openActionCount: 0,
    recordCount: 3,
    eventCount: 9,
    artifactByteCount: 512,
    droppedEventCount: 0,
    lastBatchSequence: 2,
    errorCode: null,
    ...overrides,
  };
}

describe('profile finalization bridge', () => {
  beforeEach(() => mocks.tauriInvoke.mockReset());

  it('uses the exact native command shape and accepts a coherent seal', async () => {
    mocks.tauriInvoke.mockResolvedValue(receipt());

    await expect(finalizeProfileSession('session-a')).resolves.toEqual(
      receipt()
    );
    expect(mocks.tauriInvoke).toHaveBeenCalledWith('profile_finalize', {
      req: { sessionId: 'session-a' },
    });
  });

  it('accepts only the native open-action pending shape', async () => {
    const pending = receipt({
      sealed: false,
      openActionCount: 2,
      errorCode: 'profiling-actions-open',
    });
    mocks.tauriInvoke.mockResolvedValue(pending);
    await expect(finalizeProfileSession('session-a')).resolves.toEqual(pending);
  });

  it.each([
    ['wrong session', { sessionId: 'session-b' }],
    ['nonboolean seal', { sealed: 1 }],
    ['negative open count', { openActionCount: -1 }],
    ['fractional count', { eventCount: 1.5 }],
    ['unsafe count', { artifactByteCount: Number.MAX_SAFE_INTEGER + 1 }],
    ['zero record total', { recordCount: 0 }],
    ['zero byte total', { artifactByteCount: 0 }],
    ['unknown error', { sealed: false, errorCode: 'private/path/error' }],
    ['sealed error', { errorCode: 'profiling-seal-write' }],
    [
      'sealed open actions',
      { openActionCount: 1, errorCode: 'profiling-actions-open' },
    ],
    [
      'pending without open actions',
      {
        sealed: false,
        openActionCount: 0,
        errorCode: 'profiling-actions-open',
      },
    ],
    [
      'unsealed without an error',
      { sealed: false, openActionCount: 0, errorCode: null },
    ],
  ])(
    'rejects a malformed or contradictory %s receipt',
    async (_label, patch) => {
      mocks.tauriInvoke.mockResolvedValue(receipt(patch));
      await expect(finalizeProfileSession('session-a')).rejects.toThrow(
        'profile-finalize-receipt-invalid'
      );
    }
  );

  it('rejects unexpected receipt fields', async () => {
    mocks.tauriInvoke.mockResolvedValue(
      receipt({ unexpectedPath: '/private/trace.jsonl' })
    );
    await expect(finalizeProfileSession('session-a')).rejects.toThrow(
      'profile-finalize-receipt-invalid'
    );
  });

  it('preserves a coherent sealed receipt with native loss', async () => {
    const lossy = receipt({ droppedEventCount: 4 });
    mocks.tauriInvoke.mockResolvedValue(lossy);
    await expect(finalizeProfileSession('session-a')).resolves.toEqual(lossy);
  });
});

describe('profile append v2 analysis evidence', () => {
  beforeEach(() => mocks.tauriInvoke.mockReset());

  it('passes the exact unavailable invalid-input arm to native IPC', async () => {
    const batch = unavailableBatch();
    mocks.tauriInvoke.mockResolvedValue({
      sessionId: batch.sessionId,
      batchSequence: batch.batchSequence,
      actionId: batch.actionId,
      acceptedCount: batch.events.length,
      acceptedByteCount: 512,
      droppedCount: 0,
      closed: true,
      outcomeAccepted: true,
      nativeReceiveRecorded: false,
      nativeReturnRecorded: false,
      sessionTainted: false,
    });

    await expect(appendProfileBatch(batch, STATUS)).resolves.toMatchObject({
      outcomeAccepted: true,
      nativeReceiveRecorded: false,
    });
    expect(mocks.tauriInvoke).toHaveBeenCalledWith('profile_append_batch', {
      batch,
    });
  });

  it.each([
    [
      'numeric target',
      (batch: ProfileRendererBatch) =>
        (batch.input = {
          control: 'quality',
          targetState: 'number',
          targetNumber: 2,
        }),
    ],
    [
      'native admission',
      (batch: ProfileRendererBatch) =>
        batch.events.splice(2, 0, {
          type: 'request_admitted',
          actionId: batch.actionId,
          clockId: batch.rendererProcessClockId,
          rendererMs: 2.5,
        }),
    ],
    [
      'false source match',
      (batch: ProfileRendererBatch) =>
        (batch.events[1].data = { sourceMatches: false, targetMatches: false }),
    ],
    [
      'measurement',
      (batch: ProfileRendererBatch) =>
        (batch.observedOutcome.measurements = { run_kmeans_ms: 1 }),
    ],
    [
      'dropped event',
      (batch: ProfileRendererBatch) => (batch.rendererDroppedEventCount = 1),
    ],
    [
      'unknown reason',
      (batch: ProfileRendererBatch) =>
        ((batch.analysisConfig as { reasonCode: string }).reasonCode = 'other'),
    ],
  ])(
    'rejects contradictory unavailable evidence: %s',
    async (_label, mutate) => {
      const batch = unavailableBatch();
      mutate(batch);
      await expect(appendProfileBatch(batch, STATUS)).rejects.toThrow(
        'profile-analysis-config-invalid'
      );
      expect(mocks.tauriInvoke).not.toHaveBeenCalled();
    }
  );

  it('allowlists authored validation errors and hides arbitrary text', () => {
    expect(
      profileAppendValidationErrorCode(
        new Error('profile-analysis-config-invalid')
      )
    ).toBe('profile-analysis-config-invalid');
    expect(
      profileAppendValidationErrorCode(new Error('/private/source.png failed'))
    ).toBeNull();
  });

  it.each([
    ['undefined clusters', 'clusters', undefined],
    ['NaN quality', 'quality', Number.NaN],
    ['infinite threshold', 'mergeThreshold', Number.POSITIVE_INFINITY],
  ])('rejects hostile resolved config: %s', async (_label, key, value) => {
    const batch = resolvedBatch();
    if (batch.analysisConfig.state !== 'resolved')
      throw new Error('test setup');
    (batch.analysisConfig.value as unknown as Record<string, unknown>)[key] =
      value;
    await expect(appendProfileBatch(batch, STATUS)).rejects.toThrow(
      'profile-analysis-config-invalid'
    );
    expect(mocks.tauriInvoke).not.toHaveBeenCalled();
  });
});
