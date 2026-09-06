import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

import { importTraceRun } from './import-trace-run.mjs';
import { inspectActionEvidence, organizeTrace } from './trace-integrity.mjs';
import {
  completedBatch,
  digest,
  importOptions,
  stillCase,
  traceRecords,
  traceText,
  v2TraceRecords,
  withFixture,
} from './trace-fixtures.mjs';
import { parseTraceJsonl, RENDER_ENDPOINTS } from './trace-wire.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

async function actualCollectorBatch(testCase) {
  const bundle = await build({
    entryPoints: [resolve(HERE, '../../src/lib/profiling/trace.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
  });
  const source = Buffer.from(bundle.outputFiles[0].contents).toString('base64');
  const { RendererProfileTrace } = await import(
    `data:text/javascript;base64,${source}`
  );
  const template = completedBatch(testCase);
  const frames = [];
  const batches = [];
  let now = 10;
  const status = {
    enabled: true,
    sessionId: 'session-a',
    clockId: 'native-clock-a',
    nativeMonotonicNs: '100',
    wallUnixMs: 1_000,
    maxBatchEvents: 128,
    maxBatchBytes: 128 * 1024,
    rendererBeforeMs: 1,
    rendererAfterMs: 2,
  };
  const trace = new RendererProfileTrace({
    status,
    now: () => now++,
    nextId: () => 'repeat-proof',
    requestFrame: (callback) => {
      frames.push(callback);
      return frames.length;
    },
    cancelFrame: () => undefined,
    visibilityState: () => 'visible',
    subscribeVisibility: () => () => undefined,
    append: async (batch) => {
      batches.push(batch);
      return {
        sessionId: batch.sessionId,
        batchSequence: batch.batchSequence,
        actionId: batch.actionId,
        acceptedCount: batch.events.length,
        acceptedByteCount: JSON.stringify(batch).length,
        droppedCount: 0,
        closed: true,
        outcomeAccepted: true,
        nativeReceiveRecorded: true,
        nativeReturnRecorded: true,
        sessionTainted: false,
      };
    },
  });
  const snapshot = {
    imageRuntimeId: 'image-runtime-a',
    expectedSourcePath: '/private/runtime-repeat.png',
    analysisConfig: template.analysisConfig,
    renderConfig: template.renderConfig,
  };
  const action = trace.startDeliveredAction({
    control: 'clusters',
    targetValue: template.analysisConfig.clusters,
    imageRuntimeId: snapshot.imageRuntimeId,
    expectedSourcePath: snapshot.expectedSourcePath,
    deliveredAt: 5,
    candidateSnapshot: snapshot,
  });
  assert.equal(trace.resolveDeliveredAction(action, snapshot), true);
  assert.equal(trace.observeSchedule(action, 'request-a', false), 'bound');
  const nativeRequest = {
    clusters: template.analysisConfig.clusters,
    quality: template.analysisConfig.quality,
    ignoreTopN: template.analysisConfig.ignoreTopN,
    mergeThreshold: template.analysisConfig.mergeThreshold,
    snapToReal: template.analysisConfig.snapToReal,
    minLum: 0,
    tolerance: template.analysisConfig.tolerance,
    maxIterations: template.analysisConfig.maxIterations,
    seed: template.analysisConfig.seed,
    maxSamples: 300_000,
  };
  const context = trace.admitAction(action, nativeRequest);
  assert.equal(trace.observeSchedule(action, 'request-a', true), 'repeated');
  trace.markNativeIssue(context, snapshot.expectedSourcePath, nativeRequest);
  trace.markNativeSettle(context, true);
  trace.markResponseParsed(context);
  const result = { durationMs: 12 };
  const accepted = trace.markStoreSuccess(context, result, {
    status: 'accepted',
  });
  assert.equal(trace.observeSchedule(action, 'request-a', true), 'repeated');
  const enabledFigures = ['histogram', 'polar', 'hue-lightness'];
  for (const figure of enabledFigures)
    trace.markFigureGenerated(
      accepted,
      figure,
      result,
      snapshot.analysisConfig,
      snapshot.renderConfig,
      1
    );
  const completion = trace.coordinateDomRaf2(accepted, {
    enabledFigures,
    activeImageRuntimeId: () => snapshot.imageRuntimeId,
    currentResult: () => result,
    currentAnalysisConfig: () => snapshot.analysisConfig,
    currentRenderConfig: () => snapshot.renderConfig,
    settle: async () => undefined,
    domFigureCounts: () => ({
      histogram: 1,
      polar: 1,
      'hue-lightness': 1,
    }),
  });
  await Promise.resolve();
  frames.shift()(20);
  await Promise.resolve();
  frames.shift()(21);
  await completion;
  await trace.getPersistence(action);
  assert.equal(batches.length, 1);
  return {
    schemaVersion: 2,
    recordType: 'renderer-batch',
    ...batches[0],
  };
}

async function persistMutation(paths, records, binding, refreshSeal = true) {
  for (const batch of records.filter(
    (record) => record.recordType === 'renderer-batch'
  )) {
    const close = records.find(
      (record) =>
        record.recordType === 'action-close' &&
        record.actionId === batch.actionId
    );
    if (close) {
      close.acceptedEventCount = batch.events.length;
      close.acceptedByteCount = Buffer.byteLength(JSON.stringify(batch)) + 1;
    }
  }
  const trace = refreshSeal
    ? traceText(records)
    : `${records.map((record) => JSON.stringify(record)).join('\n')}\n`;
  binding.trace.digestSha256 = digest(trace);
  await writeFile(paths.trace, trace);
  await writeFile(paths.binding, JSON.stringify(binding));
}

function adjacent(value, steps) {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, false);
  let bits = view.getBigUint64(0, false);
  bits += BigInt(steps);
  view.setBigUint64(0, bits, false);
  return view.getFloat64(0, false);
}

function selectedBatch(records) {
  return records.find(
    (record) =>
      record.recordType === 'renderer-batch' && record.actionId === 'action-a'
  );
}

function setInputSpan(batch, start, end, recorded = end - start) {
  const admittedIndex = batch.events.findIndex(
    (event) => event.type === 'request_admitted'
  );
  const oldAdmitted = batch.events[admittedIndex].rendererMs;
  for (const [index, event] of batch.events.entries()) {
    if (index === 0) event.rendererMs = start;
    else if (index < admittedIndex)
      event.rendererMs = start + ((end - start) * index) / admittedIndex;
    else if (index === admittedIndex) event.rendererMs = end;
    else event.rendererMs = end + event.rendererMs - oldAdmitted;
  }
  for (const [endpoint, [startType, endType]] of Object.entries(
    RENDER_ENDPOINTS
  )) {
    const startEvent = batch.events.find((event) => event.type === startType);
    const endEvent = batch.events.find((event) => event.type === endType);
    batch.observedOutcome.measurements[endpoint] =
      endEvent.rendererMs - startEvent.rendererMs;
  }
  batch.observedOutcome.measurements.input_to_request_admitted_ms = recorded;
  batch.observedOutcome.rendererMs = batch.events.find(
    (event) => event.type === 'associated_result_dom_raf2_approx'
  ).rendererMs;
}

function fixtureOptions(schemaVersion) {
  const testCase = stillCase();
  if (schemaVersion === 1) return { testCase };
  const actions = [
    { id: 'action-a', sequence: 2 },
    { id: 'action-invalid', sequence: 1 },
  ];
  return { testCase, actions, records: v2TraceRecords(testCase) };
}

function rendererMeasurement(run, endpoint) {
  return run.attempts[0].measurements.find(
    (measurement) => measurement.endpoint === endpoint
  );
}

async function assertInputSpanImport({
  schemaVersion,
  start,
  end,
  recorded,
  expectedStatus,
}) {
  await withFixture(
    fixtureOptions(schemaVersion),
    async ({ paths, records, binding }) => {
      setInputSpan(selectedBatch(records), start, end, recorded);
      await persistMutation(paths, records, binding);
      const { run } = await importTraceRun(importOptions(paths));
      assert.equal(run.attempts[0].terminals[0].status, expectedStatus);
      const measurement = rendererMeasurement(
        run,
        'input_to_request_admitted_ms'
      );
      if (expectedStatus === 'completed') {
        assert.equal(measurement.value, end - start);
        assert.equal(measurement.unavailableReason, null);
      } else {
        assert.equal(
          run.attempts[0].terminals[0].reasonCode,
          'result-association-unverified'
        );
        assert.equal(measurement.value, null);
        assert.equal(measurement.unavailableReason, 'unverified');
      }
    }
  );
}

test('v1 and v2 accept the retained one-ULP transport shift and report endpoint subtraction', async () => {
  for (const [schemaVersion, start, end] of [
    [1, 1_202_112, 1_202_514.0000000002],
    [2, 1_344_891, 1_345_293.0000000002],
  ]) {
    const recomputed = end - start;
    const recorded = adjacent(recomputed, -1);
    assert.notEqual(recorded, recomputed);
    await assertInputSpanImport({
      schemaVersion,
      start,
      end,
      recorded,
      expectedStatus: 'completed',
    });
  }
});

test('transported endpoint movement with cancellation remains narrowly coherent', async () => {
  const start = adjacent(1_000_000, 1);
  const end = adjacent(1_000_001, -1);
  assert.notEqual(end - start, 1);
  await assertInputSpanImport({
    schemaVersion: 2,
    start,
    end,
    recorded: 1,
    expectedStatus: 'completed',
  });
});

test('power-of-two neighbors distinguish values just inside and outside the ULP bound', async () => {
  for (const schemaVersion of [1, 2])
    for (const [recorded, expectedStatus] of [
      [adjacent(1, 3), 'completed'],
      [adjacent(1, 4), 'unverified'],
      [adjacent(1, -5), 'completed'],
      [adjacent(1, -6), 'unverified'],
    ])
      await assertInputSpanImport({
        schemaVersion,
        start: 0,
        end: 1,
        recorded,
        expectedStatus,
      });
});

test('zero boundaries, clock ceiling, and huge exact spans obey the bounded domain', async () => {
  const maxRendererClockMs = 2 ** 30;
  for (const [start, end, recorded, expectedStatus] of [
    [0, 0, 0, 'completed'],
    [0, Number.MIN_VALUE, 0, 'unverified'],
    [0, 0, Number.MIN_VALUE, 'unverified'],
    [maxRendererClockMs - 580, maxRendererClockMs - 180, 400, 'completed'],
    [maxRendererClockMs - 579, maxRendererClockMs - 179, 400, 'unverified'],
    [2 ** 40, 2 ** 40 + 400, 400, 'unverified'],
  ])
    await assertInputSpanImport({
      schemaVersion: 1,
      start,
      end,
      recorded,
      expectedStatus,
    });
});

test('signed-zero start uses positive subnormal spacing without weakening zero boundaries', () => {
  for (const [recorded, expected] of [
    [5 * Number.MIN_VALUE, true],
    [6 * Number.MIN_VALUE, false],
    [0, false],
  ]) {
    const records = traceRecords(stillCase());
    const trace = organizeTrace(
      parseTraceJsonl(Buffer.from(traceText(records)))
    );
    const batch = trace.batches.get('action-a');
    setInputSpan(batch, -0, Number.MIN_VALUE, recorded);
    assert.equal(
      Object.is(
        batch.events.find((event) => event.type === 'delivered_input')
          .rendererMs,
        -0
      ),
      true
    );
    assert.equal(inspectActionEvidence(trace, 'action-a').coherent, expected);
  }
});

test('missing and invalid renderer numbers cannot become coherent', async () => {
  await withFixture({}, async ({ paths, records, binding }) => {
    delete selectedBatch(records).observedOutcome.measurements
      .input_to_request_admitted_ms;
    await persistMutation(paths, records, binding);
    const { run } = await importTraceRun(importOptions(paths));
    assert.equal(run.attempts[0].terminals[0].status, 'unverified');
  });

  for (const invalid of [-1, Infinity, NaN]) {
    const records = traceRecords(stillCase());
    const trace = organizeTrace(
      parseTraceJsonl(Buffer.from(traceText(records)))
    );
    trace.batches.get(
      'action-a'
    ).observedOutcome.measurements.input_to_request_admitted_ms = invalid;
    assert.equal(inspectActionEvidence(trace, 'action-a').coherent, false);
  }

  for (const invalid of [-1, Infinity, NaN]) {
    const records = traceRecords(stillCase());
    const trace = organizeTrace(
      parseTraceJsonl(Buffer.from(traceText(records)))
    );
    trace.batches
      .get('action-a')
      .events.find((event) => event.type === 'request_admitted').rendererMs =
      invalid;
    assert.equal(inspectActionEvidence(trace, 'action-a').coherent, false);
  }

  await withFixture({}, async ({ paths, records, binding }) => {
    setInputSpan(selectedBatch(records), 2, 1, 0);
    await persistMutation(paths, records, binding);
    await assert.rejects(importTraceRun(importOptions(paths)), {
      code: 'INVALID_EVENT_ORDER',
    });
  });
});

test('completed action requires every parse, figure, and RAF stage', async () => {
  for (const omitted of [
    'renderer_response_parsed',
    'figure_generated',
    'raf1',
  ]) {
    await withFixture({}, async ({ paths, records, binding }) => {
      const batch = records.find(
        (record) => record.recordType === 'renderer-batch'
      );
      const index = batch.events.findIndex((event) => event.type === omitted);
      batch.events.splice(index, 1);
      await persistMutation(paths, records, binding);
      const { run } = await importTraceRun(importOptions(paths));
      assert.equal(run.attempts[0].terminals[0].status, 'unverified');
      assert.equal(
        run.attempts[0].terminals[0].reasonCode,
        'result-association-unverified'
      );
    });
  }
});

test('completed action rejects asserted checks that contradict underlying issue and store evidence', async () => {
  for (const mutate of [
    (batch) => {
      batch.events.find(
        (event) => event.type === 'renderer_native_issue'
      ).data.pathMatches = false;
    },
    (batch) => {
      batch.events.splice(
        batch.events.findIndex((event) => event.type === 'store_accepted'),
        1,
        {
          ...batch.events.find((event) => event.type === 'store_accepted'),
          type: 'store_rejected',
          data: { error: true },
        }
      );
    },
    (batch) => {
      batch.events.find(
        (event) => event.type === 'enabled_figures_generated'
      ).data.count = 2;
    },
  ]) {
    await withFixture({}, async ({ paths, records, binding }) => {
      mutate(records.find((record) => record.recordType === 'renderer-batch'));
      await persistMutation(paths, records, binding);
      const { run } = await importTraceRun(importOptions(paths));
      assert.equal(run.attempts[0].terminals[0].status, 'unverified');
    });
  }
});

test('actual collector pending and ready repeats remain eligible through importer', async () => {
  const testCase = stillCase();
  const batch = await actualCollectorBatch(testCase);
  const actions = [{ id: batch.actionId, sequence: 1 }];
  const records = traceRecords(testCase, actions, 2);
  records.splice(
    records.findIndex((record) => record.recordType === 'renderer-batch'),
    1,
    batch
  );
  for (const record of records.filter(
    (item) => item.recordType === 'native-event'
  ))
    record.rendererClockId = batch.rendererProcessClockId;
  const close = records.find((record) => record.recordType === 'action-close');
  close.acceptedEventCount = batch.events.length;
  close.acceptedByteCount = Buffer.byteLength(JSON.stringify(batch)) + 1;
  await withFixture({ testCase, records, actions }, async ({ paths }) => {
    const { run } = await importTraceRun(importOptions(paths));
    assert.equal(run.attempts[0].terminals[0].status, 'completed');
    const schedules = batch.events.filter(
      (event) => event.type === 'schedule_observed'
    );
    assert.deepEqual(
      schedules.map((event) => event.data.disposition),
      ['bound', 'repeated', 'repeated']
    );
    const admitted = batch.events.findIndex(
      (event) => event.type === 'request_admitted'
    );
    const stored = batch.events.findIndex(
      (event) => event.type === 'store_accepted'
    );
    assert.ok(batch.events.indexOf(schedules[1]) > admitted);
    assert.ok(batch.events.indexOf(schedules[1]) < stored);
    assert.ok(batch.events.indexOf(schedules[2]) > stored);
  });
});

test('v2 nonselected unavailable evidence does not taint a resolved selection', async () => {
  const testCase = stillCase();
  const actions = [
    { id: 'action-a', sequence: 2 },
    { id: 'action-invalid', sequence: 1 },
  ];
  await withFixture(
    { testCase, actions, records: v2TraceRecords(testCase) },
    async ({ paths }) => {
      const { run } = await importTraceRun(importOptions(paths));
      assert.equal(run.attempts.length, 1);
      assert.equal(run.attempts[0].terminals[0].status, 'completed');
    }
  );
});

test('mixed versions and unavailable native contradictions reject globally', async () => {
  const testCase = stillCase();
  const actions = [
    { id: 'action-a', sequence: 2 },
    { id: 'action-invalid', sequence: 1 },
  ];
  await withFixture(
    { testCase, actions, records: v2TraceRecords(testCase) },
    async ({ paths, records, binding }) => {
      records.at(-1).schemaVersion = 1;
      await persistMutation(paths, records, binding);
      await assert.rejects(importTraceRun(importOptions(paths)), {
        code: 'MIXED_TRACE_VERSION',
      });
    }
  );
  await withFixture(
    { testCase, actions, records: v2TraceRecords(testCase) },
    async ({ paths, records, binding }) => {
      const resolvedReceive = records.find(
        (record) =>
          record.recordType === 'native-event' && record.phase === 'receive'
      );
      records.splice(1, 0, {
        ...resolvedReceive,
        actionId: 'action-invalid',
      });
      await persistMutation(paths, records, binding);
      await assert.rejects(importTraceRun(importOptions(paths)), {
        code: 'UNAVAILABLE_NATIVE_EVIDENCE',
      });
    }
  );
});

test('trace loss outranks an intact unavailable diagnostic reason', async () => {
  const testCase = stillCase();
  const actions = [
    { id: 'action-invalid', sequence: 1 },
    { id: 'action-a', sequence: 2 },
  ];
  await withFixture(
    { testCase, actions, records: v2TraceRecords(testCase) },
    async ({ paths, records, binding }) => {
      const close = records.find(
        (record) =>
          record.recordType === 'action-close' &&
          record.actionId === 'action-invalid'
      );
      close.droppedEventCount = 1;
      close.sessionTainted = true;
      await persistMutation(paths, records, binding);
      const { run } = await importTraceRun(importOptions(paths, true));
      assert.equal(
        run.attempts[0].terminals[0].reasonCode,
        'trace-persistence-unverified'
      );
    }
  );
});

test('repeat before binding, second binding, and repeat after terminal reject', async () => {
  for (const [placement, disposition] of [
    ['before-bound', 'repeated'],
    ['after-bound', 'bound'],
  ]) {
    await withFixture({}, async ({ paths, records, binding }) => {
      const batch = records.find(
        (record) => record.recordType === 'renderer-batch'
      );
      const boundIndex = batch.events.findIndex(
        (event) => event.type === 'schedule_observed'
      );
      const afterBound = placement === 'after-bound';
      batch.events.splice(boundIndex + Number(afterBound), 0, {
        ...batch.events[boundIndex],
        rendererMs: afterBound ? 12.5 : 11.5,
        data: { disposition },
      });
      await persistMutation(paths, records, binding);
      const { run } = await importTraceRun(importOptions(paths));
      assert.equal(run.attempts[0].terminals[0].status, 'unverified');
    });
  }
  await withFixture({}, async ({ paths, records, binding }) => {
    const batch = records.find(
      (record) => record.recordType === 'renderer-batch'
    );
    batch.events.push({
      ...batch.events.find((event) => event.type === 'schedule_observed'),
      rendererMs: 592,
      data: { disposition: 'repeated' },
    });
    await persistMutation(paths, records, binding);
    await assert.rejects(importTraceRun(importOptions(paths)), {
      code: 'ACTION_OUTCOME_COUNT',
    });
  });
});

test('eligible import requires a final complete internally consistent seal', async () => {
  await withFixture({}, async ({ paths, records, binding }) => {
    records.pop();
    await persistMutation(paths, records, binding, false);
    const { run } = await importTraceRun(importOptions(paths));
    assert.equal(run.attempts[0].terminals[0].status, 'unverified');
  });
  await withFixture({}, async ({ paths, records, binding }) => {
    const seal = records.at(-1);
    seal.eventCount += 1;
    await persistMutation(paths, records, binding, false);
    const { run } = await importTraceRun(importOptions(paths));
    assert.equal(run.attempts[0].terminals[0].status, 'unverified');
  });
  await withFixture({}, async ({ paths, records, binding }) => {
    records.at(-1).droppedEventCount = 7;
    await persistMutation(paths, records, binding, false);
    const { run } = await importTraceRun(importOptions(paths));
    assert.equal(run.attempts[0].terminals[0].status, 'unverified');
  });
  await withFixture({}, async ({ paths, records, binding }) => {
    records.splice(
      records.findIndex(
        (record) =>
          record.recordType === 'native-event' && record.phase === 'return'
      ),
      1
    );
    records.find(
      (record) => record.recordType === 'action-close'
    ).nativeReturnRecorded = false;
    await persistMutation(paths, records, binding);
    const { run } = await importTraceRun(importOptions(paths));
    assert.equal(run.attempts[0].terminals[0].status, 'unverified');
  });
  await withFixture({}, async ({ paths, records, binding }) => {
    const trace = `${records
      .slice(0, -1)
      .map((record) => JSON.stringify(record))
      .join('\n')}\n{"schemaVersion":1,"recordType":"session-seal"`;
    binding.trace.digestSha256 = digest(trace);
    await writeFile(paths.trace, trace);
    await writeFile(paths.binding, JSON.stringify(binding));
    const { run } = await importTraceRun(importOptions(paths));
    assert.equal(run.attempts[0].terminals[0].status, 'unverified');
  });
});

test('loss snapshots are strictly increasing and seal equals the final cumulative total', async () => {
  await withFixture({}, async ({ paths, records, binding }) => {
    const seal = records.pop();
    records.push(
      {
        schemaVersion: 1,
        recordType: 'session-loss',
        sessionId: 'session-a',
        nativeClockId: 'native-clock-a',
        droppedEventCount: 2,
        errorCode: 'first-loss',
      },
      {
        schemaVersion: 1,
        recordType: 'session-loss',
        sessionId: 'session-a',
        nativeClockId: 'native-clock-a',
        droppedEventCount: 5,
        errorCode: 'second-loss',
      },
      seal
    );
    await persistMutation(paths, records, binding);
    records.at(-1).droppedEventCount = 6;
    await persistMutation(paths, records, binding, false);
    const { run } = await importTraceRun(importOptions(paths));
    assert.equal(run.attempts[0].terminals[0].status, 'unverified');
  });
  await withFixture({}, async ({ paths, records, binding }) => {
    const seal = records.pop();
    const loss = {
      schemaVersion: 1,
      recordType: 'session-loss',
      sessionId: 'session-a',
      nativeClockId: 'native-clock-a',
      droppedEventCount: 2,
      errorCode: 'first-loss',
    };
    records.push(loss, { ...loss }, seal);
    await persistMutation(paths, records, binding);
    await assert.rejects(importTraceRun(importOptions(paths)), {
      code: 'INVALID_LOSS_SEQUENCE',
    });
  });
});

test('batch sequences are contiguous and batch records precede their closes', async () => {
  const actions = [
    { id: 'action-a', sequence: 1 },
    { id: 'action-b', sequence: 2 },
  ];
  await withFixture({ actions }, async ({ paths, records, binding }) => {
    const batch = records.find(
      (record) =>
        record.recordType === 'renderer-batch' && record.actionId === 'action-b'
    );
    batch.batchSequence = 3;
    records.find(
      (record) =>
        record.recordType === 'action-close' && record.actionId === 'action-b'
    ).batchSequence = 3;
    await persistMutation(paths, records, binding);
    await assert.rejects(importTraceRun(importOptions(paths)), {
      code: 'INVALID_BATCH_SEQUENCE',
    });
  });
  await withFixture({}, async ({ paths, records, binding }) => {
    const batchIndex = records.findIndex(
      (record) => record.recordType === 'renderer-batch'
    );
    const closeIndex = records.findIndex(
      (record) => record.recordType === 'action-close'
    );
    [records[batchIndex], records[closeIndex]] = [
      records[closeIndex],
      records[batchIndex],
    ];
    await persistMutation(paths, records, binding);
    await assert.rejects(importTraceRun(importOptions(paths)), {
      code: 'ACTION_CLOSE_BEFORE_BATCH',
    });
  });
});

test('native rejected batch close without renderer batch imports as tainted unverified evidence', async () => {
  await withFixture({}, async ({ paths, records, binding }) => {
    const batchIndex = records.findIndex(
      (record) => record.recordType === 'renderer-batch'
    );
    const [batch] = records.splice(batchIndex, 1);
    const closeIndex = records.findIndex(
      (record) => record.recordType === 'action-close'
    );
    const close = records[closeIndex];
    Object.assign(close, {
      acceptedEventCount: 0,
      acceptedByteCount: 0,
      droppedEventCount: batch.events.length,
      observedOutcomePersisted: false,
      sessionTainted: true,
    });
    records.splice(closeIndex, 0, {
      schemaVersion: 1,
      recordType: 'session-loss',
      sessionId: 'session-a',
      nativeClockId: 'native-clock-a',
      droppedEventCount: batch.events.length,
      errorCode: 'invalid-batch',
    });
    await persistMutation(paths, records, binding);
    const { run } = await importTraceRun(importOptions(paths));
    assert.equal(run.attempts[0].sequence, 1);
    assert.equal(run.attempts[0].terminals[0].status, 'unverified');
    assert.equal(run.attempts[0].freshExecution.status, 'proven');
    assert.equal(
      run.attempts[0].terminals[0].reasonCode,
      'trace-persistence-unverified'
    );
    assert.ok(
      run.attempts[0].measurements.every(
        (measurement) => measurement.value === null
      )
    );
  });
});

test('loss in a nonselected action taints every selected action', async () => {
  const actions = [
    { id: 'action-a', sequence: 1 },
    { id: 'action-b', sequence: 2 },
  ];
  await withFixture({ actions }, async ({ paths, records, binding }) => {
    records.find(
      (record) =>
        record.recordType === 'action-close' && record.actionId === 'action-b'
    ).droppedEventCount = 1;
    await persistMutation(paths, records, binding);
    const { run } = await importTraceRun(importOptions(paths));
    assert.equal(run.attempts.length, 1);
    assert.equal(run.attempts[0].terminals[0].status, 'unverified');
    assert.ok(
      run.attempts[0].measurements.every(
        (measurement) => measurement.value === null
      )
    );
  });
});

test('late native return remains evidence without reopening an immutable cancellation outcome', async () => {
  await withFixture({}, async ({ paths, records, binding }) => {
    const receive = records.find(
      (record) =>
        record.recordType === 'native-event' && record.phase === 'receive'
    );
    const returned = records.find(
      (record) =>
        record.recordType === 'native-event' && record.phase === 'return'
    );
    const batch = records.find(
      (record) => record.recordType === 'renderer-batch'
    );
    const close = records.find(
      (record) => record.recordType === 'action-close'
    );
    batch.events = [
      ...batch.events.slice(0, 5),
      {
        ...batch.events.at(-1),
        rendererMs: 421,
        data: {
          status: 'cancelled',
          reasonCode: 'source-replaced',
          endpoint: null,
        },
      },
    ];
    batch.observedOutcome = {
      status: 'cancelled',
      reasonCode: 'source-replaced',
      endpoint: null,
      rendererMs: 421,
      freshExecution: null,
      associationChecks: {
        inputTargetResolved: true,
        actualPathMatchesExpected: true,
        nativeRequestMatchesAdmitted: true,
      },
      measurements: { input_to_request_admitted_ms: 400 },
    };
    close.nativeReturnRecorded = false;
    records.splice(
      0,
      records.length,
      records[0],
      receive,
      batch,
      close,
      returned,
      records.at(-1)
    );
    await persistMutation(paths, records, binding);
    const { run } = await importTraceRun(importOptions(paths));
    assert.equal(run.attempts[0].terminals[0].status, 'cancelled');
    assert.equal(run.attempts[0].freshExecution.status, 'proven');
  });
});
