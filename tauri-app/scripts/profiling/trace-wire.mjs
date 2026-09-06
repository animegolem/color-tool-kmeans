import { createHash } from 'node:crypto';

import { canonicalStringify, ManifestError } from './validate-manifest.mjs';
import { OPAQUE_ID, exactKeys, fail } from './validation-primitives.mjs';

export const ANALYSIS_FIELDS = [
  'clusters',
  'quality',
  'sampleCap',
  'maxDimension',
  'ignoreTopN',
  'mergeThreshold',
  'snapToReal',
  'seed',
  'maxIterations',
  'tolerance',
  'warmStart',
];
export const RENDER_FIELDS = [
  'polarMode',
  'histogramSort',
  'hueLightnessSizeMode',
  'showAxisLabels',
  'showClusterOutline',
  'symbolScale',
  'showHistogram',
  'showHueLightness',
  'showPolarChart',
  'showSimplifiedTones',
  'frameLabel',
  'stripMode',
  'compactSidebars',
];
export const CHECK_FIELDS = [
  'inputTargetResolved',
  'actualPathMatchesExpected',
  'nativeRequestMatchesAdmitted',
  'storeReceiptAccepted',
  'activeImageMatchesAdmitted',
  'acceptedResultObjectMatches',
  'analysisConfigMatches',
  'renderConfigMatches',
  'enabledFiguresMatch',
  'domFiguresMatch',
  'visibleAtDomSettle',
  'visibleAtRaf1',
  'visibleAtRaf2',
];
export const RENDER_ENDPOINTS = {
  input_to_request_admitted_ms: ['delivered_input', 'request_admitted'],
  renderer_native_roundtrip_ms: [
    'renderer_native_issue',
    'renderer_native_settle',
  ],
  input_to_store_accepted_ms: ['delivered_input', 'store_accepted'],
  input_to_enabled_figures_generated_ms: [
    'delivered_input',
    'enabled_figures_generated',
  ],
  input_to_dom_settled_ms: ['delivered_input', 'dom_settled'],
  input_to_associated_result_dom_raf2_approx_ms: [
    'delivered_input',
    'associated_result_dom_raf2_approx',
  ],
};
export const ALL_ENDPOINTS = [
  ...Object.keys(RENDER_ENDPOINTS),
  'native_analyze_aggregate_ms',
  'run_kmeans_ms',
];
export const MAX_TRACE_BYTES = 8 * 1024 * 1024;

const LIMIT_CEILINGS = {
  maxActions: 128,
  maxArtifactRecords: 1024,
  maxArtifactEvents: 8192,
  maxArtifactBytes: MAX_TRACE_BYTES,
  maxRendererBatchEvents: 256,
  maxRendererBatchBytes: 128 * 1024,
  maxRendererEventBytes: 4 * 1024,
};
const EVENT_TYPES = new Set([
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
]);
const EVENT_DATA_KEYS = {
  delivered_input: [
    ['control', 'targetState'],
    ['targetNumber', 'targetBoolean'],
  ],
  input_resolved: [['sourceMatches', 'targetMatches'], []],
  schedule_observed: [['disposition'], []],
  renderer_native_issue: [['pathMatches', 'requestMatches'], []],
  renderer_native_settle: [['ok'], []],
  store_accepted: [[], ['error']],
  store_rejected: [[], ['error']],
  figure_generated: [['figure', 'durationMs'], []],
  enabled_figures_generated: [['count'], []],
  action_outcome: [['status', 'reasonCode', 'endpoint'], []],
};
const REASONS = {
  completed: new Set([null]),
  deduped: new Set(['request-key-unchanged']),
  cache: new Set(['cache-parameters-unbound']),
  cancelled: new Set([
    'input-superseded',
    'debounce-replaced',
    'source-replaced',
    'view-unmounted',
  ]),
  stale: new Set(['runner-token-mismatch', 'store-token-rejected']),
  failed: new Set(['native-invoke', 'invalid-response', 'accepted-error']),
  unverified: new Set([
    'result-association-unverified',
    'hidden-before-dom-raf2',
    'dom-figure-mismatch',
    'trace-dropped',
    'trace-flush-failed',
    'no-enabled-figures',
    'input-target-invalid',
    'input-value-unresolved',
    'session-lost',
  ]),
};
const QUALITY_LIMITS = [
  [50_000, 1200],
  [100_000, 1600],
  [180_000, 2200],
  [260_000, 2600],
  [350_000, 3200],
];

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function opaque(value, code = 'INVALID_TRACE_ID') {
  if (typeof value !== 'string' || !OPAQUE_ID.test(value)) fail(code);
}

function finite(value, code = 'INVALID_TRACE_NUMBER') {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
    fail(code);
}

function count(value, code = 'INVALID_TRACE_COUNT') {
  finite(value, code);
  if (!Number.isSafeInteger(value)) fail(code);
}

function exact(value, required, optional, label) {
  try {
    exactKeys(value, required, optional, label);
  } catch (error) {
    if (error instanceof ManifestError) fail('INVALID_TRACE_SHAPE');
    throw error;
  }
}

function validateConfig(value, fields) {
  exact(value, fields, [], 'trace.config');
  for (const field of fields) {
    const item = value[field];
    if (
      item === null ||
      !['string', 'number', 'boolean'].includes(typeof item) ||
      (typeof item === 'number' && !Number.isFinite(item))
    )
      fail('INVALID_TRACE_CONFIG');
  }
  if (fields === ANALYSIS_FIELDS) {
    for (const key of [
      'clusters',
      'sampleCap',
      'maxDimension',
      'maxIterations',
    ])
      if (!Number.isSafeInteger(value[key]) || value[key] < 1)
        fail('INVALID_TRACE_CONFIG');
    for (const key of ['quality', 'ignoreTopN', 'seed'])
      if (!Number.isSafeInteger(value[key]) || value[key] < 0)
        fail('INVALID_TRACE_CONFIG');
    if (
      value.quality > 4 ||
      value.sampleCap !== QUALITY_LIMITS[value.quality]?.[0] ||
      value.maxDimension !== QUALITY_LIMITS[value.quality]?.[1] ||
      value.warmStart !== 'none' ||
      typeof value.snapToReal !== 'boolean'
    )
      fail('INVALID_TRACE_CONFIG');
  } else {
    if (value.symbolScale <= 0) fail('INVALID_TRACE_CONFIG');
    for (const key of [
      'showAxisLabels',
      'showClusterOutline',
      'showHistogram',
      'showHueLightness',
      'showPolarChart',
      'showSimplifiedTones',
      'compactSidebars',
    ])
      if (typeof value[key] !== 'boolean') fail('INVALID_TRACE_CONFIG');
    if (!['timestamp', 'frame'].includes(value.frameLabel))
      fail('INVALID_TRACE_CONFIG');
  }
}

function validateUnavailableConfig(record) {
  const config = record.analysisConfig;
  exact(config, ['state', 'reasonCode'], [], 'trace.analysisConfig');
  if (
    config.state !== 'unavailable' ||
    config.reasonCode !== 'input-target-invalid'
  )
    fail('INVALID_TRACE_CONFIG');
  const input = canonicalInput(record.input);
  if (
    !['clusters', 'quality', 'ignoreTopN', 'mergeThreshold'].includes(
      input.control
    ) ||
    input.targetState !== 'invalid-or-empty' ||
    record.rendererDroppedEventCount !== 0
  )
    fail('INVALID_TRACE_CONFIG');
  const outcome = record.observedOutcome;
  if (
    outcome.status !== 'unverified' ||
    outcome.reasonCode !== 'input-target-invalid' ||
    outcome.endpoint !== null ||
    outcome.freshExecution !== false ||
    Object.keys(outcome.associationChecks).length !== 1 ||
    outcome.associationChecks.inputTargetResolved !== false ||
    Object.keys(outcome.measurements).length !== 0
  )
    fail('INVALID_TRACE_CONFIG');
  if (
    record.events.length !== 3 ||
    record.events[0].type !== 'delivered_input' ||
    record.events[1].type !== 'input_resolved' ||
    record.events[2].type !== 'action_outcome' ||
    record.events[1].data.sourceMatches !== true ||
    record.events[1].data.targetMatches !== false
  )
    fail('INVALID_TRACE_CONFIG');
}

function validateV2AnalysisConfig(record) {
  const config = record.analysisConfig;
  if (!config || typeof config !== 'object' || Array.isArray(config))
    fail('INVALID_TRACE_CONFIG');
  if (config.state === 'unavailable') {
    validateUnavailableConfig(record);
    return;
  }
  exact(config, ['state', 'value'], [], 'trace.analysisConfig');
  if (config.state !== 'resolved') fail('INVALID_TRACE_CONFIG');
  validateConfig(config.value, ANALYSIS_FIELDS);
}

function canonicalInput(input) {
  exact(
    input,
    ['control', 'targetState'],
    ['targetNumber', 'targetBoolean'],
    'input'
  );
  if (
    ![
      'clusters',
      'quality',
      'ignoreTopN',
      'mergeThreshold',
      'snapToReal',
    ].includes(input.control) ||
    !['number', 'boolean', 'invalid-or-empty'].includes(input.targetState)
  )
    fail('INVALID_INPUT_OBSERVATION');
  if (
    (input.targetState === 'number' &&
      (!('targetNumber' in input) || 'targetBoolean' in input)) ||
    (input.targetState === 'boolean' &&
      ('targetNumber' in input || typeof input.targetBoolean !== 'boolean')) ||
    (input.targetState === 'invalid-or-empty' &&
      ('targetNumber' in input || 'targetBoolean' in input))
  )
    fail('INVALID_INPUT_OBSERVATION');
  if ('targetNumber' in input)
    finite(input.targetNumber, 'INVALID_INPUT_OBSERVATION');
  return input;
}

function validateEvent(event, batch) {
  exact(
    event,
    ['type', 'actionId', 'clockId', 'rendererMs'],
    ['data'],
    'event'
  );
  if (!EVENT_TYPES.has(event.type)) fail('UNKNOWN_TRACE_EVENT');
  if (
    event.actionId !== batch.actionId ||
    event.clockId !== batch.rendererProcessClockId
  )
    fail('MIXED_RENDERER_IDENTITY');
  finite(event.rendererMs);
  if (event.data === undefined) {
    if (EVENT_DATA_KEYS[event.type]?.[0].length > 0) fail('MISSING_EVENT_DATA');
    return;
  }
  if (
    event.data === null ||
    typeof event.data !== 'object' ||
    Array.isArray(event.data)
  )
    fail('INVALID_EVENT_DATA');
  const shape = EVENT_DATA_KEYS[event.type];
  if (!shape) fail('UNEXPECTED_EVENT_DATA');
  exact(event.data, ...shape, 'event.data');
  if (Buffer.byteLength(JSON.stringify(event)) > 4 * 1024)
    fail('UNSAFE_EVENT_DATA');
  Object.values(event.data).forEach((item) => {
    if (item !== null && !['string', 'number', 'boolean'].includes(typeof item))
      fail('INVALID_EVENT_DATA');
    if (typeof item === 'number' && !Number.isFinite(item))
      fail('INVALID_EVENT_DATA');
  });
  if (
    event.type === 'schedule_observed' &&
    !['repeated', 'deduped', 'bound'].includes(event.data.disposition)
  )
    fail('INVALID_EVENT_DATA');
  if (
    event.type === 'figure_generated' &&
    !['histogram', 'polar', 'hue-lightness'].includes(event.data.figure)
  )
    fail('INVALID_EVENT_DATA');
  if (event.type === 'delivered_input') canonicalInput(event.data);
  for (const key of [
    'sourceMatches',
    'targetMatches',
    'pathMatches',
    'requestMatches',
    'ok',
    'error',
  ])
    if (key in event.data && typeof event.data[key] !== 'boolean')
      fail('INVALID_EVENT_DATA');
  for (const key of ['durationMs', 'count'])
    if (key in event.data) finite(event.data[key], 'INVALID_EVENT_DATA');
}

function validateOutcome(outcome) {
  exact(
    outcome,
    [
      'status',
      'reasonCode',
      'endpoint',
      'rendererMs',
      'freshExecution',
      'associationChecks',
      'measurements',
    ],
    [],
    'outcome'
  );
  if (!REASONS[outcome.status]?.has(outcome.reasonCode))
    fail('INVALID_OUTCOME');
  if (
    (outcome.status === 'completed') !==
    (outcome.endpoint === 'associated_result_dom_raf2_approx')
  )
    fail('INVALID_OUTCOME_ENDPOINT');
  finite(outcome.rendererMs);
  if (![null, false].includes(outcome.freshExecution))
    fail('RUNTIME_FRESH_EXECUTION_CLAIM');
  exact(outcome.associationChecks, [], CHECK_FIELDS, 'associationChecks');
  Object.values(outcome.associationChecks).forEach((value) => {
    if (typeof value !== 'boolean') fail('INVALID_ASSOCIATION_CHECK');
  });
  exact(
    outcome.measurements,
    [],
    [...Object.keys(RENDER_ENDPOINTS), 'run_kmeans_ms'],
    'measurements'
  );
  Object.values(outcome.measurements).forEach((value) => finite(value));
}

export function rendererBatchPayloadBytes(record) {
  const payload = { ...record };
  delete payload.schemaVersion;
  delete payload.recordType;
  return Buffer.byteLength(JSON.stringify(payload));
}

function validateRecord(record) {
  if (
    ![1, 2].includes(record?.schemaVersion) ||
    typeof record.recordType !== 'string'
  )
    fail('UNSUPPORTED_TRACE_RECORD');
  const common = ['schemaVersion', 'recordType', 'sessionId'];
  opaque(record.sessionId);
  if (record.recordType === 'trace-session') {
    exact(
      record,
      [...common, 'nativeClockId', 'nativeMonotonicNs', 'wallUnixMs', 'limits'],
      [],
      'session'
    );
    opaque(record.nativeClockId);
    if (!/^(?:0|[1-9][0-9]*)$/.test(record.nativeMonotonicNs))
      fail('INVALID_NATIVE_TIME');
    finite(record.wallUnixMs);
    const fields = Object.keys(LIMIT_CEILINGS);
    exact(record.limits, fields, [], 'limits');
    fields.forEach((key) => {
      count(record.limits[key]);
      if (record.limits[key] < 1 || record.limits[key] > LIMIT_CEILINGS[key])
        fail('INVALID_TRACE_LIMIT');
    });
  } else if (record.recordType === 'native-event') {
    exact(
      record,
      [
        ...common,
        'actionId',
        'rendererClockId',
        'nativeClockId',
        'phase',
        'nativeMonotonicNs',
        'outcome',
        'errorCode',
      ],
      ['nativeAggregateNs'],
      'native'
    );
    [record.actionId, record.rendererClockId, record.nativeClockId].forEach(
      (value) => opaque(value)
    );
    if (
      !['receive', 'return'].includes(record.phase) ||
      !/^(?:0|[1-9][0-9]*)$/.test(record.nativeMonotonicNs)
    )
      fail('INVALID_NATIVE_EVENT');
    if (
      record.phase === 'receive' &&
      (record.outcome !== null || record.errorCode !== null)
    )
      fail('INVALID_NATIVE_EVENT');
    if (
      record.phase === 'return' &&
      !['success', 'error'].includes(record.outcome)
    )
      fail('INVALID_NATIVE_EVENT');
    if (
      (record.phase === 'return') !== 'nativeAggregateNs' in record ||
      ('nativeAggregateNs' in record &&
        !/^(?:0|[1-9][0-9]*)$/.test(record.nativeAggregateNs))
    )
      fail('INVALID_NATIVE_EVENT');
    if ((record.outcome === 'error') !== (typeof record.errorCode === 'string'))
      fail('INVALID_NATIVE_EVENT');
    if (record.errorCode !== null)
      opaque(record.errorCode, 'INVALID_NATIVE_ERROR_CODE');
  } else if (record.recordType === 'renderer-batch') {
    exact(
      record,
      [
        ...common,
        'batchSequence',
        'actionId',
        'rendererProcessClockId',
        'events',
        'observedOutcome',
        'rendererDroppedEventCount',
        'analysisConfig',
        'renderConfig',
        'input',
        'imageRuntimeId',
      ],
      [],
      'batch'
    );
    count(record.batchSequence);
    count(record.rendererDroppedEventCount);
    [
      record.actionId,
      record.rendererProcessClockId,
      record.imageRuntimeId,
    ].forEach((value) => opaque(value));
    if (
      !Array.isArray(record.events) ||
      record.events.length === 0 ||
      record.events.length > 256
    )
      fail('INVALID_TRACE_EVENTS');
    record.events.forEach((event) => validateEvent(event, record));
    if (rendererBatchPayloadBytes(record) > 128 * 1024)
      fail('INVALID_RENDERER_BATCH_BYTES');
    validateOutcome(record.observedOutcome);
    let prior = -1;
    record.events.forEach((event) => {
      if (event.rendererMs < prior) fail('INVALID_EVENT_ORDER');
      prior = event.rendererMs;
    });
    const outcomes = record.events.filter(
      (event) => event.type === 'action_outcome'
    );
    if (outcomes.length !== 1 || outcomes[0] !== record.events.at(-1))
      fail('ACTION_OUTCOME_COUNT');
    if (
      canonicalStringify(outcomes[0].data) !==
      canonicalStringify({
        status: record.observedOutcome.status,
        reasonCode: record.observedOutcome.reasonCode,
        endpoint: record.observedOutcome.endpoint,
      })
    )
      fail('ACTION_OUTCOME_MISMATCH');
    const admitted = record.events.some(
      (event) => event.type === 'request_admitted'
    );
    if (record.observedOutcome.freshExecution !== (admitted ? null : false))
      fail('FRESH_EXECUTION_EVIDENCE_MISMATCH');
    if (record.schemaVersion === 1)
      validateConfig(record.analysisConfig, ANALYSIS_FIELDS);
    else validateV2AnalysisConfig(record);
    validateConfig(record.renderConfig, RENDER_FIELDS);
    const input = canonicalInput(record.input);
    const delivered = record.events.filter(
      (event) => event.type === 'delivered_input'
    );
    if (
      delivered.length !== 1 ||
      canonicalStringify(canonicalInput(delivered[0].data)) !==
        canonicalStringify(input)
    )
      fail('INPUT_OBSERVATION_MISMATCH');
  } else if (record.recordType === 'action-close') {
    exact(
      record,
      [
        ...common,
        'batchSequence',
        'actionId',
        'acceptedEventCount',
        'acceptedByteCount',
        'droppedEventCount',
        'observedOutcomePersisted',
        'nativeReceiveRecorded',
        'nativeReturnRecorded',
        'sessionTainted',
        'closed',
      ],
      [],
      'close'
    );
    [
      'batchSequence',
      'acceptedEventCount',
      'acceptedByteCount',
      'droppedEventCount',
    ].forEach((key) => count(record[key]));
    opaque(record.actionId);
    [
      'observedOutcomePersisted',
      'nativeReceiveRecorded',
      'nativeReturnRecorded',
      'sessionTainted',
    ].forEach((key) => {
      if (typeof record[key] !== 'boolean') fail('INVALID_CLOSE_RECEIPT');
    });
    if (record.closed !== true) fail('INVALID_CLOSE_RECEIPT');
  } else if (record.recordType === 'session-loss') {
    exact(
      record,
      [...common, 'nativeClockId', 'droppedEventCount', 'errorCode'],
      [],
      'loss'
    );
    opaque(record.nativeClockId);
    count(record.droppedEventCount);
    opaque(record.errorCode, 'INVALID_NATIVE_ERROR_CODE');
  } else if (record.recordType === 'session-seal') {
    const fields = [
      'nativeClockId',
      'recordCount',
      'eventCount',
      'actionCount',
      'closedActionCount',
      'nativeReceiveCount',
      'nativeReturnCount',
      'rendererBatchCount',
      'rendererEventCount',
      'artifactByteCount',
      'droppedEventCount',
      'lastBatchSequence',
      'sealed',
    ];
    exact(record, [...common, ...fields], [], 'seal');
    opaque(record.nativeClockId);
    fields.slice(1, -1).forEach((key) => count(record[key]));
    if (record.sealed !== true) fail('INVALID_SESSION_SEAL');
  } else fail('UNKNOWN_TRACE_RECORD');
  return record;
}

export function parseTraceJsonl(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0) fail('EMPTY_TRACE');
  const text = bytes.toString('utf8');
  const truncated = !text.endsWith('\n');
  const lines = text.split('\n');
  if (lines.at(-1) === '') lines.pop();
  if (lines.length > 8192 || lines.some((line) => line.length === 0))
    fail('INVALID_TRACE_LINES');
  const records = [];
  const recordByteLengths = [];
  for (const [index, line] of lines.entries()) {
    try {
      records.push(validateRecord(JSON.parse(line)));
      recordByteLengths.push(
        Buffer.byteLength(line) +
          (truncated && index === lines.length - 1 ? 0 : 1)
      );
    } catch (error) {
      if (truncated && index === lines.length - 1) break;
      if (error instanceof ManifestError) throw error;
      fail('INVALID_TRACE_JSON');
    }
  }
  return {
    bytesLength: bytes.length,
    records,
    recordByteLengths,
    truncated,
  };
}
