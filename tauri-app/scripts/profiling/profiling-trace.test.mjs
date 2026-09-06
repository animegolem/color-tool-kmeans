import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { importTraceRun, parseTraceJsonl } from './import-trace-run.mjs';
import {
  completedBatch,
  importOptions,
  stillCase,
  traceRecords,
  traceText,
  unavailableBatch,
  v2TraceRecords,
  withFixture,
} from './trace-fixtures.mjs';
import { validateRunRecord } from './validate-manifest.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

test('schema documents all strict trace records and the acquisition binding', async () => {
  const schema = JSON.parse(
    await readFile(join(HERE, 'schema/trace-record.schema.json'), 'utf8')
  );
  assert.equal(schema.oneOf.length, 7);
  for (const name of [
    'traceSession',
    'nativeEvent',
    'rendererBatch',
    'actionClose',
    'sessionLoss',
    'sessionSeal',
    'acquisitionBinding',
  ])
    assert.equal(schema.$defs[name].additionalProperties, false);
});

test('v2 schema has a distinct id and strict record/config arms', async () => {
  const schema = JSON.parse(
    await readFile(join(HERE, 'schema/trace-record.v2.schema.json'), 'utf8')
  );
  assert.equal(
    schema.$id,
    'https://color-tool.invalid/profiling/trace-record.v2.schema.json'
  );
  assert.equal(schema.oneOf.length, 6);
  for (const name of [
    'traceSession',
    'nativeEvent',
    'rendererBatch',
    'actionClose',
    'sessionLoss',
    'sessionSeal',
    'resolvedAnalysisConfig',
    'unavailableAnalysisConfig',
  ])
    assert.equal(schema.$defs[name].additionalProperties, false);
  assert.deepEqual(
    schema.$defs.unavailableAnalysisConfig.properties.reasonCode,
    { const: 'input-target-invalid' }
  );
  const unavailable =
    schema.$defs.rendererBatch.allOf[0].then.properties.events.prefixItems;
  assert.deepEqual(
    unavailable.map((item) => item.required),
    [['data'], ['data'], ['data']]
  );
  assert.deepEqual(unavailable[0].properties.data.required, [
    'control',
    'targetState',
  ]);
  assert.deepEqual(unavailable[0].properties.data.properties.control.enum, [
    'clusters',
    'quality',
    'ignoreTopN',
    'mergeThreshold',
  ]);
  assert.deepEqual(unavailable[0].properties.data.properties.targetState, {
    const: 'invalid-or-empty',
  });
  assert.equal(unavailable[0].properties.data.additionalProperties, false);
  assert.deepEqual(unavailable[1].properties.data.required, [
    'sourceMatches',
    'targetMatches',
  ]);
  assert.deepEqual(unavailable[1].properties.data.properties, {
    sourceMatches: { const: true },
    targetMatches: { const: false },
  });
  assert.equal(unavailable[1].properties.data.additionalProperties, false);
  assert.deepEqual(unavailable[2].properties.data.required, [
    'status',
    'reasonCode',
    'endpoint',
  ]);
  assert.deepEqual(unavailable[2].properties.data.properties, {
    status: { const: 'unverified' },
    reasonCode: { const: 'input-target-invalid' },
    endpoint: { const: null },
  });
  assert.equal(unavailable[2].properties.data.additionalProperties, false);
});

test('parser preserves sealed v1 and accepts exact v2 config arms only', () => {
  const testCase = stillCase();
  const v1 = traceRecords(testCase);
  const v2 = v2TraceRecords(testCase);
  assert.equal(
    parseTraceJsonl(Buffer.from(traceText(v1))).records[0].schemaVersion,
    1
  );
  assert.equal(
    parseTraceJsonl(Buffer.from(traceText(v2))).records[0].schemaVersion,
    2
  );

  const v1Cross = traceRecords(testCase);
  v1Cross.find(
    (record) => record.recordType === 'renderer-batch'
  ).analysisConfig = {
    state: 'resolved',
    value: completedBatch(testCase).analysisConfig,
  };
  assert.throws(() => parseTraceJsonl(Buffer.from(traceText(v1Cross))), {
    code: 'INVALID_TRACE_SHAPE',
  });

  const v2Cross = v2TraceRecords(testCase);
  v2Cross.find(
    (record) =>
      record.recordType === 'renderer-batch' && record.actionId === 'action-a'
  ).analysisConfig = completedBatch(testCase).analysisConfig;
  assert.throws(() => parseTraceJsonl(Buffer.from(traceText(v2Cross))), {
    code: 'INVALID_TRACE_SHAPE',
  });

  const unknown = traceRecords(testCase);
  unknown[0].schemaVersion = 3;
  assert.throws(() => parseTraceJsonl(Buffer.from(traceText(unknown))), {
    code: 'UNSUPPORTED_TRACE_RECORD',
  });
});

test('strictly rejects every contradictory unavailable v2 arm', () => {
  const testCase = stillCase();
  for (const mutate of [
    (batch) => (batch.input.control = 'snapToReal'),
    (batch) => (batch.input.targetState = 'number'),
    (batch) => (batch.rendererDroppedEventCount = 1),
    (batch) => (batch.observedOutcome.status = 'cancelled'),
    (batch) => (batch.observedOutcome.reasonCode = 'trace-dropped'),
    (batch) => (batch.observedOutcome.associationChecks = {}),
    (batch) => (batch.observedOutcome.measurements = { run_kmeans_ms: 1 }),
    (batch) => batch.events.splice(1, 1),
    (batch) => (batch.events[1].data.sourceMatches = false),
    (batch) => (batch.analysisConfig.reasonCode = 'other'),
  ]) {
    const batch = unavailableBatch(testCase);
    mutate(batch);
    assert.throws(() =>
      parseTraceJsonl(Buffer.from(`${JSON.stringify(batch)}\n`))
    );
  }
});

test('unavailable event data is present, exact, and runtime-validated', () => {
  const valid = unavailableBatch(stillCase());
  assert.equal(
    parseTraceJsonl(Buffer.from(`${JSON.stringify(valid)}\n`)).records[0]
      .analysisConfig.reasonCode,
    'input-target-invalid'
  );

  for (const index of [0, 1, 2]) {
    const batch = unavailableBatch(stillCase());
    delete batch.events[index].data;
    assert.throws(
      () => parseTraceJsonl(Buffer.from(`${JSON.stringify(batch)}\n`)),
      { code: 'MISSING_EVENT_DATA' }
    );
  }

  for (const mutate of [
    (batch) => (batch.events[0].data.control = 'snapToReal'),
    (batch) => (batch.events[0].data.targetNumber = 1),
    (batch) => (batch.events[1].data.targetMatches = true),
    (batch) => (batch.events[2].data.status = 'completed'),
    (batch) => (batch.events[2].data.extra = true),
  ]) {
    const batch = unavailableBatch(stillCase());
    mutate(batch);
    assert.throws(() =>
      parseTraceJsonl(Buffer.from(`${JSON.stringify(batch)}\n`))
    );
  }
});

test('selected unavailable v2 action fails normally and remains an honest diagnostic', async () => {
  const testCase = stillCase();
  const records = v2TraceRecords(testCase);
  const actions = [
    { id: 'action-invalid', sequence: 1 },
    { id: 'action-a', sequence: 2 },
  ];
  await withFixture({ testCase, records, actions }, async ({ paths }) => {
    await assert.rejects(importTraceRun(importOptions(paths)), {
      code: 'ACTION_CASE_CONFIG_UNAVAILABLE',
    });
  });
  await withFixture(
    { testCase, records: v2TraceRecords(testCase), actions },
    async ({ paths }) => {
      const { run, receipt } = await importTraceRun(importOptions(paths, true));
      const attempt = run.attempts[0];
      assert.deepEqual(receipt.problemCodes, [
        'ACTION_CASE_CONFIG_UNAVAILABLE',
      ]);
      assert.equal(attempt.terminals[0].status, 'unverified');
      assert.equal(attempt.terminals[0].reasonCode, 'input-target-invalid');
      assert.equal(attempt.freshExecution.status, 'unproven');
      assert.ok(
        attempt.measurements.every((measurement) => measurement.value === null)
      );
    }
  );
});

test('selected unavailable action still verifies available render config', async () => {
  const actions = [
    { id: 'action-invalid', sequence: 1 },
    { id: 'action-a', sequence: 2 },
  ];

  for (const variant of ['mismatch', 'expected-unavailable']) {
    const testCase = stillCase();
    const records = v2TraceRecords(testCase);
    const invalid = records.find(
      (record) =>
        record.recordType === 'renderer-batch' &&
        record.actionId === 'action-invalid'
    );
    if (variant === 'mismatch') {
      invalid.renderConfig.showAxisLabels = false;
      const close = records.find(
        (record) =>
          record.recordType === 'action-close' &&
          record.actionId === 'action-invalid'
      );
      close.acceptedByteCount = Buffer.byteLength(JSON.stringify(invalid)) + 1;
    } else {
      testCase.renderConfig.showAxisLabels = {
        value: null,
        unavailableReason: 'not-collected',
      };
    }

    await withFixture({ testCase, records, actions }, async ({ paths }) => {
      const { run, receipt } = await importTraceRun(importOptions(paths, true));
      assert.deepEqual(receipt.problemCodes, [
        'ACTION_CASE_CONFIG_MISMATCH',
        'ACTION_CASE_CONFIG_UNAVAILABLE',
      ]);
      assert.equal(
        run.attempts[0].terminals[0].reasonCode,
        'acquisition-binding-unverified'
      );
    });
  }
});

test('completed import maps eight same-clock endpoints into valid A1', async () => {
  await withFixture({}, async ({ paths }) => {
    const { run } = await importTraceRun(importOptions(paths));
    assert.equal(validateRunRecord(run), run);
    const attempt = run.attempts[0];
    assert.equal(attempt.terminals[0].status, 'completed');
    assert.equal(attempt.freshExecution.status, 'proven');
    assert.equal(attempt.measurements.length, 8);
    assert.equal(
      attempt.measurements.find(
        (item) => item.endpoint === 'native_analyze_aggregate_ms'
      ).value,
      200
    );
    assert.equal(
      attempt.measurements.find((item) => item.endpoint === 'run_kmeans_ms')
        .value,
      95
    );
    assert.ok(
      attempt.measurements.every((item) => item.method === 'instrument-span')
    );
  });
});

test('mixed clocks and forged native aggregates reject without cross-clock subtraction', async () => {
  for (const [mutate, code] of [
    [
      (records) => {
        records[2].nativeClockId = 'native-clock-b';
      },
      'MIXED_CLOCK_DOMAIN',
    ],
    [
      (records) => {
        records[2].nativeAggregateNs = '199999999';
      },
      'NATIVE_AGGREGATE_MISMATCH',
    ],
  ]) {
    const testCase = stillCase();
    const records = traceRecords(testCase);
    mutate(records);
    await withFixture({ testCase, records }, async ({ paths }) => {
      await assert.rejects(importTraceRun(importOptions(paths)), { code });
    });
  }
});

test('unknown trace fields and non-absolute I/O reject', async () => {
  const records = traceRecords(stillCase());
  records[0].privatePath = '/secret/source.mov';
  assert.throws(() => parseTraceJsonl(Buffer.from(traceText(records))), {
    code: 'INVALID_TRACE_SHAPE',
  });
  await assert.rejects(
    importTraceRun({
      tracePath: 'trace.jsonl',
      bindingPath: 'binding.json',
      buildPath: 'build.json',
      casePath: 'case.json',
      outputPath: 'output.json',
    }),
    { code: 'INPUT_PATH_NOT_ABSOLUTE' }
  );
  await withFixture({}, async ({ paths }) => {
    await writeFile(paths.output, '{}');
    await assert.rejects(importTraceRun(importOptions(paths)), {
      code: 'OUTPUT_EXISTS',
    });
  });
});

test('canonical input omits inactive option arms instead of serializing null', () => {
  const records = traceRecords(stillCase());
  const batch = records.find(
    (record) => record.recordType === 'renderer-batch'
  );
  batch.input.targetBoolean = null;
  batch.events.find(
    (event) => event.type === 'delivered_input'
  ).data.targetBoolean = null;
  assert.throws(() => parseTraceJsonl(Buffer.from(traceText(records))), {
    code: 'INVALID_INPUT_OBSERVATION',
  });
});
