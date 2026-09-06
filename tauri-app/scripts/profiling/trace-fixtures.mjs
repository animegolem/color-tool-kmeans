import { createHash } from 'node:crypto';
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  buildManifest,
  caseManifest,
  unavailable,
} from './profiling-fixtures.mjs';
import { canonicalStringify } from './validate-manifest.mjs';
import { CHECK_FIELDS } from './trace-wire.mjs';

export function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

function plain(config) {
  return Object.fromEntries(
    Object.entries(config).map(([key, item]) => [key, item.value])
  );
}

export function event(type, rendererMs, actionId = 'action-a', data) {
  return {
    type,
    actionId,
    clockId: 'renderer-clock-a',
    rendererMs,
    ...(data === undefined ? {} : { data }),
  };
}

export function stillCase() {
  const value = caseManifest();
  value.frame = {
    requestedSeconds: unavailable('not-applicable'),
    achievedSeconds: unavailable('not-applicable'),
    status: 'unverified',
    decodedFrameDigest: unavailable('not-applicable'),
  };
  return value;
}

export function completedBatch(
  testCase,
  actionId = 'action-a',
  batchSequence = 1,
  schemaVersion = 1
) {
  const events = [
    event('delivered_input', 10, actionId, {
      control: 'clusters',
      targetState: 'number',
      targetNumber: testCase.analysisConfig.clusters.value,
    }),
    event('input_resolved', 11, actionId, {
      sourceMatches: true,
      targetMatches: true,
    }),
    event('schedule_observed', 12, actionId, { disposition: 'bound' }),
    event('request_admitted', 410, actionId),
    event('renderer_native_issue', 420, actionId, {
      pathMatches: true,
      requestMatches: true,
    }),
    event('renderer_native_settle', 520, actionId, { ok: true }),
    event('renderer_response_parsed', 525, actionId),
    event('store_accepted', 530, actionId),
    event('figure_generated', 540, actionId, {
      figure: 'histogram',
      durationMs: 10,
    }),
    event('figure_generated', 545, actionId, {
      figure: 'polar',
      durationMs: 5,
    }),
    event('figure_generated', 550, actionId, {
      figure: 'hue-lightness',
      durationMs: 5,
    }),
    event('enabled_figures_generated', 560, actionId, { count: 3 }),
    event('dom_settled', 570, actionId),
    event('raf1', 580, actionId),
    event('associated_result_dom_raf2_approx', 590, actionId),
    event('action_outcome', 591, actionId, {
      status: 'completed',
      reasonCode: null,
      endpoint: 'associated_result_dom_raf2_approx',
    }),
  ];
  return {
    schemaVersion,
    recordType: 'renderer-batch',
    sessionId: 'session-a',
    batchSequence,
    actionId,
    rendererProcessClockId: 'renderer-clock-a',
    events,
    observedOutcome: {
      status: 'completed',
      reasonCode: null,
      endpoint: 'associated_result_dom_raf2_approx',
      rendererMs: 590,
      freshExecution: null,
      associationChecks: Object.fromEntries(
        CHECK_FIELDS.map((key) => [key, true])
      ),
      measurements: {
        input_to_request_admitted_ms: 400,
        renderer_native_roundtrip_ms: 100,
        input_to_store_accepted_ms: 520,
        input_to_enabled_figures_generated_ms: 550,
        input_to_dom_settled_ms: 560,
        input_to_associated_result_dom_raf2_approx_ms: 580,
        run_kmeans_ms: 95,
      },
    },
    rendererDroppedEventCount: 0,
    analysisConfig:
      schemaVersion === 1
        ? plain(testCase.analysisConfig)
        : { state: 'resolved', value: plain(testCase.analysisConfig) },
    renderConfig: plain(testCase.renderConfig),
    input: {
      control: 'clusters',
      targetState: 'number',
      targetNumber: testCase.analysisConfig.clusters.value,
    },
    imageRuntimeId: 'image-runtime-a',
  };
}

export function unavailableBatch(
  testCase,
  actionId = 'action-invalid',
  batchSequence = 1
) {
  const input = { control: 'clusters', targetState: 'invalid-or-empty' };
  const outcome = {
    status: 'unverified',
    reasonCode: 'input-target-invalid',
    endpoint: null,
    rendererMs: 12,
    freshExecution: false,
    associationChecks: { inputTargetResolved: false },
    measurements: {},
  };
  return {
    schemaVersion: 2,
    recordType: 'renderer-batch',
    sessionId: 'session-a',
    batchSequence,
    actionId,
    rendererProcessClockId: 'renderer-clock-a',
    events: [
      event('delivered_input', 10, actionId, input),
      event('input_resolved', 11, actionId, {
        sourceMatches: true,
        targetMatches: false,
      }),
      event('action_outcome', 12, actionId, {
        status: outcome.status,
        reasonCode: outcome.reasonCode,
        endpoint: outcome.endpoint,
      }),
    ],
    observedOutcome: outcome,
    rendererDroppedEventCount: 0,
    analysisConfig: {
      state: 'unavailable',
      reasonCode: 'input-target-invalid',
    },
    renderConfig: plain(testCase.renderConfig),
    input,
    imageRuntimeId: 'image-runtime-a',
  };
}

export function v2TraceRecords(testCase) {
  const invalid = unavailableBatch(testCase, 'action-invalid', 1);
  const resolved = completedBatch(testCase, 'action-a', 2, 2);
  return [
    {
      schemaVersion: 2,
      recordType: 'trace-session',
      sessionId: 'session-a',
      nativeClockId: 'native-clock-a',
      nativeMonotonicNs: '0',
      wallUnixMs: 1_000,
      limits: {
        maxActions: 128,
        maxArtifactRecords: 1024,
        maxArtifactEvents: 8192,
        maxArtifactBytes: 8_388_608,
        maxRendererBatchEvents: 128,
        maxRendererBatchBytes: 131_072,
        maxRendererEventBytes: 4096,
      },
    },
    invalid,
    {
      schemaVersion: 2,
      recordType: 'action-close',
      sessionId: 'session-a',
      batchSequence: 1,
      actionId: invalid.actionId,
      acceptedEventCount: invalid.events.length,
      acceptedByteCount: Buffer.byteLength(JSON.stringify(invalid)) + 1,
      droppedEventCount: 0,
      observedOutcomePersisted: true,
      nativeReceiveRecorded: false,
      nativeReturnRecorded: false,
      sessionTainted: false,
      closed: true,
    },
    {
      schemaVersion: 2,
      recordType: 'native-event',
      sessionId: 'session-a',
      actionId: resolved.actionId,
      rendererClockId: 'renderer-clock-a',
      nativeClockId: 'native-clock-a',
      phase: 'receive',
      nativeMonotonicNs: '1000002000',
      outcome: null,
      errorCode: null,
    },
    {
      schemaVersion: 2,
      recordType: 'native-event',
      sessionId: 'session-a',
      actionId: resolved.actionId,
      rendererClockId: 'renderer-clock-a',
      nativeClockId: 'native-clock-a',
      phase: 'return',
      nativeMonotonicNs: '1200002000',
      nativeAggregateNs: '200000000',
      outcome: 'success',
      errorCode: null,
    },
    resolved,
    {
      schemaVersion: 2,
      recordType: 'action-close',
      sessionId: 'session-a',
      batchSequence: 2,
      actionId: resolved.actionId,
      acceptedEventCount: resolved.events.length,
      acceptedByteCount: Buffer.byteLength(JSON.stringify(resolved)) + 1,
      droppedEventCount: 0,
      observedOutcomePersisted: true,
      nativeReceiveRecorded: true,
      nativeReturnRecorded: true,
      sessionTainted: false,
      closed: true,
    },
  ];
}

export function traceRecords(
  testCase,
  actions = [{ id: 'action-a', sequence: 1 }],
  schemaVersion = 1
) {
  const records = [
    {
      schemaVersion,
      recordType: 'trace-session',
      sessionId: 'session-a',
      nativeClockId: 'native-clock-a',
      nativeMonotonicNs: '0',
      wallUnixMs: 1_000,
      limits: {
        maxActions: 128,
        maxArtifactRecords: 1024,
        maxArtifactEvents: 8192,
        maxArtifactBytes: 8_388_608,
        maxRendererBatchEvents: 128,
        maxRendererBatchBytes: 131_072,
        maxRendererEventBytes: 4096,
      },
    },
  ];
  for (const action of actions) {
    const batch = completedBatch(
      testCase,
      action.id,
      action.sequence,
      schemaVersion
    );
    records.push(
      {
        schemaVersion,
        recordType: 'native-event',
        sessionId: 'session-a',
        actionId: action.id,
        rendererClockId: 'renderer-clock-a',
        nativeClockId: 'native-clock-a',
        phase: 'receive',
        nativeMonotonicNs: String(1_000_000_000 + action.sequence * 1_000),
        outcome: null,
        errorCode: null,
      },
      {
        schemaVersion,
        recordType: 'native-event',
        sessionId: 'session-a',
        actionId: action.id,
        rendererClockId: 'renderer-clock-a',
        nativeClockId: 'native-clock-a',
        phase: 'return',
        nativeMonotonicNs: String(1_200_000_000 + action.sequence * 1_000),
        nativeAggregateNs: '200000000',
        outcome: 'success',
        errorCode: null,
      },
      batch,
      {
        schemaVersion,
        recordType: 'action-close',
        sessionId: 'session-a',
        batchSequence: action.sequence,
        actionId: action.id,
        acceptedEventCount: batch.events.length,
        acceptedByteCount: Buffer.byteLength(JSON.stringify(batch)) + 1,
        droppedEventCount: 0,
        observedOutcomePersisted: true,
        nativeReceiveRecorded: true,
        nativeReturnRecorded: true,
        sessionTainted: false,
        closed: true,
      }
    );
  }
  return records;
}

export function traceText(records, finalNewline = true, refreshSeal = true) {
  let seal = records.find((record) => record.recordType === 'session-seal');
  if (!seal) {
    seal = {
      schemaVersion: records[0]?.schemaVersion ?? 1,
      recordType: 'session-seal',
    };
    records.push(seal);
  }
  if (refreshSeal) {
    const data = records.filter((record) => record !== seal);
    const actions = new Set(
      data.flatMap((record) => (record.actionId ? [record.actionId] : []))
    );
    const batches = data.filter(
      (record) => record.recordType === 'renderer-batch'
    );
    const natives = data.filter(
      (record) => record.recordType === 'native-event'
    );
    const closes = data.filter(
      (record) => record.recordType === 'action-close'
    );
    const losses = data.filter(
      (record) => record.recordType === 'session-loss'
    );
    Object.assign(seal, {
      sessionId: records[0].sessionId,
      nativeClockId: records[0].nativeClockId,
      recordCount: records.length,
      eventCount:
        2 +
        natives.length +
        batches.reduce((sum, batch) => sum + batch.events.length, 0) +
        closes.length +
        losses.length,
      actionCount: actions.size,
      closedActionCount: closes.length,
      nativeReceiveCount: natives.filter((record) => record.phase === 'receive')
        .length,
      nativeReturnCount: natives.filter((record) => record.phase === 'return')
        .length,
      rendererBatchCount: batches.length,
      rendererEventCount: batches.reduce(
        (sum, batch) => sum + batch.events.length,
        0
      ),
      artifactByteCount: 0,
      droppedEventCount: Math.max(
        0,
        ...batches.map((batch) => batch.rendererDroppedEventCount),
        ...closes.map((close) => close.droppedEventCount),
        ...losses.map((loss) => loss.droppedEventCount)
      ),
      lastBatchSequence: Math.max(
        0,
        ...batches.map((batch) => batch.batchSequence),
        ...closes.map((close) => close.batchSequence)
      ),
      sealed: true,
    });
  }
  for (;;) {
    const text = `${records.map((record) => JSON.stringify(record)).join('\n')}${finalNewline ? '\n' : ''}`;
    if (!refreshSeal || seal.artifactByteCount === Buffer.byteLength(text))
      return text;
    seal.artifactByteCount = Buffer.byteLength(text);
  }
}

export async function fixture(options = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'color-tool-trace-test-'));
  await chmod(directory, 0o700);
  const testCase = options.testCase ?? stillCase();
  const build = buildManifest();
  const actions = options.actions ?? [{ id: 'action-a', sequence: 1 }];
  const records = options.records ?? traceRecords(testCase, actions);
  const trace = traceText(records, options.finalNewline ?? true);
  const buildText = JSON.stringify(build);
  const caseText = JSON.stringify(testCase);
  const binding = {
    version: 1,
    kind: 'trace-acquisition-binding',
    id: 'binding-a',
    trace: { digestSha256: digest(trace), sessionId: 'session-a' },
    build: {
      manifestDigestSha256: digest(buildText),
      executableDigestSha256: build.executable.digestSha256,
    },
    case: {
      manifestDigestSha256: digest(caseText),
      sourceDigestSha256: testCase.source.digestSha256,
      configDigestSha256: digest(
        canonicalStringify({
          analysisConfig: testCase.analysisConfig,
          renderConfig: testCase.renderConfig,
          viewport: testCase.viewport,
        })
      ),
      frame: {
        requestedSeconds: testCase.frame.requestedSeconds,
        achievedSeconds: testCase.frame.achievedSeconds,
        status: testCase.frame.status,
        decodedFrameDigestSha256: testCase.frame.decodedFrameDigest,
      },
      viewport: testCase.viewport,
    },
    actions: actions.map((action, index) => ({
      id: action.id,
      disposition: index === 0 ? 'selected' : 'nonselected',
      role: 'measured',
    })),
    verification: { status: 'verified', evidenceRef: 'acquisition-proof' },
  };
  const paths = Object.fromEntries(
    ['trace', 'binding', 'build', 'case', 'output'].map((name) => [
      name,
      join(directory, `${name}.${name === 'trace' ? 'jsonl' : 'json'}`),
    ])
  );
  await Promise.all([
    writeFile(paths.trace, trace),
    writeFile(paths.binding, JSON.stringify(binding)),
    writeFile(paths.build, buildText),
    writeFile(paths.case, caseText),
  ]);
  return { directory, paths, binding, records, testCase };
}

export async function withFixture(options, callback) {
  const value = await fixture(options);
  try {
    return await callback(value);
  } finally {
    await rm(value.directory, { recursive: true, force: true });
  }
}

export function importOptions(paths, diagnostic = false) {
  return {
    tracePath: paths.trace,
    bindingPath: paths.binding,
    buildPath: paths.build,
    casePath: paths.case,
    outputPath: paths.output,
    diagnostic,
  };
}
