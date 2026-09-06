import {
  EXCLUSION_REASONS,
  MAX_ATTEMPTS,
  array,
  assertEvidenceReferences,
  digest,
  enumeration,
  evidenceRefs,
  exactKeys,
  fail,
  number,
  numericValue,
  string,
  unavailable,
  validateFrameStatus,
} from './validation-primitives.mjs';

const METHOD_EVIDENCE = new Map([
  [
    'ui-transcription',
    { evidenceLevel: 'ui-transcription', evidenceKind: 'ui-transcription' },
  ],
  ['app-log-interval', { evidenceLevel: 'app-log', evidenceKind: 'app-log' }],
  [
    'instrument-span',
    { evidenceLevel: 'instrumentation', evidenceKind: 'instrumentation' },
  ],
  [
    'presented-observation',
    {
      evidenceLevel: 'presented-evidence',
      evidenceKind: 'presented-evidence',
    },
  ],
]);

function validateRunEvidence(value, label) {
  exactKeys(value, ['id', 'kind', 'ref', 'note'], [], label);
  string(value.id, `${label}.id`, { opaque: true });
  enumeration(
    value.kind,
    new Set([
      'ui-transcription',
      'app-log',
      'instrumentation',
      'presented-evidence',
    ]),
    `${label}.kind`
  );
  if (value.ref !== null) string(value.ref, `${label}.ref`);
  if (value.note !== null && typeof value.note !== 'string')
    fail('INVALID_STRING', `${label}.note`);
}

function validateStrata(value, label) {
  exactKeys(value, ['process', 'cache', 'workload', 'visibility'], [], label);
  enumeration(
    value.process,
    new Set(['warm', 'fresh', 'unknown']),
    `${label}.process`
  );
  enumeration(
    value.cache,
    new Set(['warm', 'cold', 'mixed', 'unknown']),
    `${label}.cache`
  );
  enumeration(
    value.workload,
    new Set([
      'quiet-observed',
      'busy-observed',
      'owner-quiet-intent-busy-observed',
      'unknown',
    ]),
    `${label}.workload`
  );
  enumeration(
    value.visibility,
    new Set(['visible', 'hidden', 'mixed', 'unknown']),
    `${label}.visibility`
  );
}

function validateMeasurement(value, label, terminalStatus, evidenceById) {
  exactKeys(
    value,
    [
      'endpoint',
      'value',
      'unavailableReason',
      'unit',
      'clock',
      'method',
      'precision',
      'evidenceLevel',
      'evidenceRefs',
    ],
    [],
    label
  );
  string(value.endpoint, `${label}.endpoint`, { opaque: true });
  if (value.value === null) {
    unavailable(
      { value: null, unavailableReason: value.unavailableReason },
      label
    );
  } else {
    number(value.value, `${label}.value`);
    if (value.unavailableReason !== null)
      fail('CONFLICTING_AVAILABILITY', label);
    if (terminalStatus !== 'completed')
      fail('DURATION_WITHOUT_COMPLETION', label);
  }
  enumeration(
    value.unit,
    new Set(['ms', 's', 'count', 'bytes', 'ratio']),
    `${label}.unit`
  );
  string(value.clock, `${label}.clock`, { opaque: true });
  const evidenceRule = METHOD_EVIDENCE.get(value.method);
  if (!evidenceRule) fail('INVALID_ENUM', `${label}.method`);
  if (value.precision !== null)
    number(value.precision, `${label}.precision`, { positive: true });
  enumeration(
    value.evidenceLevel,
    new Set([
      'ui-transcription',
      'app-log',
      'instrumentation',
      'presented-evidence',
    ]),
    `${label}.evidenceLevel`
  );
  if (value.evidenceLevel !== evidenceRule.evidenceLevel)
    fail('MEASUREMENT_EVIDENCE_MISMATCH', label);
  evidenceRefs(value.evidenceRefs, `${label}.evidenceRefs`);
  if (value.value !== null && value.evidenceRefs.length === 0)
    fail('MISSING_MEASUREMENT_EVIDENCE', label);
  if (value.evidenceRefs.length > 0) {
    const hasExpectedEvidence = value.evidenceRefs.some(
      (reference) =>
        evidenceById.get(reference)?.kind === evidenceRule.evidenceKind
    );
    if (!hasExpectedEvidence) fail('MEASUREMENT_EVIDENCE_MISMATCH', label);
  }
}

export function validateRunRecord(value) {
  exactKeys(
    value,
    [
      'version',
      'kind',
      'id',
      'buildRef',
      'caseRef',
      'operation',
      'attempts',
      'evidence',
    ],
    [],
    'run'
  );
  if (value.version !== 1 || value.kind !== 'run')
    fail('UNSUPPORTED_VERSION', 'run');
  string(value.id, 'run.id', { opaque: true });
  exactKeys(value.buildRef, ['id', 'digestSha256'], [], 'run.buildRef');
  string(value.buildRef.id, 'run.buildRef.id', { opaque: true });
  digest(value.buildRef.digestSha256, 'run.buildRef.digestSha256');
  exactKeys(
    value.caseRef,
    [
      'id',
      'digestSha256',
      'sourceDigestSha256',
      'configDigestSha256',
      'requestedFrameSeconds',
      'achievedFrameSeconds',
      'frameStatus',
      'decodedFrameDigestSha256',
    ],
    [],
    'run.caseRef'
  );
  string(value.caseRef.id, 'run.caseRef.id', { opaque: true });
  for (const key of [
    'digestSha256',
    'sourceDigestSha256',
    'configDigestSha256',
  ]) {
    digest(value.caseRef[key], `run.caseRef.${key}`);
  }
  numericValue(
    value.caseRef.requestedFrameSeconds,
    'run.caseRef.requestedFrameSeconds'
  );
  numericValue(
    value.caseRef.achievedFrameSeconds,
    'run.caseRef.achievedFrameSeconds'
  );
  unavailable(
    value.caseRef.decodedFrameDigestSha256,
    'run.caseRef.decodedFrameDigestSha256'
  );
  if (value.caseRef.decodedFrameDigestSha256.value !== null) {
    digest(
      value.caseRef.decodedFrameDigestSha256.value,
      'run.caseRef.decodedFrameDigestSha256.value'
    );
  }
  validateFrameStatus(
    {
      requestedSeconds: value.caseRef.requestedFrameSeconds,
      achievedSeconds: value.caseRef.achievedFrameSeconds,
      status: value.caseRef.frameStatus,
    },
    'run.caseRef'
  );
  enumeration(
    value.operation,
    new Set([
      'analysis-rerun',
      'import',
      'seek',
      'playback',
      'navigation',
      'export',
      'batch',
      'values',
    ]),
    'run.operation'
  );

  array(value.evidence, 'run.evidence');
  const evidenceIds = new Set();
  const evidenceById = new Map();
  value.evidence.forEach((item, index) => {
    validateRunEvidence(item, `run.evidence[${index}]`);
    if (evidenceIds.has(item.id)) fail('DUPLICATE_EVIDENCE_ID', item.id);
    evidenceIds.add(item.id);
    evidenceById.set(item.id, item);
  });

  array(value.attempts, 'run.attempts', MAX_ATTEMPTS);
  const attemptIds = new Set();
  const actionIds = new Set();
  const terminalIds = new Set();
  let previousSequence = -1;
  value.attempts.forEach((attempt, index) => {
    const label = `run.attempts[${index}]`;
    exactKeys(
      attempt,
      [
        'id',
        'sequence',
        'role',
        'strata',
        'action',
        'terminals',
        'freshExecution',
        'measurements',
        'exclusionReason',
      ],
      [],
      label
    );
    string(attempt.id, `${label}.id`, { opaque: true });
    if (attemptIds.has(attempt.id)) fail('DUPLICATE_ATTEMPT_ID', attempt.id);
    attemptIds.add(attempt.id);
    number(attempt.sequence, `${label}.sequence`, { integer: true });
    if (attempt.sequence <= previousSequence)
      fail('INVALID_ATTEMPT_ORDER', label);
    previousSequence = attempt.sequence;
    enumeration(
      attempt.role,
      new Set(['setup', 'reset', 'warmup', 'measured']),
      `${label}.role`
    );
    validateStrata(attempt.strata, `${label}.strata`);
    exactKeys(
      attempt.action,
      ['id', 'kind', 'evidenceRefs'],
      [],
      `${label}.action`
    );
    string(attempt.action.id, `${label}.action.id`, { opaque: true });
    if (actionIds.has(attempt.action.id))
      fail('DUPLICATE_ACTION_ID', attempt.action.id);
    actionIds.add(attempt.action.id);
    enumeration(
      attempt.action.kind,
      new Set([
        'analysis-request',
        'import',
        'seek',
        'playback',
        'navigation',
        'export',
      ]),
      `${label}.action.kind`
    );
    evidenceRefs(attempt.action.evidenceRefs, `${label}.action.evidenceRefs`);
    array(attempt.terminals, `${label}.terminals`, 2);
    if (attempt.terminals.length !== 1) fail('TERMINAL_COUNT', label);
    const terminal = attempt.terminals[0];
    exactKeys(
      terminal,
      ['id', 'status', 'reasonCode', 'evidenceRefs'],
      [],
      `${label}.terminals[0]`
    );
    string(terminal.id, `${label}.terminals[0].id`, { opaque: true });
    if (terminalIds.has(terminal.id))
      fail('DUPLICATE_TERMINAL_ID', terminal.id);
    terminalIds.add(terminal.id);
    enumeration(
      terminal.status,
      new Set([
        'completed',
        'failed',
        'cancelled',
        'stale',
        'cache',
        'deduped',
        'timeout',
        'unverified',
      ]),
      `${label}.terminals[0].status`
    );
    if (terminal.status === 'completed') {
      if (terminal.reasonCode !== null) fail('CONFLICTING_TERMINAL', label);
    } else {
      string(terminal.reasonCode, `${label}.terminals[0].reasonCode`, {
        opaque: true,
      });
    }
    evidenceRefs(terminal.evidenceRefs, `${label}.terminals[0].evidenceRefs`);
    exactKeys(
      attempt.freshExecution,
      ['status', 'evidenceRefs'],
      [],
      `${label}.freshExecution`
    );
    enumeration(
      attempt.freshExecution.status,
      new Set(['proven', 'unproven', 'not-applicable']),
      `${label}.freshExecution.status`
    );
    evidenceRefs(
      attempt.freshExecution.evidenceRefs,
      `${label}.freshExecution.evidenceRefs`
    );
    if (
      attempt.freshExecution.status === 'proven' &&
      attempt.freshExecution.evidenceRefs.length === 0
    ) {
      fail('MISSING_FRESH_EXECUTION_EVIDENCE', label);
    }
    array(attempt.measurements, `${label}.measurements`);
    const endpoints = new Set();
    attempt.measurements.forEach((measurement, measurementIndex) => {
      validateMeasurement(
        measurement,
        `${label}.measurements[${measurementIndex}]`,
        terminal.status,
        evidenceById
      );
      const measurementIdentity = [
        measurement.endpoint,
        measurement.unit,
        measurement.clock,
        measurement.method,
        measurement.evidenceLevel,
      ].join('|');
      if (endpoints.has(measurementIdentity))
        fail('DUPLICATE_MEASUREMENT', measurementIdentity);
      endpoints.add(measurementIdentity);
    });
    if (attempt.exclusionReason !== null) {
      enumeration(
        attempt.exclusionReason,
        EXCLUSION_REASONS,
        `${label}.exclusionReason`
      );
    }
    const eligibilityPrerequisites =
      attempt.role === 'measured' &&
      terminal.status === 'completed' &&
      attempt.freshExecution.status === 'proven';
    if (!eligibilityPrerequisites && attempt.exclusionReason === null) {
      fail('MISSING_EXCLUSION_REASON', label);
    }
  });
  assertEvidenceReferences(value, evidenceIds);
  return value;
}
