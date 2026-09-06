import { describe, expect, it } from 'vitest';
import { countProfileFigureSvgRoots } from './trace-dom';
import {
  PROFILE_TEST_RESULT,
  admitProfileTestAction,
  createProfileTraceHarness,
  deliverProfileTestAction,
  profileTestSnapshot,
} from './trace-fixtures';

function acceptedHarness() {
  const harness = createProfileTraceHarness();
  const action = deliverProfileTestAction(harness.trace);
  const analysis = admitProfileTestAction(harness.trace, action);
  const accepted = harness.trace.markStoreSuccess(
    analysis,
    PROFILE_TEST_RESULT,
    { status: 'accepted' }
  )!;
  const resolved = profileTestSnapshot();
  harness.trace.markFigureGenerated(
    accepted,
    'histogram',
    PROFILE_TEST_RESULT,
    resolved.analysisConfig,
    resolved.renderConfig,
    1
  );
  return { ...harness, action, accepted, resolved };
}

function domInput(resolved: ReturnType<typeof profileTestSnapshot>) {
  return {
    enabledFigures: ['histogram'] as const,
    activeImageRuntimeId: () => 'image-a',
    currentResult: () => PROFILE_TEST_RESULT,
    currentAnalysisConfig: () => resolved.analysisConfig,
    currentRenderConfig: () => resolved.renderConfig,
    settle: async () => undefined,
    domFigureCounts: () => ({ histogram: 1 }),
  };
}

describe('profile DOM and RAF association', () => {
  it('counts actual direct SVG roots, not tagged empty containers', () => {
    const containers = [
      {
        dataset: { profileAction: 'action-a', profileFigure: 'histogram' },
        children: [],
      },
      {
        dataset: { profileAction: 'action-a', profileFigure: 'polar' },
        children: [{ tagName: 'svg' }, { tagName: 'span' }],
      },
      {
        dataset: { profileAction: 'old-action', profileFigure: 'histogram' },
        children: [{ tagName: 'svg' }],
      },
    ];
    const root = {
      querySelectorAll: () => containers,
    } as unknown as ParentNode;

    expect(countProfileFigureSvgRoots(root, 'action-a')).toEqual({
      histogram: 0,
      polar: 1,
    });
  });

  it('cannot start DOM coordination after unmount just after store acceptance', async () => {
    const { trace, action, accepted, resolved } = acceptedHarness();
    trace.cancelAction(action, 'view-unmounted');

    expect(
      await trace.coordinateDomRaf2(accepted, domInput(resolved))
    ).toBeNull();
    expect(trace.getOutcome(action)).toMatchObject({
      status: 'cancelled',
      reasonCode: 'view-unmounted',
    });
  });

  it('revokes an action while its Svelte tick seam is pending', async () => {
    const { trace, action, accepted, resolved } = acceptedHarness();
    let releaseTick: (() => void) | undefined;
    const completion = trace.coordinateDomRaf2(accepted, {
      ...domInput(resolved),
      settle: () =>
        new Promise<void>((resolve) => {
          releaseTick = resolve;
        }),
    });
    await Promise.resolve();
    trace.cancelAction(action, 'view-unmounted');
    releaseTick?.();

    expect(await completion).toMatchObject({
      status: 'cancelled',
      reasonCode: 'view-unmounted',
    });
  });

  it('keeps Finish pending through a DOM tick until ordinary unmount closes it', async () => {
    const { trace, action, accepted, resolved } = acceptedHarness();
    let releaseTick: (() => void) | undefined;
    const completion = trace.coordinateDomRaf2(accepted, {
      ...domInput(resolved),
      settle: () =>
        new Promise<void>((resolve) => {
          releaseTick = resolve;
        }),
    });
    await Promise.resolve();

    await expect(trace.finishCapture()).resolves.toMatchObject({
      phase: 'renderer-pending',
      rendererOpenCount: 1,
    });
    trace.cancelAction(action, 'view-unmounted');
    releaseTick?.();
    await completion;
    await expect(trace.finishCapture()).resolves.toMatchObject({
      phase: 'sealed',
    });
  });

  it('cancels without late completion between the two RAF callbacks', async () => {
    const { trace, frames, action, accepted, resolved } = acceptedHarness();
    const completion = trace.coordinateDomRaf2(accepted, domInput(resolved));
    await Promise.resolve();
    frames.shift()?.(1);
    await Promise.resolve();

    trace.cancelAction(action, 'view-unmounted');
    frames.shift()?.(2);

    expect(await completion).toMatchObject({
      status: 'cancelled',
      reasonCode: 'view-unmounted',
    });
    expect(trace.getOutcome(action)).toMatchObject({
      status: 'cancelled',
      reasonCode: 'view-unmounted',
    });
  });

  it.each(['source', 'settings', 'result'] as const)(
    'withholds completion for $change replacement between RAFs',
    async (change) => {
      const { trace, frames, accepted, resolved } = acceptedHarness();
      let imageId = 'image-a';
      let result = PROFILE_TEST_RESULT;
      let analysis = resolved.analysisConfig;
      const completion = trace.coordinateDomRaf2(accepted, {
        ...domInput(resolved),
        activeImageRuntimeId: () => imageId,
        currentResult: () => result,
        currentAnalysisConfig: () => analysis,
      });
      await Promise.resolve();
      frames.shift()?.(1);
      await Promise.resolve();
      if (change === 'source') imageId = 'image-b';
      if (change === 'settings') analysis = { ...analysis, clusters: 47 };
      if (change === 'result') result = { ...result };
      frames.shift()?.(2);

      expect(await completion).toMatchObject({
        status: 'unverified',
        reasonCode: 'result-association-unverified',
      });
    }
  );
});
