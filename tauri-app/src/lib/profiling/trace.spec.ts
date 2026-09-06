import { describe, expect, it, vi } from 'vitest';
import type { ProfileRendererBatch } from '../bridges/profiling';
import {
  createProfileNativeRequest,
  getRendererProfileTrace,
  type ProfileFigure,
} from './trace';
import {
  PROFILE_TEST_PARAMS as PARAMS,
  PROFILE_TEST_RESULT as RESULT,
  admitProfileTestAction as admit,
  createProfileTraceHarness as harness,
  deliverProfileTestAction as deliver,
  profileTestSnapshot as snapshot,
} from './trace-fixtures';

describe('renderer profile trace', () => {
  it('is a zero-action no-op before the cached status enables it', () => {
    expect(getRendererProfileTrace()).toBeNull();
  });

  it('distinguishes repeated reactive scheduling from a same-key user dedup', async () => {
    const { trace } = harness();
    const first = deliver(trace);
    expect(trace.resolveDeliveredAction(first, snapshot())).toBe(true);
    expect(trace.observeSchedule(first, 'same-key', false)).toBe('bound');
    expect(trace.observeSchedule(first, 'same-key', true)).toBe('repeated');
    expect(trace.getOutcome(first)).toBeNull();
    expect(
      trace.admitAction(first, createProfileNativeRequest(PARAMS))
    ).not.toBeNull();

    const second = deliver(trace);
    expect(trace.resolveDeliveredAction(second, snapshot())).toBe(true);
    expect(trace.observeSchedule(second, 'same-key', true)).toBe('closed');
    expect(trace.getOutcome(second)).toMatchObject({
      status: 'deduped',
      reasonCode: 'request-key-unchanged',
    });
    await trace.getPersistence(second);
    trace.cancelAction(first, 'view-unmounted');
  });

  it('revokes settings changes instead of rewriting a bound action snapshot', () => {
    const { trace } = harness();
    const action = deliver(trace);
    const first = snapshot();
    expect(trace.resolveDeliveredAction(action, first)).toBe(true);
    expect(trace.observeSchedule(action, 'same-key', false)).toBe('bound');
    const changed = snapshot({ ...PARAMS, symbolScale: 1.5 });

    expect(trace.resolveDeliveredAction(action, changed)).toBe(false);
    expect(trace.getOutcome(action)).toMatchObject({
      status: 'unverified',
      reasonCode: 'result-association-unverified',
    });
  });

  it('closes rapid delivered inputs exactly once as superseded', async () => {
    const { trace, batches } = harness();
    const first = deliver(trace);
    const second = deliver(trace, 47);

    expect(trace.getOutcome(first)).toMatchObject({
      status: 'cancelled',
      reasonCode: 'input-superseded',
    });
    expect(trace.cancelAction(first, 'view-unmounted')).toBeNull();
    await trace.getPersistence(first);
    expect(batches[0].events.at(-1)?.type).toBe('action_outcome');
    trace.cancelAction(second, 'view-unmounted');
  });

  it('rejects unresolved and invalid delivered target values explicitly', () => {
    const { trace } = harness();
    const unresolved = deliver(trace, 47);
    expect(trace.resolveDeliveredAction(unresolved, snapshot())).toBe(false);
    expect(trace.getOutcome(unresolved)?.reasonCode).toBe(
      'input-value-unresolved'
    );

    const invalid = deliver(trace, Number.NaN);
    expect(trace.resolveDeliveredAction(invalid, snapshot())).toBe(false);
    expect(trace.getOutcome(invalid)?.reasonCode).toBe('input-target-invalid');
  });

  it('persists an ordinary invalid numeric action with unavailable v2 evidence', async () => {
    const { trace, batches } = harness();
    const resolved = snapshot();
    const unavailable = {
      imageRuntimeId: resolved.imageRuntimeId,
      expectedSourcePath: resolved.expectedSourcePath,
      renderConfig: resolved.renderConfig,
      reasonCode: 'input-target-invalid' as const,
    };
    const action = trace.startDeliveredAction({
      control: 'quality',
      targetValue: null,
      imageRuntimeId: unavailable.imageRuntimeId,
      expectedSourcePath: unavailable.expectedSourcePath,
      unavailableSnapshot: unavailable,
    })!;

    expect(trace.resolveUnavailableDeliveredAction(action, unavailable)).toBe(
      true
    );
    await expect(trace.getPersistence(action)).resolves.toMatchObject({
      ok: true,
    });
    expect(batches).toHaveLength(1);
    expect(batches[0]).toMatchObject({
      batchSequence: 1,
      analysisConfig: {
        state: 'unavailable',
        reasonCode: 'input-target-invalid',
      },
      rendererDroppedEventCount: 0,
      observedOutcome: {
        status: 'unverified',
        reasonCode: 'input-target-invalid',
        associationChecks: { inputTargetResolved: false },
        measurements: {},
      },
    });
    expect(batches[0].events.map((event) => event.type)).toEqual([
      'delivered_input',
      'input_resolved',
      'action_outcome',
    ]);
    expect(
      trace.admitAction(action, createProfileNativeRequest(PARAMS))
    ).toBeNull();
  });

  it('keeps an allowlisted first append failure sticky after later success', async () => {
    let calls = 0;
    const { trace, finalizeCalls } = harness({
      append: async (batch) => {
        calls += 1;
        if (calls === 1) throw new Error('profile-analysis-config-invalid');
        return {
          sessionId: batch.sessionId,
          batchSequence: batch.batchSequence,
          actionId: batch.actionId,
          acceptedCount: batch.events.length,
          acceptedByteCount: 1,
          droppedCount: 0,
          closed: true,
          outcomeAccepted: true,
          nativeReceiveRecorded: false,
          nativeReturnRecorded: false,
          sessionTainted: false,
        };
      },
    });
    const first = deliver(trace);
    trace.cancelAction(first, 'view-unmounted');
    const second = deliver(trace, 47);
    trace.cancelAction(second, 'view-unmounted');
    await Promise.all([
      trace.getPersistence(first),
      trace.getPersistence(second),
    ]);

    await expect(trace.finishCapture()).resolves.toMatchObject({
      phase: 'failed',
      errorCode: 'renderer-persistence-failed',
      retryable: false,
    });
    expect(finalizeCalls).toEqual([]);
  });

  it('requires actual store acceptance before returning result association', () => {
    const { trace } = harness();
    const action = deliver(trace);
    const context = admit(trace, action);

    expect(
      trace.markStoreSuccess(context, RESULT, { status: 'stale-token' })
    ).toBeNull();
    expect(trace.getOutcome(action)).toMatchObject({
      status: 'stale',
      reasonCode: 'store-token-rejected',
    });
  });

  it.each([
    {
      label: 'path',
      path: '/private/wrong.png',
      request: createProfileNativeRequest(PARAMS),
    },
    {
      label: 'request settings',
      path: '/private/source-a.png',
      request: { ...createProfileNativeRequest(PARAMS), clusters: 99 },
    },
  ])(
    'withholds association for wrong actual $label',
    async ({ path, request }) => {
      const { trace } = harness();
      const action = deliver(trace);
      const resolved = snapshot();
      expect(trace.resolveDeliveredAction(action, resolved)).toBe(true);
      expect(trace.observeSchedule(action, 'request-a', false)).toBe('bound');
      const context = trace.admitAction(
        action,
        createProfileNativeRequest(PARAMS)
      )!;
      trace.markNativeIssue(context, path, request);
      trace.markNativeSettle(context, true);
      trace.markResponseParsed(context);
      const accepted = trace.markStoreSuccess(context, RESULT, {
        status: 'accepted',
      })!;
      trace.markFigureGenerated(
        accepted,
        'histogram',
        RESULT,
        resolved.analysisConfig,
        resolved.renderConfig,
        1
      );

      const outcome = await trace.coordinateDomRaf2(accepted, {
        enabledFigures: ['histogram'],
        activeImageRuntimeId: () => 'image-a',
        currentResult: () => RESULT,
        currentAnalysisConfig: () => resolved.analysisConfig,
        currentRenderConfig: () => resolved.renderConfig,
        settle: async () => undefined,
        domFigureCounts: () => ({ histogram: 1 }),
      });

      expect(outcome).toMatchObject({
        status: 'unverified',
        reasonCode: 'result-association-unverified',
      });
    }
  );

  it('does not reopen a cancelled outcome on a late renderer settle', async () => {
    const { trace, batches } = harness();
    const action = deliver(trace);
    const context = admit(trace, action);
    const outcome = trace.cancelAction(action, 'input-superseded');

    trace.markNativeSettle(context, true);
    trace.markResponseParsed(context);
    expect(trace.getOutcome(action)).toBe(outcome);
    await trace.getPersistence(action);
    expect(batches).toHaveLength(1);
    expect(batches[0].events.at(-1)?.type).toBe('action_outcome');
  });

  it('joins generated figures, checked DOM, and two visible RAFs', async () => {
    const { trace, frames, batches } = harness();
    const action = deliver(trace);
    const context = admit(trace, action);
    const accepted = trace.markStoreSuccess(context, RESULT, {
      status: 'accepted',
    });
    expect(accepted).not.toBeNull();
    const resolved = snapshot();
    trace.markFigureGenerated(
      accepted!,
      'histogram',
      RESULT,
      resolved.analysisConfig,
      resolved.renderConfig,
      2
    );
    const completion = trace.coordinateDomRaf2(accepted!, {
      enabledFigures: ['histogram'],
      activeImageRuntimeId: () => 'image-a',
      currentResult: () => RESULT,
      currentAnalysisConfig: () => resolved.analysisConfig,
      currentRenderConfig: () => resolved.renderConfig,
      settle: async () => undefined,
      domFigureCounts: () => ({ histogram: 1, polar: 0, 'hue-lightness': 0 }),
    });

    await Promise.resolve();
    frames.shift()?.(20);
    await Promise.resolve();
    frames.shift()?.(21);
    const outcome = await completion;
    expect(outcome).toMatchObject({
      status: 'completed',
      reasonCode: null,
      endpoint: 'associated_result_dom_raf2_approx',
      freshExecution: null,
    });
    await trace.getPersistence(action);
    expect(batches[0].observedOutcome.measurements).toMatchObject({
      input_to_request_admitted_ms: expect.any(Number),
      renderer_native_roundtrip_ms: expect.any(Number),
      input_to_store_accepted_ms: expect.any(Number),
      input_to_enabled_figures_generated_ms: expect.any(Number),
      input_to_dom_settled_ms: expect.any(Number),
      input_to_associated_result_dom_raf2_approx_ms: expect.any(Number),
      run_kmeans_ms: 12,
    });
    expect(JSON.stringify(batches[0])).not.toContain('/private/source-a.png');
  });

  it.each([
    { enabled: [], reason: 'no-enabled-figures' },
    { enabled: ['histogram'] as const, reason: 'dom-figure-mismatch' },
  ])('withholds completion for $reason', async ({ enabled, reason }) => {
    const { trace } = harness();
    const action = deliver(trace);
    const context = admit(trace, action);
    const accepted = trace.markStoreSuccess(context, RESULT, {
      status: 'accepted',
    });
    const resolved = snapshot();
    if (enabled.length) {
      trace.markFigureGenerated(
        accepted!,
        'histogram',
        RESULT,
        resolved.analysisConfig,
        resolved.renderConfig,
        1
      );
    }
    const outcome = await trace.coordinateDomRaf2(accepted!, {
      enabledFigures: enabled,
      activeImageRuntimeId: () => 'image-a',
      currentResult: () => RESULT,
      currentAnalysisConfig: () => resolved.analysisConfig,
      currentRenderConfig: () => resolved.renderConfig,
      settle: async () => undefined,
      domFigureCounts: () => ({}),
    });
    expect(outcome?.reasonCode).toBe(reason);
  });

  it.each(
    [
      [],
      ['histogram'],
      ['polar'],
      ['hue-lightness'],
      ['histogram', 'polar'],
      ['histogram', 'hue-lightness'],
      ['polar', 'hue-lightness'],
      ['histogram', 'polar', 'hue-lightness'],
    ].map((enabled) => ({ enabled: enabled as ProfileFigure[] }))
  )(
    'handles the enabled figure combination $enabled without forcing disabled charts',
    async ({ enabled }) => {
      const { trace, frames } = harness();
      const action = deliver(trace);
      const context = admit(trace, action);
      const accepted = trace.markStoreSuccess(context, RESULT, {
        status: 'accepted',
      });
      const resolved = snapshot();
      for (const figure of enabled) {
        trace.markFigureGenerated(
          accepted!,
          figure,
          RESULT,
          resolved.analysisConfig,
          resolved.renderConfig,
          1
        );
      }
      const completion = trace.coordinateDomRaf2(accepted!, {
        enabledFigures: enabled,
        activeImageRuntimeId: () => 'image-a',
        currentResult: () => RESULT,
        currentAnalysisConfig: () => resolved.analysisConfig,
        currentRenderConfig: () => resolved.renderConfig,
        settle: async () => undefined,
        domFigureCounts: () =>
          Object.fromEntries(enabled.map((figure) => [figure, 1])),
      });
      if (enabled.length > 0) {
        await Promise.resolve();
        frames.shift()?.(20);
        await Promise.resolve();
        frames.shift()?.(21);
      }

      const outcome = await completion;
      expect(outcome).toMatchObject(
        enabled.length === 0
          ? { status: 'unverified', reasonCode: 'no-enabled-figures' }
          : {
              status: 'completed',
              reasonCode: null,
              endpoint: 'associated_result_dom_raf2_approx',
            }
      );
    }
  );

  it('withholds completion when visibility changes between RAFs', async () => {
    const { trace, frames, setVisible } = harness();
    const action = deliver(trace);
    const context = admit(trace, action);
    const accepted = trace.markStoreSuccess(context, RESULT, {
      status: 'accepted',
    });
    const resolved = snapshot();
    trace.markFigureGenerated(
      accepted!,
      'histogram',
      RESULT,
      resolved.analysisConfig,
      resolved.renderConfig,
      1
    );
    const completion = trace.coordinateDomRaf2(accepted!, {
      enabledFigures: ['histogram'],
      activeImageRuntimeId: () => 'image-a',
      currentResult: () => RESULT,
      currentAnalysisConfig: () => resolved.analysisConfig,
      currentRenderConfig: () => resolved.renderConfig,
      settle: async () => undefined,
      domFigureCounts: () => ({ histogram: 1 }),
    });
    await Promise.resolve();
    frames.shift()?.(20);
    await Promise.resolve();
    setVisible(false);

    expect(await completion).toMatchObject({
      status: 'unverified',
      reasonCode: 'hidden-before-dom-raf2',
    });
  });

  it('keeps an unmount between DOM settle and RAF immutable', async () => {
    const { trace } = harness();
    const action = deliver(trace);
    const context = admit(trace, action);
    const accepted = trace.markStoreSuccess(context, RESULT, {
      status: 'accepted',
    })!;
    const resolved = snapshot();
    trace.markFigureGenerated(
      accepted,
      'histogram',
      RESULT,
      resolved.analysisConfig,
      resolved.renderConfig,
      1
    );
    const completion = trace.coordinateDomRaf2(accepted, {
      enabledFigures: ['histogram'],
      activeImageRuntimeId: () => 'image-a',
      currentResult: () => RESULT,
      currentAnalysisConfig: () => resolved.analysisConfig,
      currentRenderConfig: () => resolved.renderConfig,
      settle: async () => undefined,
      domFigureCounts: () => ({ histogram: 1 }),
    });
    await Promise.resolve();
    trace.cancelAction(action, 'view-unmounted');

    expect(await completion).toMatchObject({
      status: 'cancelled',
      reasonCode: 'view-unmounted',
    });
  });

  it.each(['source', 'result', 'settings'] as const)(
    'revokes a $change replacement between RAF callbacks',
    async (change) => {
      const { trace, frames } = harness();
      const action = deliver(trace);
      const context = admit(trace, action);
      const accepted = trace.markStoreSuccess(context, RESULT, {
        status: 'accepted',
      })!;
      const resolved = snapshot();
      trace.markFigureGenerated(
        accepted,
        'histogram',
        RESULT,
        resolved.analysisConfig,
        resolved.renderConfig,
        1
      );
      let activeImage = 'image-a';
      let currentResult = RESULT;
      let currentAnalysis = resolved.analysisConfig;
      const completion = trace.coordinateDomRaf2(accepted, {
        enabledFigures: ['histogram'],
        activeImageRuntimeId: () => activeImage,
        currentResult: () => currentResult,
        currentAnalysisConfig: () => currentAnalysis,
        currentRenderConfig: () => resolved.renderConfig,
        settle: async () => undefined,
        domFigureCounts: () => ({ histogram: 1 }),
      });
      await Promise.resolve();
      frames.shift()?.(20);
      await Promise.resolve();
      if (change === 'source') activeImage = 'image-b';
      if (change === 'result') currentResult = { ...RESULT };
      if (change === 'settings') {
        currentAnalysis = { ...resolved.analysisConfig, clusters: 47 };
      }
      frames.shift()?.(21);

      expect(await completion).toMatchObject({
        status: 'unverified',
        reasonCode: 'result-association-unverified',
      });
    }
  );

  it('reserves closure while tainting an overflowed session', async () => {
    const { trace, batches } = harness();
    const action = deliver(trace);
    const context = admit(trace, action);
    const accepted = trace.markStoreSuccess(context, RESULT, {
      status: 'accepted',
    });
    const resolved = snapshot();
    for (let index = 0; index < 80; index += 1) {
      trace.markFigureGenerated(
        accepted!,
        'histogram',
        RESULT,
        resolved.analysisConfig,
        resolved.renderConfig,
        1
      );
    }
    trace.cancelAction(action, 'view-unmounted');
    await trace.getPersistence(action);

    expect(batches[0].rendererDroppedEventCount).toBeGreaterThan(0);
    expect(batches[0].events.at(-1)?.type).toBe('action_outcome');
  });

  it('does not repeat an earlier action drop in a later clean batch', async () => {
    const { trace, batches } = harness();
    const droppedAction = deliver(trace);
    const context = admit(trace, droppedAction);
    const accepted = trace.markStoreSuccess(context, RESULT, {
      status: 'accepted',
    })!;
    const resolved = snapshot();
    for (let index = 0; index < 80; index += 1) {
      trace.markFigureGenerated(
        accepted,
        'histogram',
        RESULT,
        resolved.analysisConfig,
        resolved.renderConfig,
        1
      );
    }
    trace.cancelAction(droppedAction, 'view-unmounted');
    await trace.getPersistence(droppedAction);

    const cleanAction = deliver(trace);
    trace.cancelAction(cleanAction, 'view-unmounted');
    await trace.getPersistence(cleanAction);

    expect(batches).toHaveLength(2);
    expect(batches[0].rendererDroppedEventCount).toBeGreaterThan(0);
    expect(batches[1]).toMatchObject({
      actionId: cleanAction.actionId,
      rendererDroppedEventCount: 0,
    });
  });

  it('persists a session-loss witness before refusing actions at capacity', async () => {
    const finalize = vi.fn();
    const { trace, batches } = harness({ finalize });
    const candidate = snapshot();
    for (let index = 0; index < 63; index += 1) {
      const action = trace.startDeliveredAction({
        control: 'clusters',
        targetValue: 46,
        imageRuntimeId: candidate.imageRuntimeId,
        expectedSourcePath: candidate.expectedSourcePath,
        candidateSnapshot: candidate,
      })!;
      trace.cancelAction(action, 'input-superseded');
    }

    expect(
      trace.startDeliveredAction({
        control: 'clusters',
        targetValue: 46,
        imageRuntimeId: candidate.imageRuntimeId,
        expectedSourcePath: candidate.expectedSourcePath,
        candidateSnapshot: candidate,
      })
    ).toBeNull();
    await expect(trace.finishCapture()).resolves.toMatchObject({
      phase: 'failed',
      errorCode: 'renderer-trace-dropped',
    });
    expect(batches).toHaveLength(64);
    expect(batches.at(-1)).toMatchObject({
      rendererDroppedEventCount: 1,
      observedOutcome: {
        status: 'unverified',
        reasonCode: 'trace-dropped',
      },
    });
    expect(finalize).not.toHaveBeenCalled();
  });

  it('does not disguise an invalid capacity sentinel as clean unavailable evidence', async () => {
    const finalize = vi.fn();
    const { trace, batches } = harness({ finalize });
    const candidate = snapshot();
    for (let index = 0; index < 63; index += 1) {
      const action = trace.startDeliveredAction({
        control: 'clusters',
        targetValue: 46,
        imageRuntimeId: candidate.imageRuntimeId,
        expectedSourcePath: candidate.expectedSourcePath,
        candidateSnapshot: candidate,
      })!;
      trace.cancelAction(action, 'input-superseded');
    }
    expect(
      trace.startDeliveredAction({
        control: 'quality',
        targetValue: null,
        imageRuntimeId: candidate.imageRuntimeId,
        expectedSourcePath: candidate.expectedSourcePath,
        unavailableSnapshot: {
          imageRuntimeId: candidate.imageRuntimeId,
          expectedSourcePath: candidate.expectedSourcePath,
          renderConfig: candidate.renderConfig,
          reasonCode: 'input-target-invalid',
        },
      })
    ).toBeNull();

    await expect(trace.finishCapture()).resolves.toMatchObject({
      phase: 'failed',
      errorCode: 'renderer-trace-dropped',
    });
    expect(batches).toHaveLength(63);
    expect(
      batches.some((batch) => batch.analysisConfig.state === 'unavailable')
    ).toBe(false);
    expect(finalize).not.toHaveBeenCalled();
  });

  it.each([
    {
      label: 'failed write',
      append: async () => {
        throw new Error('disk unavailable');
      },
      errorCode: 'trace-flush-failed',
    },
    {
      label: 'dropped or truncated receipt',
      append: async (batch: ProfileRendererBatch) => ({
        sessionId: batch.sessionId,
        batchSequence: batch.batchSequence,
        actionId: batch.actionId,
        acceptedCount: Math.max(0, batch.events.length - 1),
        acceptedByteCount: 0,
        droppedCount: 1,
        closed: true as const,
        outcomeAccepted: false,
        nativeReceiveRecorded: true,
        nativeReturnRecorded: true,
        sessionTainted: true,
      }),
      errorCode: 'trace-dropped',
    },
  ])(
    'keeps the observed terminal immutable after a $label',
    async ({ append, errorCode }) => {
      const { trace } = harness({ append });
      const action = deliver(trace);
      const outcome = trace.cancelAction(action, 'view-unmounted');
      const persistence = await trace.getPersistence(action);

      expect(trace.getOutcome(action)).toBe(outcome);
      expect(persistence).toMatchObject({ ok: false, errorCode });
    }
  );

  it('seals an empty same-lifetime collector without fabricating actions', async () => {
    const { trace, batches, finalizeCalls } = harness();

    await expect(trace.finishCapture()).resolves.toMatchObject({
      phase: 'sealed',
      receipt: { sealed: true, lastBatchSequence: 0 },
    });
    expect(batches).toEqual([]);
    expect(finalizeCalls).toEqual(['session-a']);
  });

  it('quiesces before supersession and permits only an explicit renderer retry', async () => {
    const { trace, finalizeCalls } = harness();
    const action = deliver(trace);

    await expect(trace.finishCapture()).resolves.toMatchObject({
      phase: 'renderer-pending',
      rendererOpenCount: 1,
      retryable: true,
    });
    expect(
      trace.startDeliveredAction({
        control: 'clusters',
        targetValue: 47,
        imageRuntimeId: 'image-a',
        expectedSourcePath: '/private/source-a.png',
        candidateSnapshot: snapshot(),
      })
    ).toBeNull();
    expect(trace.getOutcome(action)).toBeNull();
    expect(finalizeCalls).toEqual([]);

    trace.cancelAction(action, 'view-unmounted');
    await trace.getPersistence(action);
    await expect(trace.finishCapture()).resolves.toMatchObject({
      phase: 'sealed',
    });
  });

  it('serializes actual append invocation in assigned batch order', async () => {
    let releaseFirst!: (value: void) => void;
    const firstPending = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const invoked: number[] = [];
    const { trace } = harness({
      append: async (batch) => {
        invoked.push(batch.batchSequence);
        if (batch.batchSequence === 1) await firstPending;
        return {
          sessionId: batch.sessionId,
          batchSequence: batch.batchSequence,
          actionId: batch.actionId,
          acceptedCount: batch.events.length,
          acceptedByteCount: 100,
          droppedCount: 0,
          closed: true,
          outcomeAccepted: true,
          nativeReceiveRecorded: true,
          nativeReturnRecorded: true,
          sessionTainted: false,
        };
      },
    });
    const first = deliver(trace);
    trace.cancelAction(first, 'view-unmounted');
    const second = deliver(trace);
    trace.cancelAction(second, 'view-unmounted');

    await Promise.resolve();
    expect(invoked).toEqual([1]);
    releaseFirst();
    await Promise.all([
      trace.getPersistence(first),
      trace.getPersistence(second),
    ]);
    expect(invoked).toEqual([1, 2]);
  });

  it('drains later batches but keeps an earlier persistence failure sticky', async () => {
    const invoked: number[] = [];
    const finalize = vi.fn();
    const { trace } = harness({
      append: async (batch) => {
        invoked.push(batch.batchSequence);
        if (batch.batchSequence === 1) throw new Error('private disk path');
        return {
          sessionId: batch.sessionId,
          batchSequence: batch.batchSequence,
          actionId: batch.actionId,
          acceptedCount: batch.events.length,
          acceptedByteCount: 100,
          droppedCount: 0,
          closed: true,
          outcomeAccepted: true,
          nativeReceiveRecorded: true,
          nativeReturnRecorded: true,
          sessionTainted: false,
        };
      },
      finalize,
    });
    const first = deliver(trace);
    trace.cancelAction(first, 'view-unmounted');
    const second = deliver(trace);
    trace.cancelAction(second, 'view-unmounted');

    await expect(trace.finishCapture()).resolves.toMatchObject({
      phase: 'failed',
      errorCode: 'renderer-persistence-failed',
    });
    expect(invoked).toEqual([1, 2]);
    await expect(trace.getPersistence(second)).resolves.toMatchObject({
      ok: true,
    });
    expect(finalize).not.toHaveBeenCalled();
  });

  it('waits for every unresolved append before native finalization', async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const finalize = vi.fn(async () => ({
      sessionId: 'session-a',
      sealed: true,
      openActionCount: 0,
      recordCount: 2,
      eventCount: 2,
      artifactByteCount: 256,
      droppedEventCount: 0,
      lastBatchSequence: 1,
      errorCode: null,
    }));
    const { trace } = harness({
      append: async (batch) => {
        await pending;
        return {
          sessionId: batch.sessionId,
          batchSequence: batch.batchSequence,
          actionId: batch.actionId,
          acceptedCount: batch.events.length,
          acceptedByteCount: 100,
          droppedCount: 0,
          closed: true,
          outcomeAccepted: true,
          nativeReceiveRecorded: true,
          nativeReturnRecorded: true,
          sessionTainted: false,
        };
      },
      finalize,
    });
    const action = deliver(trace);
    trace.cancelAction(action, 'view-unmounted');
    const finishing = trace.finishCapture();

    await Promise.resolve();
    await Promise.resolve();
    expect(finalize).not.toHaveBeenCalled();
    release();
    await finishing;
    expect(finalize).toHaveBeenCalledOnce();
  });

  it('refuses native finalization when action persistence is missing', async () => {
    const finalize = vi.fn();
    const { trace } = harness({ finalize });
    const action = deliver(trace);
    trace.cancelAction(action, 'view-unmounted');
    const internal = trace as unknown as {
      actions: Map<string, { persistence?: Promise<unknown> }>;
    };
    internal.actions.get(action.actionId)!.persistence = undefined;

    await expect(trace.finishCapture()).resolves.toMatchObject({
      phase: 'failed',
      errorCode: 'renderer-persistence-missing',
    });
    expect(finalize).not.toHaveBeenCalled();
  });

  it.each([
    { droppedCount: 1, sessionTainted: false },
    { droppedCount: 0, sessionTainted: true },
  ])('refuses native finalization after a lossy append %#', async (loss) => {
    const finalize = vi.fn();
    const { trace } = harness({
      append: async (batch) => ({
        sessionId: batch.sessionId,
        batchSequence: batch.batchSequence,
        actionId: batch.actionId,
        acceptedCount: batch.events.length,
        acceptedByteCount: 100,
        droppedCount: loss.droppedCount,
        closed: true,
        outcomeAccepted: true,
        nativeReceiveRecorded: true,
        nativeReturnRecorded: true,
        sessionTainted: loss.sessionTainted,
      }),
      finalize,
    });
    const action = deliver(trace);
    trace.cancelAction(action, 'view-unmounted');

    await expect(trace.finishCapture()).resolves.toMatchObject({
      phase: 'failed',
      errorCode: 'renderer-persistence-failed',
    });
    expect(finalize).not.toHaveBeenCalled();
  });

  it('shares a double-click flight and caches the sealed receipt', async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const finalize = vi.fn(async () => {
      await pending;
      return {
        sessionId: 'session-a',
        sealed: true,
        openActionCount: 0,
        recordCount: 2,
        eventCount: 2,
        artifactByteCount: 256,
        droppedEventCount: 0,
        lastBatchSequence: 0,
        errorCode: null,
      } as const;
    });
    const { trace } = harness({ finalize });

    const first = trace.finishCapture();
    const second = trace.finishCapture();
    expect(second).toBe(first);
    await Promise.resolve();
    release();
    const sealed = await first;
    expect(finalize).toHaveBeenCalledOnce();
    await expect(trace.finishCapture()).resolves.toBe(sealed);
    expect(finalize).toHaveBeenCalledOnce();
  });

  it('allows only explicit retry for native open-action pending', async () => {
    const finalize = vi
      .fn()
      .mockResolvedValueOnce({
        sessionId: 'session-a',
        sealed: false,
        openActionCount: 1,
        recordCount: 2,
        eventCount: 2,
        artifactByteCount: 256,
        droppedEventCount: 0,
        lastBatchSequence: 0,
        errorCode: 'profiling-actions-open',
      })
      .mockResolvedValueOnce({
        sessionId: 'session-a',
        sealed: true,
        openActionCount: 0,
        recordCount: 3,
        eventCount: 3,
        artifactByteCount: 384,
        droppedEventCount: 0,
        lastBatchSequence: 0,
        errorCode: null,
      });
    const { trace } = harness({ finalize });

    await expect(trace.finishCapture()).resolves.toMatchObject({
      phase: 'native-pending',
      nativeOpenCount: 1,
      retryable: true,
    });
    expect(finalize).toHaveBeenCalledOnce();
    await expect(trace.finishCapture()).resolves.toMatchObject({
      phase: 'sealed',
    });
    expect(finalize).toHaveBeenCalledTimes(2);
  });

  it.each([
    {
      label: 'sealed native loss',
      receipt: { droppedEventCount: 2 },
      phase: 'sealed-with-loss',
    },
    {
      label: 'pre-existing native sequence',
      receipt: { lastBatchSequence: 4 },
      phase: 'continuity-unverified',
    },
  ])('preserves the receipt but does not certify $label', async (example) => {
    const nativeReceipt = {
      sessionId: 'session-a',
      sealed: true,
      openActionCount: 0,
      recordCount: 3,
      eventCount: 3,
      artifactByteCount: 384,
      droppedEventCount: 0,
      lastBatchSequence: 0,
      errorCode: null,
      ...example.receipt,
    };
    const { trace } = harness({
      finalize: async () => nativeReceipt,
    });

    await expect(trace.finishCapture()).resolves.toMatchObject({
      phase: example.phase,
      receipt: nativeReceipt,
    });
  });

  it('keeps native errors and invoke rejection terminal', async () => {
    const nativeFailure = vi.fn(async () => ({
      sessionId: 'session-a',
      sealed: false,
      openActionCount: 0,
      recordCount: 1,
      eventCount: 1,
      artifactByteCount: 128,
      droppedEventCount: 0,
      lastBatchSequence: 0,
      errorCode: 'profiling-seal-write' as const,
    }));
    const failed = harness({ finalize: nativeFailure }).trace;
    await expect(failed.finishCapture()).resolves.toMatchObject({
      phase: 'failed',
      errorCode: 'profiling-seal-write',
    });
    await failed.finishCapture();
    expect(nativeFailure).toHaveBeenCalledOnce();

    const rejected = harness({
      finalize: async () => {
        throw new Error('/private/secret/trace.jsonl');
      },
    }).trace;
    await expect(rejected.finishCapture()).resolves.toMatchObject({
      phase: 'failed',
      errorCode: 'profile-finalize-invoke-failed',
    });
  });
});
