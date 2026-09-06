import { ALL_ENDPOINTS, sha256 } from './trace-wire.mjs';
import { inspectActionEvidence } from './trace-integrity.mjs';

export function redactedId(namespace, value) {
  return `redacted:${namespace}:${sha256(`${namespace}\0${value}`).slice(0, 24)}`;
}

function unavailableMeasurement(endpoint, clock) {
  return {
    endpoint,
    value: null,
    unavailableReason: 'unverified',
    unit: 'ms',
    clock,
    method: 'instrument-span',
    precision: null,
    evidenceLevel: 'instrumentation',
    evidenceRefs: ['trace-instrumentation'],
  };
}

export function importedAttempt(action, trace, problems = []) {
  const batch = trace.batches.get(action.id);
  const evidence = inspectActionEvidence(trace, action.id);
  const diagnostic = problems.length > 0;
  if (!batch) {
    const freshStatus = evidence.nativeMs === null ? 'unproven' : 'proven';
    return {
      id: redactedId('trace-attempt-id', action.id),
      sequence: trace.closes.get(action.id)?.record.batchSequence ?? 0,
      role: action.role,
      strata: {
        process: 'unknown',
        cache: 'unknown',
        workload: 'unknown',
        visibility: 'unknown',
      },
      action: {
        id: redactedId('trace-action-id', action.id),
        kind: 'analysis-request',
        evidenceRefs: ['trace-instrumentation', 'acquisition-binding'],
      },
      terminals: [
        {
          id: `terminal:${sha256(action.id).slice(0, 24)}`,
          status: 'unverified',
          reasonCode: 'trace-persistence-unverified',
          evidenceRefs: ['trace-instrumentation', 'acquisition-binding'],
        },
      ],
      freshExecution: {
        status: freshStatus,
        evidenceRefs:
          freshStatus === 'proven'
            ? ['trace-instrumentation', 'acquisition-binding']
            : [],
      },
      measurements: ALL_ENDPOINTS.map((endpoint) =>
        unavailableMeasurement(endpoint, 'unavailable:trace')
      ),
      exclusionReason: 'unverified',
    };
  }
  const outcome = batch.observedOutcome;
  const correlatedNative = evidence.nativeMs !== null;
  const eligibleCompletion =
    !diagnostic &&
    !trace.tainted &&
    outcome.status === 'completed' &&
    evidence.coherent;
  let status = outcome.status;
  let reasonCode = outcome.reasonCode;
  const intactUnavailable =
    !trace.tainted &&
    batch.analysisConfig?.state === 'unavailable' &&
    outcome.status === 'unverified' &&
    outcome.reasonCode === 'input-target-invalid' &&
    problems.every((code) => code === 'ACTION_CASE_CONFIG_UNAVAILABLE');
  if (
    diagnostic ||
    trace.tainted ||
    (outcome.status === 'completed' && !evidence.coherent)
  ) {
    status = 'unverified';
    reasonCode = intactUnavailable
      ? 'input-target-invalid'
      : trace.tainted
        ? 'trace-persistence-unverified'
        : diagnostic
          ? 'acquisition-binding-unverified'
          : 'result-association-unverified';
  }
  const freshStatus = eligibleCompletion
    ? 'proven'
    : ['cache', 'deduped'].includes(status)
      ? 'not-applicable'
      : correlatedNative
        ? 'proven'
        : 'unproven';
  const rendererClock = `renderer-performance:${batch.rendererProcessClockId}`;
  const nativeClock = `native-instant:${trace.session.nativeClockId}`;
  const values = {
    ...evidence.values,
    native_analyze_aggregate_ms: evidence.nativeMs,
    run_kmeans_ms: outcome.measurements.run_kmeans_ms ?? null,
  };
  const measurements = ALL_ENDPOINTS.map((endpoint) => {
    const clock =
      endpoint === 'native_analyze_aggregate_ms'
        ? nativeClock
        : endpoint === 'run_kmeans_ms'
          ? `native-run-kmeans:${trace.session.nativeClockId}`
          : rendererClock;
    if (!eligibleCompletion || values[endpoint] === null)
      return unavailableMeasurement(endpoint, clock);
    return {
      endpoint,
      value: values[endpoint],
      unavailableReason: null,
      unit: 'ms',
      clock,
      method: 'instrument-span',
      precision: null,
      evidenceLevel: 'instrumentation',
      evidenceRefs: ['trace-instrumentation'],
    };
  });
  const exclusionReason =
    action.role !== 'measured'
      ? action.role
      : status === 'completed' &&
          freshStatus === 'proven' &&
          measurements.every((item) => item.value !== null)
        ? null
        : status === 'completed'
          ? 'unavailable-measurement'
          : status;
  return {
    id: redactedId('trace-attempt-id', action.id),
    sequence: batch.batchSequence,
    role: action.role,
    strata: {
      process: 'unknown',
      cache: status === 'cache' ? 'warm' : 'unknown',
      workload: 'unknown',
      visibility: eligibleCompletion
        ? 'visible'
        : outcome.reasonCode === 'hidden-before-dom-raf2'
          ? 'mixed'
          : 'unknown',
    },
    action: {
      id: redactedId('trace-action-id', action.id),
      kind: 'analysis-request',
      evidenceRefs: ['trace-instrumentation', 'acquisition-binding'],
    },
    terminals: [
      {
        id: `terminal:${sha256(action.id).slice(0, 24)}`,
        status,
        reasonCode: status === 'completed' ? null : reasonCode,
        evidenceRefs: ['trace-instrumentation', 'acquisition-binding'],
      },
    ],
    freshExecution: {
      status: freshStatus,
      evidenceRefs:
        freshStatus === 'proven'
          ? ['trace-instrumentation', 'acquisition-binding']
          : [],
    },
    measurements,
    exclusionReason,
  };
}

export function buildRun({
  trace,
  traceDigest,
  bindingDigest,
  binding,
  build,
  buildDigest,
  caseManifest,
  caseDigest,
  configDigest,
  problems,
}) {
  const selected = binding.actions.filter(
    (action) => action.disposition === 'selected'
  );
  const attempts = selected.map((action) =>
    importedAttempt(action, trace, problems)
  );
  attempts.sort((left, right) => left.sequence - right.sequence);
  return {
    version: 1,
    kind: 'run',
    id: `trace-run:${sha256(`${traceDigest}\0${caseDigest}\0${selected.map((item) => item.id).join('\0')}`).slice(0, 24)}`,
    buildRef: { id: build.id, digestSha256: buildDigest },
    caseRef: {
      id: caseManifest.id,
      digestSha256: caseDigest,
      sourceDigestSha256: caseManifest.source.digestSha256,
      configDigestSha256: configDigest,
      requestedFrameSeconds: caseManifest.frame.requestedSeconds,
      achievedFrameSeconds: caseManifest.frame.achievedSeconds,
      frameStatus: caseManifest.frame.status,
      decodedFrameDigestSha256: caseManifest.frame.decodedFrameDigest,
    },
    operation: 'analysis-rerun',
    attempts,
    evidence: [
      {
        id: 'trace-instrumentation',
        kind: 'instrumentation',
        ref: `sha256:${traceDigest}`,
        note: null,
      },
      {
        id: 'acquisition-binding',
        kind: 'instrumentation',
        ref: `sha256:${bindingDigest}`,
        note: `verification:${binding.verification.status}`,
      },
    ],
  };
}
