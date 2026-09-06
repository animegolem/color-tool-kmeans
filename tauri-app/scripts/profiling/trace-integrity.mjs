import { fail } from './validation-primitives.mjs';
import {
  CHECK_FIELDS,
  RENDER_ENDPOINTS,
  rendererBatchPayloadBytes,
} from './trace-wire.mjs';

const MAX_RENDERER_CLOCK_MS = 2 ** 30;
const MAX_RENDERER_DURATION_ERROR_MS = 1e-6;

function eventSpan(batch, startType, endType) {
  const starts = batch.events.filter((item) => item.type === startType);
  const ends = batch.events.filter((item) => item.type === endType);
  if (starts.length !== 1 || ends.length !== 1) return null;
  const start = starts[0].rendererMs;
  const end = ends[0].rendererMs;
  return { start, end, value: end - start };
}

function ulp(value) {
  if (value === 0) return Number.MIN_VALUE;
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, false);
  view.setBigUint64(0, view.getBigUint64(0, false) + 1n, false);
  return view.getFloat64(0, false) - value;
}

function coherentRendererDuration(recorded, span) {
  // Bound every millisecond operand before exact or ULP comparison so a huge
  // clock cannot enlarge tolerance; zero/nonzero must remain distinguishable.
  if (
    !span ||
    ![recorded, span.start, span.end, span.value].every(
      (value) => typeof value === 'number' && Number.isFinite(value)
    ) ||
    recorded < 0 ||
    span.start < 0 ||
    span.end < span.start ||
    [recorded, span.start, span.end, span.value].some(
      (value) => value > MAX_RENDERER_CLOCK_MS
    )
  )
    return false;
  if (recorded === 0 || span.value === 0) return recorded === span.value;
  if (recorded === span.value) return true;
  const tolerance = Math.min(
    MAX_RENDERER_DURATION_ERROR_MS,
    [span.start, span.end, recorded, span.value].reduce(
      (sum, value) => sum + ulp(value),
      0
    )
  );
  return Math.abs(recorded - span.value) <= tolerance;
}

export function nativeDelta(trace, actionId) {
  const batch = trace.batches.get(actionId);
  const phases = trace.natives.get(actionId);
  const receiveEntry = phases?.get('receive');
  const returnEntry = phases?.get('return');
  const receive = receiveEntry?.record;
  const returned = returnEntry?.record;
  if (!receive || !returned) return null;
  if (receiveEntry.index >= returnEntry.index) fail('INVALID_NATIVE_SPAN');
  const rendererClockId =
    batch?.rendererProcessClockId ?? receive.rendererClockId;
  if (
    receive.nativeClockId !== trace.session.nativeClockId ||
    returned.nativeClockId !== trace.session.nativeClockId ||
    receive.rendererClockId !== rendererClockId ||
    returned.rendererClockId !== rendererClockId
  )
    fail('MIXED_CLOCK_DOMAIN');
  const delta =
    BigInt(returned.nativeMonotonicNs) - BigInt(receive.nativeMonotonicNs);
  if (delta < 0n || delta > BigInt(Number.MAX_SAFE_INTEGER) * 1_000_000n)
    fail('INVALID_NATIVE_SPAN');
  if (BigInt(returned.nativeAggregateNs) !== delta)
    fail('NATIVE_AGGREGATE_MISMATCH');
  return Number(delta) / 1_000_000;
}

function expectedFigures(render) {
  return [
    ['showHistogram', 'histogram'],
    ['showPolarChart', 'polar'],
    ['showHueLightness', 'hue-lightness'],
  ]
    .filter(([field]) => render[field])
    .map(([, figure]) => figure);
}

function one(events, type) {
  const found = events.filter((event) => event.type === type);
  return found.length === 1 ? found[0] : null;
}

function ordered(events, types) {
  let cursor = -1;
  for (const type of types) {
    const positions = events.flatMap((event, index) =>
      event.type === type ? [index] : []
    );
    if (positions.length !== 1 || positions[0] <= cursor) return false;
    cursor = positions[0];
  }
  return true;
}

export function inspectActionEvidence(trace, actionId) {
  const batch = trace.batches.get(actionId);
  if (!batch)
    return {
      coherent: false,
      code: 'SELECTED_ACTION_MISSING_BATCH',
      nativeMs: nativeDelta(trace, actionId),
      values: {},
    };
  const outcome = batch.observedOutcome;
  const spans = Object.fromEntries(
    Object.entries(RENDER_ENDPOINTS).map(([endpoint, pair]) => [
      endpoint,
      eventSpan(batch, ...pair),
    ])
  );
  const values = Object.fromEntries(
    Object.entries(spans).map(([endpoint, span]) => [
      endpoint,
      span?.value ?? null,
    ])
  );
  const nativeMs = nativeDelta(trace, actionId);
  if (outcome.status !== 'completed')
    return { coherent: true, nativeMs, values };
  const sequence = [
    'delivered_input',
    'input_resolved',
    'request_admitted',
    'renderer_native_issue',
    'renderer_native_settle',
    'renderer_response_parsed',
    'store_accepted',
    'enabled_figures_generated',
    'dom_settled',
    'raf1',
    'associated_result_dom_raf2_approx',
    'action_outcome',
  ];
  const resolved = one(batch.events, 'input_resolved');
  const schedules = batch.events.filter(
    (event) => event.type === 'schedule_observed'
  );
  const bound = schedules.filter((event) => event.data.disposition === 'bound');
  const issue = one(batch.events, 'renderer_native_issue');
  const settle = one(batch.events, 'renderer_native_settle');
  const accepted = one(batch.events, 'store_accepted');
  const enabled = one(batch.events, 'enabled_figures_generated');
  const figures = batch.events.filter(
    (event) => event.type === 'figure_generated'
  );
  const expected = expectedFigures(batch.renderConfig);
  const phases = trace.natives.get(actionId);
  const returned = phases?.get('return')?.record;
  const close = trace.closes.get(actionId)?.record;
  const checks = outcome.associationChecks;
  const measured = Object.entries(spans).every(([endpoint, span]) =>
    coherentRendererDuration(outcome.measurements[endpoint], span)
  );
  const coherent =
    ordered(batch.events, sequence) &&
    resolved?.data.sourceMatches === true &&
    resolved?.data.targetMatches === true &&
    bound.length === 1 &&
    schedules.every((event) =>
      ['bound', 'repeated'].includes(event.data.disposition)
    ) &&
    batch.events.indexOf(bound[0]) > batch.events.indexOf(resolved) &&
    batch.events.indexOf(bound[0]) <
      batch.events.indexOf(one(batch.events, 'request_admitted')) &&
    schedules
      .filter((event) => event.data.disposition === 'repeated')
      .every(
        (event) =>
          batch.events.indexOf(event) > batch.events.indexOf(bound[0]) &&
          batch.events.indexOf(event) <
            batch.events.indexOf(one(batch.events, 'action_outcome'))
      ) &&
    issue?.data.pathMatches === true &&
    issue?.data.requestMatches === true &&
    settle?.data.ok === true &&
    accepted !== null &&
    batch.events.every((event) => event.type !== 'store_rejected') &&
    expected.length > 0 &&
    figures.length === expected.length &&
    new Set(figures.map((event) => event.data.figure)).size ===
      expected.length &&
    expected.every((figure) =>
      figures.some((event) => event.data.figure === figure)
    ) &&
    figures.every(
      (event) =>
        batch.events.indexOf(event) > batch.events.indexOf(accepted) &&
        batch.events.indexOf(event) < batch.events.indexOf(enabled)
    ) &&
    enabled?.data.count === expected.length &&
    CHECK_FIELDS.every((field) => checks[field] === true) &&
    checks.inputTargetResolved === (resolved?.data.targetMatches === true) &&
    checks.actualPathMatchesExpected === (issue?.data.pathMatches === true) &&
    checks.nativeRequestMatchesAdmitted ===
      (issue?.data.requestMatches === true) &&
    close?.nativeReceiveRecorded === true &&
    close?.nativeReturnRecorded === true &&
    nativeMs !== null &&
    returned?.outcome === 'success' &&
    measured &&
    outcome.measurements.run_kmeans_ms !== undefined;
  return {
    coherent,
    code: coherent ? null : 'ACTION_EVIDENCE_INCOHERENT',
    nativeMs,
    values,
  };
}

function sealMatches(parsed, trace) {
  const seal = trace.seal;
  if (!seal || parsed.truncated || parsed.records.at(-1) !== seal) return false;
  const records = parsed.records;
  const nativeReceiveCount = records.filter(
    (r) => r.recordType === 'native-event' && r.phase === 'receive'
  ).length;
  const nativeReturnCount = records.filter(
    (r) => r.recordType === 'native-event' && r.phase === 'return'
  ).length;
  const rendererBatchCount = trace.batches.size;
  const rendererEventCount = [...trace.batches.values()].reduce(
    (sum, batch) => sum + batch.events.length,
    0
  );
  const closeCount = trace.closes.size;
  const losses = records.filter((r) => r.recordType === 'session-loss');
  const lossCount = losses.length;
  const eventCount =
    2 +
    nativeReceiveCount +
    nativeReturnCount +
    rendererEventCount +
    closeCount +
    lossCount;
  const maxSequence = Math.max(
    0,
    ...[...trace.batches.values()].map((batch) => batch.batchSequence),
    ...[...trace.closes.values()].map((entry) => entry.record.batchSequence)
  );
  const observedDrops = Math.max(
    0,
    ...[...trace.batches.values()].map(
      (batch) => batch.rendererDroppedEventCount
    ),
    ...[...trace.closes.values()].map(
      (entry) => entry.record.droppedEventCount
    ),
    ...losses.map((r) => r.droppedEventCount)
  );
  const finalLossTotal = losses.at(-1)?.droppedEventCount ?? 0;
  return (
    seal.nativeClockId === trace.session.nativeClockId &&
    seal.recordCount === records.length &&
    seal.eventCount === eventCount &&
    seal.actionCount === trace.actionIds.size &&
    seal.closedActionCount === closeCount &&
    seal.actionCount === seal.closedActionCount &&
    seal.nativeReceiveCount === nativeReceiveCount &&
    seal.nativeReturnCount === nativeReturnCount &&
    seal.nativeReceiveCount === seal.nativeReturnCount &&
    seal.rendererBatchCount === rendererBatchCount &&
    seal.rendererEventCount === rendererEventCount &&
    seal.artifactByteCount === parsed.bytesLength &&
    seal.droppedEventCount === finalLossTotal &&
    finalLossTotal >= observedDrops &&
    seal.lastBatchSequence === maxSequence &&
    seal.sealed === true
  );
}

export function organizeTrace(parsed) {
  const sessions = parsed.records.filter(
    (record) => record.recordType === 'trace-session'
  );
  if (
    sessions.length !== 1 ||
    parsed.records[0]?.recordType !== 'trace-session'
  )
    fail('TRACE_SESSION_COUNT');
  const session = sessions[0];
  if (parsed.records.length > session.limits.maxArtifactRecords)
    fail('TRACE_RECORD_LIMIT_EXCEEDED');
  const batches = new Map();
  const closes = new Map();
  const natives = new Map();
  const actionIds = new Set();
  const batchSequences = new Set();
  const closeSequences = new Set();
  const losses = [];
  let seal = null;
  let tainted = parsed.truncated;
  for (const [index, record] of parsed.records.entries()) {
    if (index === 0) continue;
    if (record.schemaVersion !== session.schemaVersion)
      fail('MIXED_TRACE_VERSION');
    if (record.sessionId !== session.sessionId) fail('MIXED_TRACE_SESSION');
    if (record.recordType === 'session-seal') {
      if (seal) fail('DUPLICATE_SESSION_SEAL');
      seal = record;
      continue;
    }
    if (record.recordType === 'session-loss') {
      if (record.nativeClockId !== session.nativeClockId)
        fail('MIXED_CLOCK_DOMAIN');
      if (record.droppedEventCount <= (losses.at(-1)?.droppedEventCount ?? 0))
        fail('INVALID_LOSS_SEQUENCE');
      losses.push(record);
      tainted = true;
      continue;
    }
    actionIds.add(record.actionId);
    if (record.recordType === 'renderer-batch') {
      if (batches.has(record.actionId)) fail('DUPLICATE_RENDERER_BATCH');
      if (batchSequences.has(record.batchSequence))
        fail('DUPLICATE_BATCH_SEQUENCE');
      batchSequences.add(record.batchSequence);
      if (
        record.events.length > session.limits.maxRendererBatchEvents ||
        rendererBatchPayloadBytes(record) >
          session.limits.maxRendererBatchBytes ||
        record.events.some(
          (event) =>
            Buffer.byteLength(JSON.stringify(event)) >
            session.limits.maxRendererEventBytes
        )
      )
        fail('DECLARED_TRACE_LIMIT_EXCEEDED');
      batches.set(record.actionId, record);
      tainted ||= record.rendererDroppedEventCount > 0;
    } else if (record.recordType === 'action-close') {
      if (closes.has(record.actionId)) fail('DUPLICATE_ACTION_CLOSE');
      if (closeSequences.has(record.batchSequence))
        fail('DUPLICATE_BATCH_SEQUENCE');
      closeSequences.add(record.batchSequence);
      closes.set(record.actionId, { record, index });
      tainted ||= record.sessionTainted || record.droppedEventCount > 0;
    } else {
      if (record.nativeClockId !== session.nativeClockId)
        fail('MIXED_CLOCK_DOMAIN');
      const phases = natives.get(record.actionId) ?? new Map();
      if (phases.has(record.phase)) fail('DUPLICATE_NATIVE_PHASE');
      phases.set(record.phase, { record, index });
      natives.set(record.actionId, phases);
    }
  }
  if (actionIds.size > session.limits.maxActions)
    fail('TRACE_ACTION_LIMIT_EXCEEDED');
  const orderedCloseSequences = [...closeSequences].sort(
    (left, right) => left - right
  );
  if (orderedCloseSequences.some((sequence, index) => sequence !== index + 1))
    fail('INVALID_BATCH_SEQUENCE');
  const rendererEvents = [...batches.values()].reduce(
    (sum, batch) => sum + batch.events.length,
    0
  );
  const budgetEvents =
    2 +
    [...natives.values()].reduce((sum, phases) => sum + phases.size, 0) +
    rendererEvents +
    closes.size +
    parsed.records.filter((r) => r.recordType === 'session-loss').length;
  if (budgetEvents > session.limits.maxArtifactEvents)
    fail('TRACE_EVENT_LIMIT_EXCEEDED');
  const trace = {
    session,
    batches,
    closes,
    natives,
    actionIds,
    losses,
    seal,
    tainted,
  };
  for (const actionId of actionIds) {
    const batch = batches.get(actionId);
    const close = closes.get(actionId);
    if (batch && close && parsed.records.indexOf(batch) > close.index)
      fail('ACTION_CLOSE_BEFORE_BATCH');
    if (
      !batch ||
      !close ||
      close.record.batchSequence !== batch.batchSequence ||
      close.record.acceptedEventCount !== batch.events.length ||
      close.record.acceptedByteCount !==
        parsed.recordByteLengths[parsed.records.indexOf(batch)] ||
      !close.record.observedOutcomePersisted
    )
      trace.tainted = true;
    const phases = natives.get(actionId);
    const unavailable =
      batch?.analysisConfig?.state === 'unavailable' &&
      batch.analysisConfig.reasonCode === 'input-target-invalid';
    if (
      unavailable &&
      ((phases?.size ?? 0) > 0 ||
        close?.record.nativeReceiveRecorded === true ||
        close?.record.nativeReturnRecorded === true)
    )
      fail('UNAVAILABLE_NATIVE_EVIDENCE');
    if (close) {
      const receiveBeforeClose = Boolean(
        phases?.has('receive') && phases.get('receive').index < close.index
      );
      const returnBeforeClose = Boolean(
        phases?.has('return') && phases.get('return').index < close.index
      );
      if (
        close.record.nativeReceiveRecorded !== receiveBeforeClose ||
        close.record.nativeReturnRecorded !== returnBeforeClose
      )
        trace.tainted = true;
    }
    if (
      (phases?.has('receive') && !phases.has('return')) ||
      (phases?.has('return') && !phases.has('receive'))
    )
      trace.tainted = true;
  }
  trace.sealValid = sealMatches(parsed, trace);
  trace.tainted ||= !trace.sealValid || (seal?.droppedEventCount ?? 0) > 0;
  return trace;
}
