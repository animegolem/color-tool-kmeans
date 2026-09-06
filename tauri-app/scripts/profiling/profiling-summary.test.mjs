import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SHA_B,
  SHA_C,
  SHA_D,
  attempt,
  clone,
  measurement,
  recursivelyReverseKeys,
  runRecord,
} from './profiling-fixtures.mjs';
import {
  measurementStatistics,
  redactRunSummary,
  summarizeRunRecords,
} from './summarize-runs.mjs';

test('summary known vectors produce count, median, min, max, and raw values', () => {
  const values = [93, 95, 104, 94, 100, 93];
  const attempts = values.map((value, index) =>
    attempt({
      id: `visible-${index}`,
      sequence: index + 1,
      measurements: [measurement({ value })],
    })
  );
  const summary = summarizeRunRecords([runRecord({ attempts })]);
  assert.equal(summary.groups.length, 1);
  assert.deepEqual(summary.groups[0].includedValues, values);
  assert.equal(summary.groups[0].eligibleCount, 6);
  assert.equal(summary.groups[0].median, 94.5);
  assert.equal(summary.groups[0].min, 93);
  assert.equal(summary.groups[0].max, 104);
  assert.equal('p95' in summary.groups[0], false);
  assert.equal('ratio' in summary.groups[0], false);
});

test('attempt accounting counts each attempt once independently of endpoints', () => {
  const record = runRecord();
  record.attempts[0].measurements.push(
    measurement({
      endpoint: 'pending-ready',
      value: 132,
      method: 'app-log-interval',
      evidenceLevel: 'app-log',
      evidenceRefs: ['log'],
    })
  );
  const summary = summarizeRunRecords([record]);
  assert.equal(summary.inputAttemptCount, 1);
  assert.equal(summary.attemptGroups.length, 1);
  assert.equal(summary.attemptGroups[0].attemptCount, 1);
  assert.equal(summary.attemptGroups[0].measurementBearingAttemptCount, 1);
  assert.equal(summary.attemptGroups[0].measurementCount, 2);
  assert.equal(summary.groups.length, 2);
  assert.equal(
    summary.groups.reduce((total, group) => total + group.attemptCount, 0),
    2
  );
});

test('zero-measurement failures remain in endpoint-independent outcome counts', () => {
  const failed = attempt({
    status: 'failed',
    freshStatus: 'unproven',
    exclusionReason: 'failed',
    measurements: [],
  });
  const summary = summarizeRunRecords([runRecord({ attempts: [failed] })]);
  assert.equal(summary.inputAttemptCount, 1);
  assert.equal(summary.groups.length, 0);
  assert.equal(summary.attemptGroups.length, 1);
  assert.equal(summary.attemptGroups[0].attemptCount, 1);
  assert.equal(summary.attemptGroups[0].outcomeCounts.failed, 1);
  assert.equal(summary.attemptGroups[0].excludedReasonCounts.failed, 1);
  assert.equal(summary.attemptGroups[0].zeroMeasurementAttemptCount, 1);
});

test('summary separates hidden visibility and distinct endpoint methods', () => {
  const visible = attempt({
    id: 'visible',
    measurements: [
      measurement({ value: 95 }),
      measurement({
        endpoint: 'pending-ready',
        value: 132,
        method: 'app-log-interval',
        evidenceLevel: 'app-log',
        evidenceRefs: ['log'],
      }),
    ],
  });
  const hidden = attempt({
    id: 'hidden',
    sequence: 2,
    visibility: 'hidden',
    freshStatus: 'unproven',
    exclusionReason: 'visibility-caveat',
  });
  const summary = summarizeRunRecords([
    runRecord({ attempts: [visible, hidden] }),
  ]);
  assert.equal(summary.attemptGroups.length, 2);
  assert.equal(summary.groups.length, 3);
});

test('summary retains setup, reset, warmup, cache, failure, timeout, and unavailable outcomes', () => {
  const definitions = [
    ['setup', 'completed', 'not-applicable', 'setup'],
    ['reset', 'completed', 'proven', 'reset'],
    ['warmup', 'completed', 'proven', 'warmup'],
    ['measured', 'cache', 'unproven', 'cache'],
    ['measured', 'deduped', 'unproven', 'deduped'],
    ['measured', 'stale', 'unproven', 'stale'],
    ['measured', 'cancelled', 'unproven', 'cancelled'],
    ['measured', 'failed', 'unproven', 'failed'],
    ['measured', 'timeout', 'unproven', 'timeout'],
    ['measured', 'unverified', 'unproven', 'unverified'],
  ];
  const attempts = definitions.map(
    ([role, status, freshStatus, exclusionReason], index) =>
      attempt({
        id: `outcome-${index}`,
        sequence: index + 1,
        role,
        status,
        freshStatus,
        exclusionReason,
        measurements: [
          measurement({
            value: status === 'completed' ? 10 + index : null,
            evidenceRefs: status === 'completed' ? ['ui'] : [],
          }),
        ],
      })
  );
  const summary = summarizeRunRecords([runRecord({ attempts })]);
  const attemptGroup = summary.attemptGroups[0];
  assert.equal(attemptGroup.attemptCount, 10);
  assert.equal(attemptGroup.outcomeCounts.timeout, 1);
  assert.equal(attemptGroup.outcomeCounts.cache, 1);
  assert.equal(attemptGroup.outcomeCounts.deduped, 1);
  assert.equal(attemptGroup.outcomeCounts.stale, 1);
  assert.equal(attemptGroup.outcomeCounts.cancelled, 1);
  assert.equal(attemptGroup.excludedReasonCounts.warmup, 1);
  assert.equal(summary.groups[0].eligibleCount, 0);
  assert.equal(summary.groups[0].unavailableCount, 7);
});

test('summary does not pool process, cache, workload, build, case, or frame strata', () => {
  const records = [
    runRecord({ id: 'run-1' }),
    runRecord({
      id: 'run-2',
      buildId: 'build-b',
      buildDigest: SHA_B,
      caseId: 'case-b',
      caseDigest: SHA_C,
      sourceDigest: SHA_D,
      configDigest: 'a'.repeat(64),
      frameStatus: 'exact',
      attempts: [
        attempt({
          id: 'attempt-2',
          process: 'fresh',
          cache: 'cold',
          workload: 'quiet-observed',
        }),
      ],
    }),
  ];
  records[1].caseRef.achievedFrameSeconds = clone(
    records[1].caseRef.requestedFrameSeconds
  );
  const summary = summarizeRunRecords(records);
  assert.equal(summary.attemptGroups.length, 2);
  assert.equal(summary.groups.length, 2);
});

test('same source and close timestamp do not collapse distinct frame-status cases', () => {
  const unmatched = runRecord();
  const exact = runRecord({
    id: 'run-b',
    caseId: 'case-b',
    caseDigest: SHA_C,
    frameStatus: 'exact',
    attempts: [attempt({ id: 'attempt-2' })],
  });
  exact.caseRef.achievedFrameSeconds = clone(
    exact.caseRef.requestedFrameSeconds
  );
  const summary = summarizeRunRecords([unmatched, exact]);
  assert.deepEqual(
    summary.groups.map((group) => group.key.case.frameStatus).sort(),
    ['exact', 'unmatched']
  );
});

test('merged records reject duplicate attempt IDs and genuinely mixed references', () => {
  const duplicateAttempt = runRecord({ id: 'run-b' });
  assert.throws(() => summarizeRunRecords([runRecord(), duplicateAttempt]), {
    code: 'DUPLICATE_ATTEMPT_ID_ACROSS_INPUTS',
  });
  const mixedBuild = runRecord({
    id: 'run-b',
    buildDigest: SHA_B,
    attempts: [attempt({ id: 'attempt-2' })],
  });
  assert.throws(() => summarizeRunRecords([runRecord(), mixedBuild]), {
    code: 'MIXED_BUILD_REFERENCE',
  });
  const mixedCase = runRecord({
    id: 'run-b',
    sourceDigest: SHA_D,
    attempts: [attempt({ id: 'attempt-2' })],
  });
  assert.throws(() => summarizeRunRecords([runRecord(), mixedCase]), {
    code: 'MIXED_CASE_REFERENCE',
  });
});

test('canonical grouping ignores recursive object-key order and input-record order', () => {
  const first = runRecord();
  const second = runRecord({
    id: 'run-b',
    attempts: [attempt({ id: 'attempt-2' })],
  });
  const permutedSecond = recursivelyReverseKeys(second);
  const forward = summarizeRunRecords([first, second]);
  const reverseAndPermuted = summarizeRunRecords([permutedSecond, first]);
  assert.deepEqual(forward, reverseAndPermuted);
  assert.equal(forward.groups.length, 1);
  assert.equal(forward.attemptGroups.length, 1);
});

test('canonical case-reference comparison ignores property order but not values', () => {
  const first = runRecord();
  const reordered = runRecord({
    id: 'run-b',
    attempts: [attempt({ id: 'attempt-2' })],
  });
  reordered.caseRef = recursivelyReverseKeys(reordered.caseRef);
  assert.equal(summarizeRunRecords([first, reordered]).groups.length, 1);
  reordered.caseRef.sourceDigestSha256 = SHA_D;
  assert.throws(() => summarizeRunRecords([first, reordered]), {
    code: 'MIXED_CASE_REFERENCE',
  });
});

test('redacted summaries digest every caller-controlled identifier in output keys', () => {
  const sentinel = 'private-source-name.mov';
  const record = runRecord({ buildId: sentinel, caseId: sentinel });
  record.attempts[0].measurements[0].endpoint = sentinel;
  record.attempts[0].measurements[0].clock = sentinel;
  const full = summarizeRunRecords([record]);
  full.groups[0].callerExtra = sentinel;
  const redacted = redactRunSummary(full);
  const serialized = JSON.stringify(redacted);
  assert.equal(serialized.includes(sentinel), false);
  assert.match(redacted.groups[0].key.build.id, /^redacted:build-id:/);
  assert.match(redacted.groups[0].key.case.id, /^redacted:case-id:/);
  assert.match(
    redacted.groups[0].key.measurement.endpoint,
    /^redacted:measurement-endpoint:/
  );
  assert.match(
    redacted.groups[0].key.measurement.clock,
    /^redacted:measurement-clock:/
  );
});

test('redacted summary join keys are deterministic and namespace-bound', () => {
  const record = runRecord({ buildId: 'same-id', caseId: 'same-id' });
  const first = redactRunSummary(summarizeRunRecords([record]));
  const second = redactRunSummary(summarizeRunRecords([clone(record)]));
  assert.deepEqual(first, second);
  assert.notEqual(first.groups[0].key.build.id, first.groups[0].key.case.id);
});

test('redacted summaries omit private evidence text, paths, commands, and raw errors', () => {
  const serialized = JSON.stringify(
    redactRunSummary(summarizeRunRecords([runRecord()]))
  );
  for (const secret of [
    '/private/raw.tsv',
    '/private/raw.log',
    'private note',
    'raw error text',
  ]) {
    assert.equal(serialized.includes(secret), false);
  }
});

test('exported redactor strips unknown nested fields and count-map keys', () => {
  const sentinel = 'private-source-name.mov';
  const summary = summarizeRunRecords([runRecord()]);
  const attemptGroup = summary.attemptGroups[0];
  const endpointGroup = summary.groups[0];
  attemptGroup.key.build.privateNote = sentinel;
  attemptGroup.key.case.privateNote = sentinel;
  attemptGroup.key.case.requestedFrameSeconds.privateNote = sentinel;
  attemptGroup.key.strata.privateNote = sentinel;
  attemptGroup.roleCounts[sentinel] = 1;
  attemptGroup.outcomeCounts[sentinel] = 1;
  attemptGroup.freshExecutionCounts[sentinel] = 1;
  attemptGroup.excludedReasonCounts[sentinel] = 1;
  endpointGroup.key.case.decodedFrameDigestSha256.privateNote = sentinel;
  endpointGroup.key.strata.privateNote = sentinel;
  endpointGroup.key.measurement.command = sentinel;
  endpointGroup.roleCounts[sentinel] = 1;
  endpointGroup.outcomeCounts[sentinel] = 1;
  endpointGroup.freshExecutionCounts[sentinel] = 1;
  endpointGroup.excludedReasonCounts[sentinel] = 1;
  const redacted = redactRunSummary(summary);
  assert.equal(JSON.stringify(redacted).includes(sentinel), false);
});

test('bounded statistics handle arrays beyond spread-call limits', () => {
  const values = Array.from({ length: 200_000 }, (_, index) => index % 1000);
  assert.deepEqual(measurementStatistics(values), {
    median: 499.5,
    min: 0,
    max: 999,
  });
  assert.throws(() => measurementStatistics(new Array(640_001).fill(1)), {
    code: 'INVALID_VALUES',
  });
  assert.throws(() => measurementStatistics([Number.NaN]), {
    code: 'INVALID_VALUES',
  });
});
