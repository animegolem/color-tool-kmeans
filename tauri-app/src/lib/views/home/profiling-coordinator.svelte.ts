import type {
  AnalysisParams,
  AnalysisResult,
  SelectedImage,
} from '../../stores/ui';
import type { ChartOutput } from '../../exports/chart-save';
import {
  getRendererProfileTrace,
  initializeRendererProfileTrace,
  type ProfileAcceptedResultContext,
  type ProfileActionRef,
  type ProfileControl,
  type ProfileFigure,
  type ProfileRenderExtras,
  type ProfileResolvedSnapshot,
  type ProfileUnavailableSnapshot,
  type RendererProfileTrace,
} from '../../profiling/trace';
import {
  createProfileAnalysisConfig,
  createProfileRenderConfig,
} from '../../profiling/trace-config';
import {
  countProfileFigureSvgRoots,
  profileResultsMatch,
} from '../../profiling/trace-dom';

export interface AnalysisInputDelivery {
  control: ProfileControl;
  rawValue: string;
  targetValue: number | boolean | null;
  deliveredAt: number;
}

export interface ProfilingCoordinatorDeps {
  getFile: () => SelectedImage | null;
  getParams: () => AnalysisParams;
  getDisplayResult: () => AnalysisResult | null;
  getStudyRoot: () => HTMLElement | null;
  getRenderExtras: () => ProfileRenderExtras;
  settle: () => Promise<void>;
  now?: () => number;
  getTrace?: () => RendererProfileTrace | null;
  initializeTrace?: () => Promise<RendererProfileTrace | null>;
}

export function createProfilingCoordinator(deps: ProfilingCoordinatorDeps) {
  let enabled = $state(false);
  let accepted = $state.raw<ProfileAcceptedResultContext | null>(null);
  let activeAction: ProfileActionRef | null = null;
  let profiledFigures: Set<string> | null = null;
  let coordinatedActions: Set<string> | null = null;
  const now = deps.now ?? (() => performance.now());
  const getTrace = deps.getTrace ?? getRendererProfileTrace;
  const initializeTrace =
    deps.initializeTrace ?? initializeRendererProfileTrace;

  async function initialize() {
    try {
      enabled = (await initializeTrace()) !== null;
      profiledFigures = enabled ? new Set<string>() : null;
      coordinatedActions = enabled ? new Set<string>() : null;
    } catch {
      enabled = false;
      profiledFigures = null;
      coordinatedActions = null;
    }
  }

  function snapshot(
    selected: SelectedImage,
    params: AnalysisParams
  ): ProfileResolvedSnapshot {
    if (
      ![
        params.clusters,
        params.quality,
        params.ignoreTopN,
        params.mergeThreshold,
      ].every((value) => typeof value === 'number' && Number.isFinite(value))
    ) {
      throw new Error('profile-analysis-params-invalid');
    }
    return {
      imageRuntimeId: selected.id,
      expectedSourcePath: selected.path ?? '',
      analysisConfig: createProfileAnalysisConfig(params),
      renderConfig: createProfileRenderConfig(params, deps.getRenderExtras()),
    };
  }

  function paramsWithTarget(delivery: AnalysisInputDelivery): AnalysisParams {
    const candidate = { ...deps.getParams() };
    if (delivery.targetValue === null) return candidate;
    if (
      delivery.control === 'snapToReal' &&
      typeof delivery.targetValue === 'boolean'
    ) {
      candidate.snapToReal = delivery.targetValue;
    } else if (
      delivery.control !== 'snapToReal' &&
      typeof delivery.targetValue === 'number'
    ) {
      candidate[delivery.control] = delivery.targetValue;
    }
    return candidate;
  }

  function unavailableSnapshot(
    selected: SelectedImage
  ): ProfileUnavailableSnapshot {
    return {
      imageRuntimeId: selected.id,
      expectedSourcePath: selected.path ?? '',
      renderConfig: createProfileRenderConfig(
        deps.getParams(),
        deps.getRenderExtras()
      ),
      reasonCode: 'input-target-invalid',
    };
  }

  function handleInput(delivery: AnalysisInputDelivery) {
    if (!enabled) return;
    try {
      const selected = deps.getFile();
      const trace = getTrace();
      if (!selected || !trace) return;
      trace.cancelAction(activeAction, 'input-superseded');
      const invalidNumeric =
        delivery.control !== 'snapToReal' && delivery.targetValue === null;
      const unavailable = invalidNumeric
        ? unavailableSnapshot(selected)
        : undefined;
      let candidate: ProfileResolvedSnapshot | undefined;
      try {
        candidate = invalidNumeric
          ? undefined
          : snapshot(selected, paramsWithTarget(delivery));
      } catch {
        activeAction = trace.startDeliveredAction({
          control: delivery.control,
          targetValue: delivery.targetValue,
          imageRuntimeId: selected.id,
          expectedSourcePath: selected.path ?? '',
          deliveredAt: delivery.deliveredAt,
        });
        accepted = null;
        trace.unverifyAction(activeAction, 'result-association-unverified');
        return;
      }
      activeAction = trace.startDeliveredAction({
        control: delivery.control,
        targetValue: delivery.targetValue,
        imageRuntimeId: selected.id,
        expectedSourcePath: selected.path ?? '',
        deliveredAt: delivery.deliveredAt,
        candidateSnapshot: candidate,
        unavailableSnapshot: unavailable,
      });
      accepted = null;
      if (activeAction && unavailable)
        trace.resolveUnavailableDeliveredAction(activeAction, unavailable);
      else if (activeAction && delivery.targetValue === null && candidate)
        trace.resolveDeliveredAction(activeAction, candidate);
    } catch {
      // Observation never changes a valid input delivery.
    }
  }

  function resolveAction(
    selected: SelectedImage,
    params: AnalysisParams
  ): ProfileActionRef | null {
    if (!enabled || !activeAction) return null;
    try {
      const trace = getTrace();
      return trace?.resolveDeliveredAction(
        activeAction,
        snapshot(selected, params)
      )
        ? activeAction
        : null;
    } catch {
      return null;
    }
  }

  function acceptResult(context: ProfileAcceptedResultContext) {
    if (!enabled) return;
    accepted = context;
    activeAction = context.analysis.action;
  }

  function beginFigure(
    figure: ProfileFigure,
    result: AnalysisResult
  ): number | null {
    if (!enabled || !profileResultsMatch(accepted, result)) return null;
    try {
      const key = `${accepted.analysis.action.actionId}:${figure}`;
      if (!profiledFigures || profiledFigures.has(key)) return null;
      return now();
    } catch {
      return null;
    }
  }

  function finishFigure(
    figure: ProfileFigure,
    result: AnalysisResult,
    chart: ChartOutput,
    startedAt: number | null
  ): ChartOutput {
    if (startedAt === null) return chart;
    try {
      const trace = getTrace();
      if (!trace || !profileResultsMatch(accepted, result)) return chart;
      const key = `${accepted.analysis.action.actionId}:${figure}`;
      if (!profiledFigures || profiledFigures.has(key)) return chart;
      profiledFigures.add(key);
      trace.markFigureGenerated(
        accepted,
        figure,
        result,
        createProfileAnalysisConfig(deps.getParams()),
        createProfileRenderConfig(deps.getParams(), deps.getRenderExtras()),
        now() - startedAt
      );
    } catch {
      // Chart generation already succeeded; observer failure stays isolated.
    }
    return chart;
  }

  function coordinate(): void {
    if (!enabled || !accepted) return;
    try {
      const trace = getTrace();
      if (!trace || !profileResultsMatch(accepted, deps.getDisplayResult()))
        return;
      const actionId = accepted.analysis.action.actionId;
      if (!coordinatedActions || coordinatedActions.has(actionId)) return;
      coordinatedActions.add(actionId);
      const params = deps.getParams();
      const figures: ProfileFigure[] = [];
      if (params.showHistogram) figures.push('histogram');
      if (params.showPolarChart) figures.push('polar');
      if (params.showHueLightness) figures.push('hue-lightness');
      void trace
        .coordinateDomRaf2(accepted, {
          enabledFigures: figures,
          activeImageRuntimeId: () => deps.getFile()?.id ?? null,
          currentResult: deps.getDisplayResult,
          currentAnalysisConfig: () =>
            createProfileAnalysisConfig(deps.getParams()),
          currentRenderConfig: () =>
            createProfileRenderConfig(deps.getParams(), deps.getRenderExtras()),
          settle: deps.settle,
          domFigureCounts: () =>
            countProfileFigureSvgRoots(deps.getStudyRoot(), actionId),
        })
        .catch(() => {
          try {
            trace.unverifyAction(activeAction, 'result-association-unverified');
          } catch {
            // Observer failures are not application failures.
          }
        });
    } catch {
      // Observation never changes production rendering.
    }
  }

  function reconcile() {
    if (!enabled || !accepted || !activeAction) return;
    try {
      const selected = deps.getFile();
      const trace = getTrace();
      if (!trace) return;
      if (!selected) {
        cancel('source-replaced');
        return;
      }
      const resolved = trace.resolveDeliveredAction(
        activeAction,
        snapshot(selected, deps.getParams())
      );
      if (
        !resolved ||
        !profileResultsMatch(accepted, deps.getDisplayResult())
      ) {
        trace.unverifyAction(activeAction, 'result-association-unverified');
        accepted = null;
      }
    } catch {
      // The next endpoint check will remain unavailable.
    }
  }

  function cancel(reason: 'source-replaced' | 'view-unmounted') {
    if (!enabled) return;
    try {
      const trace = getTrace();
      trace?.cancelAction(activeAction, reason);
      if (accepted?.analysis.action !== activeAction)
        trace?.cancelAction(accepted?.analysis.action ?? null, reason);
    } catch {
      // Observation never changes production cancellation.
    }
    activeAction = null;
    accepted = null;
  }

  return {
    get enabled() {
      return enabled;
    },
    get acceptedResult() {
      return accepted;
    },
    get profileActionId() {
      return accepted?.analysis.action.actionId ?? null;
    },
    initialize,
    handleInput,
    resolveAction,
    acceptResult,
    beginFigure,
    finishFigure,
    coordinate,
    reconcile,
    cancel,
  };
}
