import { isTauriEnv, tauriInvoke } from './tauri';

export const PROFILE_EVENT_TYPES = [
  'delivered_input',
  'input_resolved',
  'schedule_observed',
  'request_admitted',
  'renderer_native_issue',
  'renderer_native_settle',
  'renderer_response_parsed',
  'store_accepted',
  'store_rejected',
  'figure_generated',
  'enabled_figures_generated',
  'dom_settled',
  'raf1',
  'associated_result_dom_raf2_approx',
  'action_outcome',
] as const;

export type ProfileEventType = (typeof PROFILE_EVENT_TYPES)[number];
export type ProfilePrimitive = string | number | boolean | null;

export interface ProfileRendererEvent {
  type: ProfileEventType;
  actionId: string;
  clockId: string;
  rendererMs: number;
  data?: Record<string, ProfilePrimitive>;
}

export type ProfileReasonCode =
  | 'request-key-unchanged'
  | 'cache-parameters-unbound'
  | 'input-superseded'
  | 'debounce-replaced'
  | 'source-replaced'
  | 'view-unmounted'
  | 'runner-token-mismatch'
  | 'store-token-rejected'
  | 'native-invoke'
  | 'invalid-response'
  | 'accepted-error'
  | 'result-association-unverified'
  | 'hidden-before-dom-raf2'
  | 'dom-figure-mismatch'
  | 'trace-dropped'
  | 'trace-flush-failed'
  | 'no-enabled-figures'
  | 'input-target-invalid'
  | 'input-value-unresolved'
  | 'session-lost';

export interface ProfileObservedOutcome {
  status:
    | 'completed'
    | 'deduped'
    | 'cache'
    | 'cancelled'
    | 'stale'
    | 'failed'
    | 'unverified';
  reasonCode: ProfileReasonCode | null;
  endpoint: 'associated_result_dom_raf2_approx' | null;
  rendererMs: number;
  freshExecution: boolean | null;
  associationChecks: Record<string, boolean>;
  measurements: Record<string, number>;
}

export interface ProfileAnalysisConfigRecord {
  clusters: number;
  quality: number;
  sampleCap: number;
  maxDimension: number;
  ignoreTopN: number;
  mergeThreshold: number;
  snapToReal: boolean;
  seed: number;
  maxIterations: number;
  tolerance: number;
  warmStart: 'none';
}

export type ProfileAnalysisConfigEvidence =
  | {
      state: 'resolved';
      value: ProfileAnalysisConfigRecord;
    }
  | {
      state: 'unavailable';
      reasonCode: 'input-target-invalid';
    };

export interface ProfileRenderConfigRecord {
  symbolScale: number;
  showClusterOutline: boolean;
  showAxisLabels: boolean;
  polarMode: 'oklch' | 'okhsv' | 'hsv';
  hueLightnessSizeMode: 'frequency' | 'chroma';
  histogramSort: 'frequency' | 'hue' | 'lightness';
  showHistogram: boolean;
  showPolarChart: boolean;
  showHueLightness: boolean;
  showSimplifiedTones: boolean;
  frameLabel: 'timestamp' | 'frame';
  stripMode: 'filmstrip' | 'barcode';
  compactSidebars: boolean;
}

export interface ProfileInputRecord {
  control: string;
  targetState: 'number' | 'boolean' | 'invalid-or-empty';
  targetNumber?: number;
  targetBoolean?: boolean;
}

export interface ProfileRendererBatch {
  sessionId: string;
  batchSequence: number;
  actionId: string;
  rendererProcessClockId: string;
  events: ProfileRendererEvent[];
  observedOutcome: ProfileObservedOutcome;
  rendererDroppedEventCount: number;
  analysisConfig: ProfileAnalysisConfigEvidence;
  renderConfig: ProfileRenderConfigRecord;
  input: ProfileInputRecord;
  imageRuntimeId: string;
}

export interface ProfileStatus {
  enabled: boolean;
  sessionId: string | null;
  clockId: string | null;
  nativeMonotonicNs: string | null;
  wallUnixMs: number | null;
  maxBatchEvents: number;
  maxBatchBytes: number;
  rendererBeforeMs: number;
  rendererAfterMs: number;
}

export interface ProfileAppendReceipt {
  sessionId: string;
  batchSequence: number;
  actionId: string;
  acceptedCount: number;
  acceptedByteCount: number;
  droppedCount: number;
  closed: true;
  outcomeAccepted: boolean;
  nativeReceiveRecorded: boolean;
  nativeReturnRecorded: boolean;
  sessionTainted: boolean;
}

export const PROFILE_APPEND_VALIDATION_ERROR_CODES = [
  'profile-analysis-config-invalid',
  'profile-render-config-invalid',
  'profile-batch-identity-invalid',
  'profile-outcome-invalid',
  'profile-session-disabled-or-mismatched',
  'profile-batch-event-count-invalid',
  'profile-event-invalid',
  'profile-event-data-not-primitive',
  'profile-event-data-not-finite',
  'profile-batch-bytes-exceeded',
] as const;

export type ProfileAppendValidationErrorCode =
  (typeof PROFILE_APPEND_VALIDATION_ERROR_CODES)[number];

const PROFILE_APPEND_VALIDATION_ERRORS = new Set<string>(
  PROFILE_APPEND_VALIDATION_ERROR_CODES
);

export function profileAppendValidationErrorCode(
  error: unknown
): ProfileAppendValidationErrorCode | null {
  if (
    error instanceof Error &&
    PROFILE_APPEND_VALIDATION_ERRORS.has(error.message)
  ) {
    return error.message as ProfileAppendValidationErrorCode;
  }
  return null;
}

export const PROFILE_FINALIZE_ERROR_CODES = [
  'profiling-actions-open',
  'profiling-writer-unavailable',
  'profiling-json-serialize',
  'profiling-seal-size',
  'profiling-pre-seal-flush',
  'profiling-seal-write',
] as const;

export type ProfileFinalizeErrorCode =
  (typeof PROFILE_FINALIZE_ERROR_CODES)[number];

export interface ProfileFinalizeReceipt {
  sessionId: string;
  sealed: boolean;
  openActionCount: number;
  recordCount: number;
  eventCount: number;
  artifactByteCount: number;
  droppedEventCount: number;
  lastBatchSequence: number;
  errorCode: ProfileFinalizeErrorCode | null;
}

let statusPromise: Promise<ProfileStatus> | null = null;

function rendererNow(): number {
  return typeof performance === 'undefined' ? 0 : performance.now();
}

function disabledStatus(beforeMs: number): ProfileStatus {
  return {
    enabled: false,
    sessionId: null,
    clockId: null,
    nativeMonotonicNs: null,
    wallUnixMs: null,
    maxBatchEvents: 0,
    maxBatchBytes: 0,
    rendererBeforeMs: beforeMs,
    rendererAfterMs: rendererNow(),
  };
}

function readFiniteLimit(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
    ? value
    : 0;
}

async function loadProfileStatus(): Promise<ProfileStatus> {
  const rendererBeforeMs = rendererNow();
  if (!isTauriEnv()) return disabledStatus(rendererBeforeMs);
  try {
    const raw = (await tauriInvoke('profile_status')) as Record<
      string,
      unknown
    >;
    const rendererAfterMs = rendererNow();
    const sessionId = typeof raw?.sessionId === 'string' ? raw.sessionId : null;
    const clockId = typeof raw?.clockId === 'string' ? raw.clockId : null;
    const enabled =
      raw?.enabled === true && sessionId !== null && clockId !== null;
    return {
      enabled,
      sessionId: enabled ? sessionId : null,
      clockId: enabled ? clockId : null,
      nativeMonotonicNs:
        enabled && typeof raw?.nativeMonotonicNs === 'string'
          ? raw.nativeMonotonicNs
          : null,
      wallUnixMs:
        enabled && typeof raw?.wallUnixMs === 'number' ? raw.wallUnixMs : null,
      maxBatchEvents: enabled ? readFiniteLimit(raw?.maxBatchEvents) : 0,
      maxBatchBytes: enabled ? readFiniteLimit(raw?.maxBatchBytes) : 0,
      rendererBeforeMs,
      rendererAfterMs,
    };
  } catch {
    return disabledStatus(rendererBeforeMs);
  }
}

/** The sole renderer-lifetime status IPC. Rejections become disabled status. */
export function getProfileStatus(): Promise<ProfileStatus> {
  statusPromise ??= loadProfileStatus();
  return statusPromise;
}

function assertPrimitiveData(event: ProfileRendererEvent): void {
  if (!event.data) return;
  for (const value of Object.values(event.data)) {
    if (
      value !== null &&
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    ) {
      throw new Error('profile-event-data-not-primitive');
    }
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new Error('profile-event-data-not-finite');
    }
  }
}

function assertExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  code: string
): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, i) => key !== expected[i])
  ) {
    throw new Error(code);
  }
}

function assertFiniteRecord(
  value: Record<string, unknown>,
  numericKeys: readonly string[],
  booleanKeys: readonly string[],
  stringKeys: readonly string[],
  code: string
): void {
  assertExactKeys(value, [...numericKeys, ...booleanKeys, ...stringKeys], code);
  if (
    numericKeys.some(
      (key) => typeof value[key] !== 'number' || !Number.isFinite(value[key])
    ) ||
    booleanKeys.some((key) => typeof value[key] !== 'boolean') ||
    stringKeys.some((key) => typeof value[key] !== 'string')
  ) {
    throw new Error(code);
  }
}

function assertRecord(value: unknown, code: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(code);
  }
  return value as Record<string, unknown>;
}

function validateUnavailableAnalysisConfig(batch: ProfileRendererBatch): void {
  const code = 'profile-analysis-config-invalid';
  const config = batch.analysisConfig as Record<string, unknown>;
  assertExactKeys(config, ['state', 'reasonCode'], code);
  if (
    config.state !== 'unavailable' ||
    config.reasonCode !== 'input-target-invalid'
  ) {
    throw new Error(code);
  }
  const input = batch.input as unknown as Record<string, unknown>;
  assertExactKeys(input, ['control', 'targetState'], code);
  if (
    !['clusters', 'quality', 'ignoreTopN', 'mergeThreshold'].includes(
      String(input.control)
    ) ||
    input.targetState !== 'invalid-or-empty' ||
    batch.rendererDroppedEventCount !== 0
  ) {
    throw new Error(code);
  }
  const outcome = batch.observedOutcome;
  if (
    outcome.status !== 'unverified' ||
    outcome.reasonCode !== 'input-target-invalid' ||
    outcome.endpoint !== null ||
    outcome.freshExecution !== false
  ) {
    throw new Error(code);
  }
  assertExactKeys(
    outcome.associationChecks as Record<string, unknown>,
    ['inputTargetResolved'],
    code
  );
  assertExactKeys(outcome.measurements as Record<string, unknown>, [], code);
  if (outcome.associationChecks.inputTargetResolved !== false) {
    throw new Error(code);
  }
  if (
    batch.events.length !== 3 ||
    batch.events[0]?.type !== 'delivered_input' ||
    batch.events[1]?.type !== 'input_resolved' ||
    batch.events[2]?.type !== 'action_outcome'
  ) {
    throw new Error(code);
  }
  const delivered = assertRecord(batch.events[0].data, code);
  assertExactKeys(delivered, ['control', 'targetState'], code);
  if (
    delivered.control !== input.control ||
    delivered.targetState !== input.targetState
  ) {
    throw new Error(code);
  }
  const resolved = assertRecord(batch.events[1].data, code);
  assertExactKeys(resolved, ['sourceMatches', 'targetMatches'], code);
  if (resolved.sourceMatches !== true || resolved.targetMatches !== false) {
    throw new Error(code);
  }
  const terminal = assertRecord(batch.events[2].data, code);
  assertExactKeys(terminal, ['status', 'reasonCode', 'endpoint'], code);
  if (
    terminal.status !== outcome.status ||
    terminal.reasonCode !== outcome.reasonCode ||
    terminal.endpoint !== outcome.endpoint
  ) {
    throw new Error(code);
  }
}

function validateAnalysisConfig(batch: ProfileRendererBatch): void {
  const code = 'profile-analysis-config-invalid';
  const config = assertRecord(batch.analysisConfig, code);
  if (config.state === 'unavailable') {
    validateUnavailableAnalysisConfig(batch);
    return;
  }
  assertExactKeys(config, ['state', 'value'], code);
  if (config.state !== 'resolved') throw new Error(code);
  const value = assertRecord(config.value, code);
  assertFiniteRecord(
    value,
    [
      'clusters',
      'quality',
      'sampleCap',
      'maxDimension',
      'ignoreTopN',
      'mergeThreshold',
      'seed',
      'maxIterations',
      'tolerance',
    ],
    ['snapToReal'],
    ['warmStart'],
    code
  );
}

function validateBatchPayload(batch: ProfileRendererBatch): void {
  validateAnalysisConfig(batch);
  assertFiniteRecord(
    batch.renderConfig as unknown as Record<string, unknown>,
    ['symbolScale'],
    [
      'showClusterOutline',
      'showAxisLabels',
      'showHistogram',
      'showPolarChart',
      'showHueLightness',
      'showSimplifiedTones',
      'compactSidebars',
    ],
    [
      'polarMode',
      'hueLightnessSizeMode',
      'histogramSort',
      'frameLabel',
      'stripMode',
    ],
    'profile-render-config-invalid'
  );
  if (
    !batch.actionId ||
    !batch.rendererProcessClockId ||
    !batch.imageRuntimeId ||
    !Number.isSafeInteger(batch.rendererDroppedEventCount) ||
    batch.rendererDroppedEventCount < 0
  ) {
    throw new Error('profile-batch-identity-invalid');
  }
  const outcome = batch.observedOutcome;
  if (
    !Number.isFinite(outcome.rendererMs) ||
    outcome.rendererMs < 0 ||
    Object.values(outcome.associationChecks).some(
      (value) => typeof value !== 'boolean'
    ) ||
    Object.values(outcome.measurements).some(
      (value) => !Number.isFinite(value) || value < 0
    )
  ) {
    throw new Error('profile-outcome-invalid');
  }
}

function validateBatch(batch: ProfileRendererBatch, status: ProfileStatus) {
  if (!status.enabled || batch.sessionId !== status.sessionId) {
    throw new Error('profile-session-disabled-or-mismatched');
  }
  if (
    !Number.isSafeInteger(batch.batchSequence) ||
    batch.batchSequence < 1 ||
    batch.events.length < 1 ||
    batch.events.length > status.maxBatchEvents
  ) {
    throw new Error('profile-batch-event-count-invalid');
  }
  for (const event of batch.events) {
    if (
      event.actionId !== batch.actionId ||
      event.clockId !== batch.rendererProcessClockId ||
      !PROFILE_EVENT_TYPES.includes(event.type) ||
      !Number.isFinite(event.rendererMs) ||
      event.rendererMs < 0
    ) {
      throw new Error('profile-event-invalid');
    }
    assertPrimitiveData(event);
  }
  validateBatchPayload(batch);
  const byteCount = new TextEncoder().encode(JSON.stringify(batch)).byteLength;
  if (byteCount > status.maxBatchBytes) {
    throw new Error('profile-batch-bytes-exceeded');
  }
}

export async function appendProfileBatch(
  batch: ProfileRendererBatch,
  status: ProfileStatus
): Promise<ProfileAppendReceipt> {
  validateBatch(batch, status);
  const raw = (await tauriInvoke('profile_append_batch', { batch })) as Record<
    string,
    unknown
  >;
  if (
    raw?.sessionId !== batch.sessionId ||
    raw?.batchSequence !== batch.batchSequence ||
    raw?.actionId !== batch.actionId ||
    raw?.closed !== true
  ) {
    throw new Error('profile-append-receipt-mismatched');
  }
  const receipt = raw as unknown as ProfileAppendReceipt;
  for (const count of [
    receipt.acceptedCount,
    receipt.acceptedByteCount,
    receipt.droppedCount,
  ]) {
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new Error('profile-append-receipt-count-invalid');
    }
  }
  for (const flag of [
    receipt.outcomeAccepted,
    receipt.nativeReceiveRecorded,
    receipt.nativeReturnRecorded,
    receipt.sessionTainted,
  ]) {
    if (typeof flag !== 'boolean') {
      throw new Error('profile-append-receipt-flag-invalid');
    }
  }
  return receipt;
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function validateFinalizeReceipt(
  raw: unknown,
  sessionId: string
): ProfileFinalizeReceipt {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('profile-finalize-receipt-invalid');
  }
  const value = raw as Record<string, unknown>;
  assertExactKeys(
    value,
    [
      'sessionId',
      'sealed',
      'openActionCount',
      'recordCount',
      'eventCount',
      'artifactByteCount',
      'droppedEventCount',
      'lastBatchSequence',
      'errorCode',
    ],
    'profile-finalize-receipt-invalid'
  );
  if (
    value.sessionId !== sessionId ||
    typeof value.sealed !== 'boolean' ||
    !isNonNegativeSafeInteger(value.openActionCount) ||
    !isNonNegativeSafeInteger(value.recordCount) ||
    value.recordCount === 0 ||
    !isNonNegativeSafeInteger(value.eventCount) ||
    value.eventCount === 0 ||
    !isNonNegativeSafeInteger(value.artifactByteCount) ||
    value.artifactByteCount === 0 ||
    !isNonNegativeSafeInteger(value.droppedEventCount) ||
    !isNonNegativeSafeInteger(value.lastBatchSequence) ||
    (value.errorCode !== null &&
      !PROFILE_FINALIZE_ERROR_CODES.includes(
        value.errorCode as ProfileFinalizeErrorCode
      ))
  ) {
    throw new Error('profile-finalize-receipt-invalid');
  }
  const receipt = value as unknown as ProfileFinalizeReceipt;
  const nativePending =
    !receipt.sealed &&
    receipt.errorCode === 'profiling-actions-open' &&
    receipt.openActionCount > 0;
  const terminalFailure =
    !receipt.sealed &&
    receipt.openActionCount === 0 &&
    receipt.errorCode !== null &&
    receipt.errorCode !== 'profiling-actions-open';
  const cleanSeal =
    receipt.sealed &&
    receipt.openActionCount === 0 &&
    receipt.errorCode === null;
  if (!nativePending && !terminalFailure && !cleanSeal) {
    throw new Error('profile-finalize-receipt-invalid');
  }
  return receipt;
}

export async function finalizeProfileSession(
  sessionId: string
): Promise<ProfileFinalizeReceipt> {
  if (!sessionId) throw new Error('profile-finalize-session-invalid');
  const raw = await tauriInvoke('profile_finalize', {
    req: { sessionId },
  });
  return validateFinalizeReceipt(raw, sessionId);
}
