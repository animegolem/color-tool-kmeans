import type { AnalysisResult } from '../stores/analysis';
import {
  appendProfileBatch,
  finalizeProfileSession,
  getProfileStatus,
  profileAppendValidationErrorCode,
  type ProfileAnalysisConfigRecord,
  type ProfileEventType,
  type ProfileInputRecord,
  type ProfileObservedOutcome,
  type ProfilePrimitive,
  type ProfileReasonCode,
  type ProfileRenderConfigRecord,
  type ProfileRendererBatch,
  type ProfileRendererEvent,
  type ProfileStatus,
} from '../bridges/profiling';
import {
  cleanProfileDuration,
  createProfileAnalysisConfig,
  createProfileNativeRequest,
  createProfileRenderConfig,
  sameProfileRecord,
} from './trace-config';
import {
  coordinateProfileDomRaf2,
  markProfileFigureGenerated,
  type ProfileDomRuntime,
} from './trace-dom';
import type {
  ProfileAcceptedResultContext,
  ProfileActionRef,
  ProfileActionState,
  ProfileAnalysisContext,
  ProfileCancellationReason,
  ProfileControl,
  ProfileDomInput,
  ProfileFailureReason,
  ProfileFigure,
  ProfileFinishErrorCode,
  ProfileFinishState,
  ProfileInvocationContext,
  ProfileNativeRequestSettings,
  ProfilePersistenceResult,
  ProfileResolvedSnapshot,
  ProfileUnverifiedReason,
  ProfileUnavailableSnapshot,
  RendererTraceOptions,
} from './trace-types';

export * from './trace-config';
export * from './trace-types';
export const PROFILE_MAX_ACTIONS = 64;
export const PROFILE_MAX_ACTIVE_ACTIONS = 16;
export const PROFILE_MAX_EVENTS_PER_ACTION = 48;
export const PROFILE_MAX_BYTES_PER_ACTION = 24 * 1024;
const CLOSURE_EVENT_RESERVE = 1;
const CLOSURE_BYTE_RESERVE = 2048;

function defaultRequestFrame(callback: FrameRequestCallback): number {
  return requestAnimationFrame(callback);
}

function defaultSubscribeVisibility(callback: () => void): () => void {
  document.addEventListener('visibilitychange', callback);
  return () => document.removeEventListener('visibilitychange', callback);
}

export class RendererProfileTrace {
  private readonly status: ProfileStatus;
  private readonly clockId: string;
  private readonly now: () => number;
  private readonly nextId: () => string;
  private readonly append: typeof appendProfileBatch;
  private readonly finalize: typeof finalizeProfileSession;
  private readonly requestFrame: (callback: FrameRequestCallback) => number;
  private readonly cancelFrame: (handle: number) => void;
  private readonly visibilityState: () => DocumentVisibilityState;
  private readonly subscribeVisibility: (callback: () => void) => () => void;
  private readonly actions = new Map<string, ProfileActionState>();
  private actionSequence = 0;
  private batchSequence = 0;
  private sessionDroppedEvents = 0;
  private acceptingActions = true;
  private appendTail: Promise<void> = Promise.resolve();
  private persistenceFailure: ProfilePersistenceResult['errorCode'] = null;
  private finishInFlight: Promise<ProfileFinishState> | null = null;
  private terminalFinish: ProfileFinishState | null = null;

  constructor(options: RendererTraceOptions) {
    if (!options.status.enabled || !options.status.sessionId) {
      throw new Error('profile-trace-requires-enabled-status');
    }
    this.status = options.status;
    const clockNonce =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    this.clockId = `renderer-${options.status.sessionId}-${clockNonce}`;
    this.now = options.now ?? (() => performance.now());
    this.nextId = options.nextId ?? (() => String(++this.actionSequence));
    this.append = options.append ?? appendProfileBatch;
    this.finalize = options.finalize ?? finalizeProfileSession;
    this.requestFrame = options.requestFrame ?? defaultRequestFrame;
    this.cancelFrame = options.cancelFrame ?? cancelAnimationFrame;
    this.visibilityState =
      options.visibilityState ?? (() => document.visibilityState);
    this.subscribeVisibility =
      options.subscribeVisibility ?? defaultSubscribeVisibility;
  }

  startDeliveredAction(input: {
    control: ProfileControl;
    targetValue: number | boolean | null;
    imageRuntimeId: string;
    expectedSourcePath: string;
    deliveredAt?: number;
    candidateSnapshot?: ProfileResolvedSnapshot;
    unavailableSnapshot?: ProfileUnavailableSnapshot;
  }): ProfileActionRef | null {
    if (!this.acceptingActions) return null;
    for (const action of this.actions.values()) {
      if (!action.outcome) {
        this.finish(action, 'cancelled', 'input-superseded');
      }
    }
    if (
      this.actions.size >= PROFILE_MAX_ACTIONS ||
      this.activeCount() >= PROFILE_MAX_ACTIVE_ACTIONS
    ) {
      this.sessionDroppedEvents += 1;
      return null;
    }
    const targetState =
      typeof input.targetValue === 'boolean'
        ? 'boolean'
        : typeof input.targetValue === 'number' &&
            Number.isFinite(input.targetValue)
          ? 'number'
          : 'invalid-or-empty';
    const ref = Object.freeze({
      sessionId: this.status.sessionId as string,
      actionId: `${this.clockId}:action-${this.nextId()}`,
      rendererClockId: this.clockId,
    });
    const target: ProfileInputRecord = {
      control: input.control,
      targetState,
      ...(targetState === 'number'
        ? { targetNumber: input.targetValue as number }
        : {}),
      ...(targetState === 'boolean'
        ? { targetBoolean: input.targetValue as boolean }
        : {}),
    };
    const action: ProfileActionState = {
      ref,
      input: target,
      imageRuntimeId: input.imageRuntimeId,
      expectedSourcePath: input.expectedSourcePath,
      ...(input.candidateSnapshot
        ? {
            analysisConfig: Object.freeze({
              ...input.candidateSnapshot.analysisConfig,
            }),
            renderConfig: Object.freeze({
              ...input.candidateSnapshot.renderConfig,
            }),
          }
        : {}),
      ...(input.unavailableSnapshot
        ? {
            analysisConfigUnavailableReason:
              input.unavailableSnapshot.reasonCode,
            renderConfig: Object.freeze({
              ...input.unavailableSnapshot.renderConfig,
            }),
          }
        : {}),
      events: [],
      eventBytes: 0,
      droppedEvents: 0,
      admitted: false,
      generatedFigures: new Set(),
      checks: {},
      measurements: {},
    };
    this.actions.set(ref.actionId, action);
    this.mark(
      action,
      'delivered_input',
      {
        control: input.control,
        targetState,
        ...(target.targetNumber === undefined
          ? {}
          : { targetNumber: target.targetNumber }),
        ...(target.targetBoolean === undefined
          ? {}
          : { targetBoolean: target.targetBoolean }),
      },
      input.deliveredAt
    );
    if (this.actions.size === PROFILE_MAX_ACTIONS) {
      action.droppedEvents += 1;
      this.sessionDroppedEvents += 1;
      if (action.analysisConfigUnavailableReason) {
        delete action.analysisConfigUnavailableReason;
      }
      this.finish(action, 'unverified', 'trace-dropped');
      return null;
    }
    return ref;
  }

  resolveDeliveredAction(
    ref: ProfileActionRef,
    snapshot: ProfileResolvedSnapshot
  ): boolean {
    const action = this.open(ref);
    if (!action) return false;
    if (action.requestKey !== undefined || action.admitted) {
      const sourceMatches =
        action.imageRuntimeId === snapshot.imageRuntimeId &&
        action.expectedSourcePath === snapshot.expectedSourcePath;
      const targetMatches =
        this.targetMatches(action.input, snapshot.analysisConfig) &&
        sameProfileRecord(
          action.analysisConfig ?? {},
          snapshot.analysisConfig
        ) &&
        sameProfileRecord(action.renderConfig ?? {}, snapshot.renderConfig);
      if (!sourceMatches) this.finish(action, 'cancelled', 'source-replaced');
      else if (!targetMatches)
        this.finish(action, 'unverified', 'result-association-unverified');
      return sourceMatches && targetMatches;
    }
    action.analysisConfig = Object.freeze({ ...snapshot.analysisConfig });
    action.renderConfig = Object.freeze({ ...snapshot.renderConfig });
    const sourceMatches =
      action.imageRuntimeId === snapshot.imageRuntimeId &&
      action.expectedSourcePath === snapshot.expectedSourcePath;
    const targetMatches = this.targetMatches(
      action.input,
      snapshot.analysisConfig
    );
    action.checks.inputTargetResolved = targetMatches;
    this.mark(action, 'input_resolved', { sourceMatches, targetMatches });
    if (!sourceMatches) this.finish(action, 'cancelled', 'source-replaced');
    else if (action.input.targetState === 'invalid-or-empty')
      this.finish(action, 'unverified', 'input-target-invalid');
    else if (!targetMatches)
      this.finish(action, 'unverified', 'input-value-unresolved');
    return sourceMatches && targetMatches;
  }

  resolveUnavailableDeliveredAction(
    ref: ProfileActionRef,
    snapshot: ProfileUnavailableSnapshot
  ): boolean {
    const action = this.open(ref);
    if (
      !action ||
      action.input.targetState !== 'invalid-or-empty' ||
      action.input.control === 'snapToReal' ||
      snapshot.reasonCode !== 'input-target-invalid'
    ) {
      return false;
    }
    action.analysisConfigUnavailableReason = snapshot.reasonCode;
    action.renderConfig = Object.freeze({ ...snapshot.renderConfig });
    const sourceMatches =
      action.imageRuntimeId === snapshot.imageRuntimeId &&
      action.expectedSourcePath === snapshot.expectedSourcePath;
    action.checks.inputTargetResolved = false;
    this.mark(action, 'input_resolved', {
      sourceMatches,
      targetMatches: false,
    });
    if (!sourceMatches) this.finish(action, 'cancelled', 'source-replaced');
    else this.finish(action, 'unverified', 'input-target-invalid');
    return sourceMatches;
  }

  observeSchedule(
    ref: ProfileActionRef,
    requestKey: string,
    productionDeduped: boolean
  ): 'bound' | 'repeated' | 'closed' {
    const action = this.open(ref);
    if (!action) return 'closed';
    if (action.requestKey === requestKey) {
      this.mark(action, 'schedule_observed', { disposition: 'repeated' });
      return 'repeated';
    }
    this.mark(action, 'schedule_observed', {
      disposition: productionDeduped ? 'deduped' : 'bound',
    });
    if (productionDeduped) {
      this.finish(action, 'deduped', 'request-key-unchanged');
      return 'closed';
    }
    action.requestKey = requestKey;
    return 'bound';
  }

  admitAction(
    ref: ProfileActionRef,
    nativeRequest: ProfileNativeRequestSettings
  ): ProfileAnalysisContext | null {
    const action = this.open(ref);
    if (!action || !action.analysisConfig || !action.renderConfig) return null;
    action.admitted = true;
    action.nativeRequest = Object.freeze({ ...nativeRequest });
    const at = this.mark(action, 'request_admitted');
    action.measurements.input_to_request_admitted_ms = cleanProfileDuration(
      at - action.events[0].rendererMs
    );
    return Object.freeze({
      action: action.ref,
      expectedSourcePath: action.expectedSourcePath,
      nativeRequest: action.nativeRequest,
    });
  }

  nativeInvocationContext(
    context: ProfileAnalysisContext | null
  ): ProfileInvocationContext | undefined {
    if (!context || !this.open(context.action)) return undefined;
    return {
      sessionId: context.action.sessionId,
      actionId: context.action.actionId,
      rendererClockId: context.action.rendererClockId,
    };
  }

  markNativeIssue(
    context: ProfileAnalysisContext,
    actualSourcePath: string,
    actualRequest: ProfileNativeRequestSettings
  ): void {
    const action = this.open(context.action);
    if (!action) return;
    action.checks.actualPathMatchesExpected =
      actualSourcePath === context.expectedSourcePath;
    action.checks.nativeRequestMatchesAdmitted = sameProfileRecord(
      actualRequest,
      context.nativeRequest
    );
    action.invokeStartMs = this.mark(action, 'renderer_native_issue', {
      pathMatches: action.checks.actualPathMatchesExpected,
      requestMatches: action.checks.nativeRequestMatchesAdmitted,
    });
  }

  markNativeSettle(context: ProfileAnalysisContext, ok: boolean): void {
    const action = this.open(context.action);
    if (!action) return;
    const at = this.mark(action, 'renderer_native_settle', { ok });
    if (action.invokeStartMs !== undefined) {
      action.measurements.renderer_native_roundtrip_ms = cleanProfileDuration(
        at - action.invokeStartMs
      );
    }
  }

  markResponseParsed(context: ProfileAnalysisContext): void {
    const action = this.open(context.action);
    if (action) this.mark(action, 'renderer_response_parsed');
  }

  markStoreSuccess(
    context: ProfileAnalysisContext,
    result: AnalysisResult,
    receipt: { status: 'accepted' | 'stale-token' }
  ): ProfileAcceptedResultContext | null {
    const action = this.open(context.action);
    if (!action) return null;
    const accepted = receipt.status === 'accepted';
    action.checks.storeReceiptAccepted = accepted;
    const at = this.mark(
      action,
      accepted ? 'store_accepted' : 'store_rejected'
    );
    if (!accepted) {
      this.finish(action, 'stale', 'store-token-rejected');
      return null;
    }
    action.acceptedResult = result;
    action.measurements.input_to_store_accepted_ms = cleanProfileDuration(
      at - action.events[0].rendererMs
    );
    action.measurements.run_kmeans_ms = cleanProfileDuration(result.durationMs);
    return Object.freeze({
      analysis: context,
      result,
      resultObservationId: `${action.ref.actionId}:result`,
    });
  }

  markStoreError(
    context: ProfileAnalysisContext,
    receipt: { status: 'accepted-error' | 'stale-token' },
    failure: Exclude<ProfileFailureReason, 'accepted-error'>
  ): void {
    const action = this.open(context.action);
    if (!action) return;
    const accepted = receipt.status === 'accepted-error';
    action.checks.storeReceiptAccepted = accepted;
    this.mark(action, accepted ? 'store_accepted' : 'store_rejected', {
      error: true,
    });
    this.finish(
      action,
      accepted ? 'failed' : 'stale',
      accepted ? failure : 'store-token-rejected'
    );
  }

  markFigureGenerated(
    accepted: ProfileAcceptedResultContext,
    figure: ProfileFigure,
    result: AnalysisResult,
    analysisConfig: ProfileAnalysisConfigRecord,
    renderConfig: ProfileRenderConfigRecord,
    durationMs: number
  ): boolean {
    return markProfileFigureGenerated(
      this.domRuntime(),
      accepted,
      figure,
      result,
      analysisConfig,
      renderConfig,
      durationMs
    );
  }

  async coordinateDomRaf2(
    accepted: ProfileAcceptedResultContext,
    input: ProfileDomInput
  ): Promise<ProfileObservedOutcome | null> {
    return coordinateProfileDomRaf2(this.domRuntime(), accepted, input);
  }

  cancelAction(
    ref: ProfileActionRef | null,
    reason: ProfileCancellationReason
  ) {
    const action = ref ? this.open(ref) : null;
    return action ? this.finish(action, 'cancelled', reason) : null;
  }

  staleAction(
    ref: ProfileActionRef | null,
    reason: 'runner-token-mismatch' | 'store-token-rejected'
  ) {
    const action = ref ? this.open(ref) : null;
    return action ? this.finish(action, 'stale', reason) : null;
  }

  failAction(ref: ProfileActionRef | null, reason: ProfileFailureReason) {
    const action = ref ? this.open(ref) : null;
    return action ? this.finish(action, 'failed', reason) : null;
  }

  cacheAction(ref: ProfileActionRef | null) {
    const action = ref ? this.open(ref) : null;
    return action
      ? this.finish(action, 'cache', 'cache-parameters-unbound')
      : null;
  }

  unverifyAction(
    ref: ProfileActionRef | null,
    reason: ProfileUnverifiedReason
  ) {
    const action = ref ? this.open(ref) : null;
    return action ? this.finish(action, 'unverified', reason) : null;
  }

  getPersistence(
    ref: ProfileActionRef
  ): Promise<ProfilePersistenceResult> | null {
    return this.actions.get(ref.actionId)?.persistence ?? null;
  }

  getOutcome(ref: ProfileActionRef): ProfileObservedOutcome | null {
    return this.actions.get(ref.actionId)?.outcome ?? null;
  }

  finishCapture(): Promise<ProfileFinishState> {
    if (this.terminalFinish) return Promise.resolve(this.terminalFinish);
    if (this.finishInFlight) return this.finishInFlight;
    this.acceptingActions = false;
    const operation = this.runFinishCapture();
    this.finishInFlight = operation;
    void operation.finally(() => {
      if (this.finishInFlight === operation) this.finishInFlight = null;
    });
    return operation;
  }

  private domRuntime(): ProfileDomRuntime {
    return {
      open: (ref) => this.open(ref),
      mark: (action, type, data) => this.mark(action, type, data),
      finish: (action, status, reason, endpoint) =>
        this.finish(action, status, reason, endpoint),
      requestFrame: this.requestFrame,
      cancelFrame: this.cancelFrame,
      visibilityState: this.visibilityState,
      subscribeVisibility: this.subscribeVisibility,
    };
  }

  private targetMatches(
    input: ProfileInputRecord,
    config: ProfileAnalysisConfigRecord
  ): boolean {
    if (input.targetState === 'boolean')
      return (
        input.control === 'snapToReal' &&
        input.targetBoolean === config.snapToReal
      );
    if (input.targetState !== 'number') return false;
    const values: Record<string, number> = {
      clusters: config.clusters,
      quality: config.quality,
      ignoreTopN: config.ignoreTopN,
      mergeThreshold: config.mergeThreshold,
    };
    return values[input.control] === input.targetNumber;
  }

  private activeCount(): number {
    let count = 0;
    for (const action of this.actions.values()) if (!action.outcome) count += 1;
    return count;
  }

  private open(ref: ProfileActionRef): ProfileActionState | null {
    const action = this.actions.get(ref.actionId);
    return action && action.ref === ref && !action.outcome ? action : null;
  }

  private mark(
    action: ProfileActionState,
    type: ProfileEventType,
    data?: Record<string, ProfilePrimitive>,
    at?: number
  ): number {
    const rendererMs = cleanProfileDuration(at ?? this.now());
    const event: ProfileRendererEvent = {
      type,
      actionId: action.ref.actionId,
      clockId: action.ref.rendererClockId,
      rendererMs,
      ...(data ? { data } : {}),
    };
    const bytes = new TextEncoder().encode(JSON.stringify(event)).byteLength;
    const maxEvents = Math.min(
      PROFILE_MAX_EVENTS_PER_ACTION,
      this.status.maxBatchEvents
    );
    const maxBytes = Math.min(
      PROFILE_MAX_BYTES_PER_ACTION,
      this.status.maxBatchBytes
    );
    const closure = type === 'action_outcome';
    if (
      action.events.length >=
        maxEvents - (closure ? 0 : CLOSURE_EVENT_RESERVE) ||
      action.eventBytes + bytes >
        maxBytes - (closure ? 0 : CLOSURE_BYTE_RESERVE)
    ) {
      action.droppedEvents += 1;
      this.sessionDroppedEvents += 1;
      return rendererMs;
    }
    action.events.push(event);
    action.eventBytes += bytes;
    return rendererMs;
  }

  private finish(
    action: ProfileActionState,
    status: ProfileObservedOutcome['status'],
    reasonCode: ProfileReasonCode | null,
    endpoint: ProfileObservedOutcome['endpoint'] = null
  ): ProfileObservedOutcome {
    if (action.outcome) return action.outcome;
    if (action.droppedEvents > 0 && status === 'completed') {
      status = 'unverified';
      reasonCode = 'trace-dropped';
      endpoint = null;
    }
    if (action.rafHandle !== undefined) this.cancelFrame(action.rafHandle);
    action.rafHandle = undefined;
    action.rafResolve?.(false);
    action.rafResolve = undefined;
    action.visibilityCleanup?.();
    action.visibilityCleanup = undefined;
    const outcome = Object.freeze({
      status,
      reasonCode,
      endpoint,
      rendererMs: cleanProfileDuration(this.now()),
      freshExecution:
        status === 'deduped' || status === 'cache' || !action.admitted
          ? false
          : null,
      associationChecks: Object.freeze({ ...action.checks }),
      measurements: Object.freeze({ ...action.measurements }),
    }) satisfies ProfileObservedOutcome;
    action.outcome = outcome;
    this.mark(action, 'action_outcome', {
      status,
      reasonCode,
      endpoint,
    });
    action.persistence = this.flush(action);
    return outcome;
  }

  private async flush(
    action: ProfileActionState
  ): Promise<ProfilePersistenceResult> {
    if (
      (!action.analysisConfig && !action.analysisConfigUnavailableReason) ||
      !action.renderConfig
    ) {
      return { ok: false, receipt: null, errorCode: 'trace-flush-failed' };
    }
    const batch: ProfileRendererBatch = {
      sessionId: action.ref.sessionId,
      batchSequence: ++this.batchSequence,
      actionId: action.ref.actionId,
      rendererProcessClockId: action.ref.rendererClockId,
      events: action.events.slice(),
      observedOutcome: action.outcome as ProfileObservedOutcome,
      rendererDroppedEventCount: action.droppedEvents,
      analysisConfig: action.analysisConfig
        ? { state: 'resolved', value: action.analysisConfig }
        : {
            state: 'unavailable',
            reasonCode:
              action.analysisConfigUnavailableReason as 'input-target-invalid',
          },
      renderConfig: action.renderConfig,
      input: action.input,
      imageRuntimeId: action.imageRuntimeId,
    };
    const persistence = this.appendTail.then(
      () => this.persistBatch(batch, action),
      () => this.persistBatch(batch, action)
    );
    this.appendTail = persistence.then(
      () => undefined,
      () => undefined
    );
    return persistence;
  }

  private async persistBatch(
    batch: ProfileRendererBatch,
    action: ProfileActionState
  ): Promise<ProfilePersistenceResult> {
    let result: ProfilePersistenceResult;
    try {
      const receipt = await this.append(batch, this.status);
      const dropped =
        receipt.droppedCount > 0 ||
        receipt.sessionTainted ||
        !receipt.outcomeAccepted ||
        receipt.acceptedCount !== batch.events.length;
      const missingNative =
        action.outcome?.status === 'completed' &&
        (!receipt.nativeReceiveRecorded || !receipt.nativeReturnRecorded);
      result = {
        ok: !dropped && !missingNative,
        receipt,
        errorCode: dropped
          ? 'trace-dropped'
          : missingNative
            ? 'session-lost'
            : null,
      };
    } catch (error) {
      result = {
        ok: false,
        receipt: null,
        errorCode:
          profileAppendValidationErrorCode(error) ?? 'trace-flush-failed',
      };
    }
    if (!result.ok && !this.persistenceFailure) {
      this.persistenceFailure = result.errorCode ?? 'trace-flush-failed';
    }
    return result;
  }

  private finishState(
    phase: ProfileFinishState['phase'],
    options: {
      rendererOpenCount?: number;
      nativeOpenCount?: number;
      errorCode?: ProfileFinishErrorCode | null;
      receipt?: import('../bridges/profiling').ProfileFinalizeReceipt | null;
      retryable?: boolean;
    } = {}
  ): ProfileFinishState {
    return Object.freeze({
      phase,
      rendererOpenCount: options.rendererOpenCount ?? 0,
      nativeOpenCount: options.nativeOpenCount ?? 0,
      errorCode: options.errorCode ?? null,
      receipt: options.receipt ?? null,
      retryable: options.retryable ?? false,
    });
  }

  private failFinish(errorCode: ProfileFinishErrorCode): ProfileFinishState {
    const state = this.finishState('failed', { errorCode });
    this.terminalFinish = state;
    return state;
  }

  private async runFinishCapture(): Promise<ProfileFinishState> {
    const rendererOpenCount = this.activeCount();
    if (rendererOpenCount > 0) {
      return this.finishState('renderer-pending', {
        rendererOpenCount,
        errorCode: 'renderer-actions-open',
        retryable: true,
      });
    }
    const persistences: Promise<ProfilePersistenceResult>[] = [];
    for (const action of this.actions.values()) {
      if (!action.outcome || !action.persistence) {
        return this.failFinish('renderer-persistence-missing');
      }
      persistences.push(action.persistence);
    }
    const drainedBatchSequence = this.batchSequence;
    const results = await Promise.all(persistences);
    await this.appendTail;
    if (this.activeCount() > 0 || this.actions.size !== results.length) {
      return this.failFinish('renderer-persistence-missing');
    }
    if (this.sessionDroppedEvents > 0) {
      return this.failFinish('renderer-trace-dropped');
    }
    if (this.persistenceFailure || results.some((result) => !result.ok)) {
      return this.failFinish('renderer-persistence-failed');
    }

    let receipt: import('../bridges/profiling').ProfileFinalizeReceipt;
    try {
      receipt = await this.finalize(this.status.sessionId as string);
    } catch (error) {
      return this.failFinish(
        error instanceof Error &&
          error.message === 'profile-finalize-receipt-invalid'
          ? 'profile-finalize-receipt-invalid'
          : 'profile-finalize-invoke-failed'
      );
    }
    if (!receipt.sealed) {
      if (
        receipt.errorCode === 'profiling-actions-open' &&
        receipt.openActionCount > 0
      ) {
        return this.finishState('native-pending', {
          nativeOpenCount: receipt.openActionCount,
          errorCode: receipt.errorCode,
          receipt,
          retryable: true,
        });
      }
      return this.failFinish(
        receipt.errorCode ?? 'profile-finalize-receipt-invalid'
      );
    }
    if (receipt.droppedEventCount > 0) {
      const state = this.finishState('sealed-with-loss', { receipt });
      this.terminalFinish = state;
      return state;
    }
    if (receipt.lastBatchSequence !== drainedBatchSequence) {
      const state = this.finishState('continuity-unverified', { receipt });
      this.terminalFinish = state;
      return state;
    }
    const state = this.finishState('sealed', { receipt });
    this.terminalFinish = state;
    return state;
  }
}

let activeTrace: RendererProfileTrace | null = null;
let initialization: Promise<RendererProfileTrace | null> | null = null;

export function initializeRendererProfileTrace(): Promise<RendererProfileTrace | null> {
  initialization ??= getProfileStatus().then((status) => {
    if (
      !status.enabled ||
      status.maxBatchEvents < 2 ||
      status.maxBatchBytes < 4096
    )
      return null;
    activeTrace = new RendererProfileTrace({ status });
    return activeTrace;
  });
  return initialization;
}

/** Disabled and not-yet-initialized callers receive null before allocating actions. */
export function getRendererProfileTrace(): RendererProfileTrace | null {
  return activeTrace;
}
