#!/usr/bin/env node

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ManifestError,
  canonicalStringify,
  compareCodeUnits,
  parseCliArgs,
  readJsonFile,
  redactOpaqueId,
  safeErrorCode,
  validateRunRecord,
  writePrivateJson,
} from './validate-manifest.mjs';
import { EXCLUSION_REASONS } from './validation-primitives.mjs';

const MAX_RUN_RECORDS = 64;
const MAX_INCLUDED_VALUES = MAX_RUN_RECORDS * 10_000;
const ROLE_KEYS = new Set(['setup', 'reset', 'warmup', 'measured']);
const OUTCOME_KEYS = new Set([
  'completed',
  'failed',
  'cancelled',
  'stale',
  'cache',
  'deduped',
  'timeout',
  'unverified',
]);
const FRESH_EXECUTION_KEYS = new Set(['proven', 'unproven', 'not-applicable']);

function fail(code) {
  throw new ManifestError(code);
}

function count(target, key) {
  target[key] = (target[key] ?? 0) + 1;
}

function availableKey(value) {
  return value.value === null
    ? { value: null, unavailableReason: value.unavailableReason }
    : { value: value.value, unavailableReason: null };
}

function caseIdentity(caseRef) {
  return {
    id: caseRef.id,
    digestSha256: caseRef.digestSha256,
    sourceDigestSha256: caseRef.sourceDigestSha256,
    configDigestSha256: caseRef.configDigestSha256,
    requestedFrameSeconds: availableKey(caseRef.requestedFrameSeconds),
    achievedFrameSeconds: availableKey(caseRef.achievedFrameSeconds),
    frameStatus: caseRef.frameStatus,
    decodedFrameDigestSha256: availableKey(caseRef.decodedFrameDigestSha256),
  };
}

function strataIdentity(strata) {
  return {
    process: strata.process,
    cache: strata.cache,
    workload: strata.workload,
    visibility: strata.visibility,
  };
}

function attemptGroupIdentity(run, attempt) {
  return {
    build: {
      id: run.buildRef.id,
      digestSha256: run.buildRef.digestSha256,
    },
    case: caseIdentity(run.caseRef),
    operation: run.operation,
    strata: strataIdentity(attempt.strata),
  };
}

function measurementGroupIdentity(run, attempt, measurement) {
  return {
    ...attemptGroupIdentity(run, attempt),
    measurement: {
      endpoint: measurement.endpoint,
      unit: measurement.unit,
      clock: measurement.clock,
      method: measurement.method,
      precision: measurement.precision,
      evidenceLevel: measurement.evidenceLevel,
    },
  };
}

function median(values) {
  if (values.length === 0) return null;
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0
    ? (ordered[middle - 1] + ordered[middle]) / 2
    : ordered[middle];
}

function validateMergedIdentity(records) {
  const runIds = new Set();
  const attemptIds = new Set();
  const buildIds = new Map();
  const caseIds = new Map();
  for (const run of records) {
    if (runIds.has(run.id)) fail('DUPLICATE_RUN_ID');
    runIds.add(run.id);
    const priorBuild = buildIds.get(run.buildRef.id);
    if (priorBuild && priorBuild !== run.buildRef.digestSha256)
      fail('MIXED_BUILD_REFERENCE');
    buildIds.set(run.buildRef.id, run.buildRef.digestSha256);
    const currentCase = canonicalStringify(caseIdentity(run.caseRef));
    const priorCase = caseIds.get(run.caseRef.id);
    if (priorCase && priorCase !== currentCase) fail('MIXED_CASE_REFERENCE');
    caseIds.set(run.caseRef.id, currentCase);
    for (const attempt of run.attempts) {
      if (attemptIds.has(attempt.id))
        fail('DUPLICATE_ATTEMPT_ID_ACROSS_INPUTS');
      attemptIds.add(attempt.id);
    }
  }
}

function newAttemptGroup(key) {
  return {
    key,
    attemptCount: 0,
    roleCounts: {},
    outcomeCounts: {},
    freshExecutionCounts: {},
    excludedReasonCounts: {},
    measuredCount: 0,
    measurementBearingAttemptCount: 0,
    zeroMeasurementAttemptCount: 0,
    measurementCount: 0,
  };
}

function newMeasurementGroup(key) {
  return {
    key,
    attemptCount: 0,
    roleCounts: {},
    outcomeCounts: {},
    freshExecutionCounts: {},
    excludedReasonCounts: {},
    measuredCount: 0,
    eligibleCount: 0,
    unavailableCount: 0,
    includedValues: [],
    median: null,
    min: null,
    max: null,
  };
}

function recordAttempt(group, attempt, terminal) {
  group.attemptCount += 1;
  count(group.roleCounts, attempt.role);
  count(group.outcomeCounts, terminal.status);
  count(group.freshExecutionCounts, attempt.freshExecution.status);
  if (attempt.role === 'measured') group.measuredCount += 1;
  if (attempt.exclusionReason !== null) {
    count(group.excludedReasonCounts, attempt.exclusionReason);
  }
}

export function measurementStatistics(values) {
  if (!Array.isArray(values) || values.length > MAX_INCLUDED_VALUES)
    fail('INVALID_VALUES');
  let minimum = null;
  let maximum = null;
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
      fail('INVALID_VALUES');
    if (minimum === null || value < minimum) minimum = value;
    if (maximum === null || value > maximum) maximum = value;
  }
  return { median: median(values), min: minimum, max: maximum };
}

function finalizeMeasurementGroup(group) {
  const statistics = measurementStatistics(group.includedValues);
  group.median = statistics.median;
  group.min = statistics.min;
  group.max = statistics.max;
  return group;
}

function sortedGroups(groups, finalize = (group) => group) {
  return [...groups.entries()]
    .sort(([left], [right]) => compareCodeUnits(left, right))
    .map(([, group]) => finalize(group));
}

export function summarizeRunRecords(inputRecords) {
  if (
    !Array.isArray(inputRecords) ||
    inputRecords.length === 0 ||
    inputRecords.length > MAX_RUN_RECORDS
  ) {
    fail('INVALID_RUN_RECORD_COUNT');
  }
  const records = inputRecords.map((record) => validateRunRecord(record));
  validateMergedIdentity(records);
  const attemptGroups = new Map();
  const measurementGroups = new Map();
  const orderedRecords = [...records].sort((left, right) =>
    compareCodeUnits(left.id, right.id)
  );
  for (const run of orderedRecords) {
    const orderedAttempts = [...run.attempts].sort(
      (left, right) =>
        left.sequence - right.sequence || compareCodeUnits(left.id, right.id)
    );
    for (const attempt of orderedAttempts) {
      const terminal = attempt.terminals[0];
      const attemptIdentity = attemptGroupIdentity(run, attempt);
      const attemptKey = canonicalStringify(attemptIdentity);
      const attemptGroup =
        attemptGroups.get(attemptKey) ?? newAttemptGroup(attemptIdentity);
      attemptGroups.set(attemptKey, attemptGroup);
      recordAttempt(attemptGroup, attempt, terminal);
      attemptGroup.measurementCount += attempt.measurements.length;
      if (attempt.measurements.length === 0)
        attemptGroup.zeroMeasurementAttemptCount += 1;
      else attemptGroup.measurementBearingAttemptCount += 1;

      for (const measurement of attempt.measurements) {
        const identity = measurementGroupIdentity(run, attempt, measurement);
        const serialized = canonicalStringify(identity);
        const group =
          measurementGroups.get(serialized) ?? newMeasurementGroup(identity);
        measurementGroups.set(serialized, group);
        recordAttempt(group, attempt, terminal);
        if (measurement.value === null) group.unavailableCount += 1;
        const eligible =
          attempt.role === 'measured' &&
          terminal.status === 'completed' &&
          attempt.freshExecution.status === 'proven' &&
          attempt.exclusionReason === null &&
          measurement.value !== null;
        if (eligible) {
          group.eligibleCount += 1;
          group.includedValues.push(measurement.value);
        } else if (attempt.exclusionReason === null) {
          count(
            group.excludedReasonCounts,
            measurement.value === null
              ? 'unavailable-measurement'
              : 'noncompleted'
          );
        }
      }
    }
  }
  return {
    version: 1,
    kind: 'run-summary',
    inputRunCount: records.length,
    inputAttemptCount: records.reduce(
      (total, run) => total + run.attempts.length,
      0
    ),
    attemptGroups: sortedGroups(attemptGroups),
    groups: sortedGroups(measurementGroups, finalizeMeasurementGroup),
  };
}

function redactAvailability(value) {
  return {
    value: value.value,
    unavailableReason: value.unavailableReason,
  };
}

function redactCounts(counts, allowedKeys) {
  return Object.fromEntries(
    Object.entries(counts).filter(([key]) => allowedKeys.has(key))
  );
}

function redactCaseKey(value) {
  return {
    id: redactOpaqueId('case-id', value.id),
    digestSha256: value.digestSha256,
    sourceDigestSha256: value.sourceDigestSha256,
    configDigestSha256: value.configDigestSha256,
    requestedFrameSeconds: redactAvailability(value.requestedFrameSeconds),
    achievedFrameSeconds: redactAvailability(value.achievedFrameSeconds),
    frameStatus: value.frameStatus,
    decodedFrameDigestSha256: redactAvailability(
      value.decodedFrameDigestSha256
    ),
  };
}

function redactStrata(value) {
  return {
    process: value.process,
    cache: value.cache,
    workload: value.workload,
    visibility: value.visibility,
  };
}

function redactMeasurementKey(value) {
  return {
    endpoint: redactOpaqueId('measurement-endpoint', value.endpoint),
    unit: value.unit,
    clock: redactOpaqueId('measurement-clock', value.clock),
    method: value.method,
    precision: value.precision,
    evidenceLevel: value.evidenceLevel,
  };
}

function redactGroupKey(key) {
  return {
    build: {
      id: redactOpaqueId('build-id', key.build.id),
      digestSha256: key.build.digestSha256,
    },
    case: redactCaseKey(key.case),
    operation: key.operation,
    strata: redactStrata(key.strata),
    ...(key.measurement
      ? {
          measurement: redactMeasurementKey(key.measurement),
        }
      : {}),
  };
}

function redactAttemptGroup(group) {
  return {
    key: redactGroupKey(group.key),
    attemptCount: group.attemptCount,
    roleCounts: redactCounts(group.roleCounts, ROLE_KEYS),
    outcomeCounts: redactCounts(group.outcomeCounts, OUTCOME_KEYS),
    freshExecutionCounts: redactCounts(
      group.freshExecutionCounts,
      FRESH_EXECUTION_KEYS
    ),
    excludedReasonCounts: redactCounts(
      group.excludedReasonCounts,
      EXCLUSION_REASONS
    ),
    measuredCount: group.measuredCount,
    measurementBearingAttemptCount: group.measurementBearingAttemptCount,
    zeroMeasurementAttemptCount: group.zeroMeasurementAttemptCount,
    measurementCount: group.measurementCount,
  };
}

function redactMeasurementGroup(group) {
  return {
    key: redactGroupKey(group.key),
    attemptCount: group.attemptCount,
    roleCounts: redactCounts(group.roleCounts, ROLE_KEYS),
    outcomeCounts: redactCounts(group.outcomeCounts, OUTCOME_KEYS),
    freshExecutionCounts: redactCounts(
      group.freshExecutionCounts,
      FRESH_EXECUTION_KEYS
    ),
    excludedReasonCounts: redactCounts(
      group.excludedReasonCounts,
      EXCLUSION_REASONS
    ),
    measuredCount: group.measuredCount,
    eligibleCount: group.eligibleCount,
    unavailableCount: group.unavailableCount,
    includedValues: [...group.includedValues],
    median: group.median,
    min: group.min,
    max: group.max,
  };
}

export function redactRunSummary(summary) {
  return {
    version: summary.version,
    kind: summary.kind,
    inputRunCount: summary.inputRunCount,
    inputAttemptCount: summary.inputAttemptCount,
    attemptGroups: summary.attemptGroups.map(redactAttemptGroup),
    groups: summary.groups.map(redactMeasurementGroup),
  };
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2), {
    '--input': 'many',
    '--output': 'value',
  });
  const inputPaths = args['--input'] ?? [];
  if (inputPaths.length === 0 || inputPaths.length > MAX_RUN_RECORDS)
    fail('INVALID_RUN_RECORD_COUNT');
  const records = [];
  for (const inputPath of inputPaths)
    records.push(await readJsonFile(inputPath));
  const summary = redactRunSummary(summarizeRunRecords(records));
  if (args['--output']) {
    await writePrivateJson(args['--output'], summary);
    process.stdout.write(
      `${JSON.stringify({ groupCount: summary.groups.length, written: true })}\n`
    );
  } else {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    process.stderr.write(`run summary failed: ${safeErrorCode(error)}\n`);
    process.exitCode = 1;
  });
}
