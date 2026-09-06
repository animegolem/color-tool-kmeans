import type { AnalysisResult } from '../stores/analysis';
import type {
  ProfileAnalysisConfigRecord,
  ProfileObservedOutcome,
  ProfilePrimitive,
  ProfileReasonCode,
  ProfileRenderConfigRecord,
} from '../bridges/profiling';
import { cleanProfileDuration, sameProfileRecord } from './trace-config';
import type {
  ProfileAcceptedResultContext,
  ProfileActionRef,
  ProfileActionState,
  ProfileDomInput,
  ProfileFigure,
} from './trace-types';

const ALL_FIGURES: ProfileFigure[] = ['histogram', 'polar', 'hue-lightness'];

export interface ProfileDomRuntime {
  open: (ref: ProfileActionRef) => ProfileActionState | null;
  mark: (
    action: ProfileActionState,
    type:
      | 'figure_generated'
      | 'enabled_figures_generated'
      | 'dom_settled'
      | 'raf1'
      | 'associated_result_dom_raf2_approx',
    data?: Record<string, ProfilePrimitive>
  ) => number;
  finish: (
    action: ProfileActionState,
    status: ProfileObservedOutcome['status'],
    reason: ProfileReasonCode | null,
    endpoint?: ProfileObservedOutcome['endpoint']
  ) => ProfileObservedOutcome;
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (handle: number) => void;
  visibilityState: () => DocumentVisibilityState;
  subscribeVisibility: (callback: () => void) => () => void;
}

export function profileResultsMatch(
  accepted: ProfileAcceptedResultContext | null,
  displayed: AnalysisResult | null
): boolean {
  return accepted !== null && accepted.result === displayed;
}

export function countProfileFigureSvgRoots(
  root: ParentNode | null,
  actionId: string
): Partial<Record<ProfileFigure, number>> {
  const counts: Partial<Record<ProfileFigure, number>> = {};
  if (!root) return counts;
  const containers = root.querySelectorAll<HTMLElement>(
    '[data-profile-action][data-profile-figure]'
  );
  for (const container of Array.from(containers)) {
    if (container.dataset.profileAction !== actionId) continue;
    const figure = container.dataset.profileFigure as ProfileFigure;
    if (!ALL_FIGURES.includes(figure)) continue;
    const svgRoots = Array.from(container.children).filter(
      (child) => child.tagName.toLowerCase() === 'svg'
    ).length;
    counts[figure] = (counts[figure] ?? 0) + svgRoots;
  }
  return counts;
}

export function markProfileFigureGenerated(
  runtime: ProfileDomRuntime,
  accepted: ProfileAcceptedResultContext,
  figure: ProfileFigure,
  result: AnalysisResult,
  analysisConfig: ProfileAnalysisConfigRecord,
  renderConfig: ProfileRenderConfigRecord,
  durationMs: number
): boolean {
  const action = runtime.open(accepted.analysis.action);
  if (!action) return false;
  action.checks.acceptedResultObjectMatches =
    action.acceptedResult === accepted.result && result === accepted.result;
  action.checks.analysisConfigMatches = sameProfileRecord(
    action.analysisConfig ?? {},
    analysisConfig
  );
  action.checks.renderConfigMatches = sameProfileRecord(
    action.renderConfig ?? {},
    renderConfig
  );
  action.generatedFigures.add(figure);
  runtime.mark(action, 'figure_generated', {
    figure,
    durationMs: cleanProfileDuration(durationMs),
  });
  return (
    action.checks.acceptedResultObjectMatches &&
    action.checks.analysisConfigMatches &&
    action.checks.renderConfigMatches
  );
}

export async function coordinateProfileDomRaf2(
  runtime: ProfileDomRuntime,
  accepted: ProfileAcceptedResultContext,
  input: ProfileDomInput
): Promise<ProfileObservedOutcome | null> {
  const action = runtime.open(accepted.analysis.action);
  if (!action) return null;
  action.enabledFigures = new Set(input.enabledFigures);
  if (action.enabledFigures.size === 0)
    return runtime.finish(action, 'unverified', 'no-enabled-figures');
  const generatedMatches = ALL_FIGURES.every(
    (figure) =>
      action.generatedFigures.has(figure) === action.enabledFigures?.has(figure)
  );
  action.checks.enabledFiguresMatch = generatedMatches;
  if (!generatedMatches)
    return runtime.finish(
      action,
      'unverified',
      'result-association-unverified'
    );
  const figuresAt = runtime.mark(action, 'enabled_figures_generated', {
    count: action.enabledFigures.size,
  });
  action.measurements.input_to_enabled_figures_generated_ms =
    cleanProfileDuration(figuresAt - action.events[0].rendererMs);
  await input.settle();
  if (!runtime.open(action.ref)) return action.outcome ?? null;
  if (!associationCurrent(action, accepted, input))
    return runtime.finish(
      action,
      'unverified',
      'result-association-unverified'
    );
  if (runtime.visibilityState() !== 'visible')
    return runtime.finish(action, 'unverified', 'hidden-before-dom-raf2');
  action.checks.visibleAtDomSettle = true;
  const counts = input.domFigureCounts();
  const domMatches = ALL_FIGURES.every(
    (figure) =>
      (counts[figure] ?? 0) === (action.enabledFigures?.has(figure) ? 1 : 0)
  );
  action.checks.domFiguresMatch = domMatches;
  if (!domMatches)
    return runtime.finish(action, 'unverified', 'dom-figure-mismatch');
  const domAt = runtime.mark(action, 'dom_settled');
  action.measurements.input_to_dom_settled_ms = cleanProfileDuration(
    domAt - action.events[0].rendererMs
  );
  action.visibilityCleanup = runtime.subscribeVisibility(() => {
    if (runtime.visibilityState() !== 'visible')
      runtime.finish(action, 'unverified', 'hidden-before-dom-raf2');
  });
  if (!(await waitForFrame(runtime, action, 'visibleAtRaf1')))
    return action.outcome ?? null;
  runtime.mark(action, 'raf1');
  if (!associationCurrent(action, accepted, input))
    return runtime.finish(
      action,
      'unverified',
      'result-association-unverified'
    );
  if (!(await waitForFrame(runtime, action, 'visibleAtRaf2')))
    return action.outcome ?? null;
  if (!associationCurrent(action, accepted, input))
    return runtime.finish(
      action,
      'unverified',
      'result-association-unverified'
    );
  const raf2At = runtime.mark(action, 'associated_result_dom_raf2_approx');
  action.measurements.input_to_associated_result_dom_raf2_approx_ms =
    cleanProfileDuration(raf2At - action.events[0].rendererMs);
  return runtime.finish(
    action,
    'completed',
    null,
    'associated_result_dom_raf2_approx'
  );
}

function associationCurrent(
  action: ProfileActionState,
  accepted: ProfileAcceptedResultContext,
  input: ProfileDomInput
): boolean {
  const activeImageMatches =
    input.activeImageRuntimeId() === action.imageRuntimeId;
  const resultMatches = profileResultsMatch(accepted, input.currentResult());
  const analysisMatches = sameProfileRecord(
    input.currentAnalysisConfig(),
    action.analysisConfig ?? {}
  );
  const renderMatches = sameProfileRecord(
    input.currentRenderConfig(),
    action.renderConfig ?? {}
  );
  Object.assign(action.checks, {
    activeImageMatchesAdmitted: activeImageMatches,
    acceptedResultObjectMatches: resultMatches,
    analysisConfigMatches: analysisMatches,
    renderConfigMatches: renderMatches,
  });
  return (
    activeImageMatches &&
    resultMatches &&
    analysisMatches &&
    renderMatches &&
    action.checks.actualPathMatchesExpected === true &&
    action.checks.nativeRequestMatchesAdmitted === true &&
    action.checks.storeReceiptAccepted === true
  );
}

function waitForFrame(
  runtime: ProfileDomRuntime,
  action: ProfileActionState,
  check: 'visibleAtRaf1' | 'visibleAtRaf2'
): Promise<boolean> {
  return new Promise((resolve) => {
    action.rafResolve = resolve;
    action.rafHandle = runtime.requestFrame(() => {
      action.rafHandle = undefined;
      action.rafResolve = undefined;
      const visible = runtime.visibilityState() === 'visible';
      action.checks[check] = visible;
      resolve(visible && !action.outcome);
      if (!visible)
        runtime.finish(action, 'unverified', 'hidden-before-dom-raf2');
    });
  });
}
