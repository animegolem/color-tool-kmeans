import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  available,
  buildManifest,
  caseManifest,
  claim,
  clone,
  measurement,
  runRecord,
  unavailable,
} from './profiling-fixtures.mjs';
import {
  ManifestError,
  parseCliArgs,
  validateBuildManifest,
  validateCaseManifest,
  validateRunRecord,
} from './validate-manifest.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

function requiredKeys(schema, fixture) {
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(Object.keys(fixture).sort(), [...schema.required].sort());
}

test('v1 runtime validators accept representative build, case, and run records', () => {
  assert.equal(validateBuildManifest(buildManifest()).kind, 'build');
  assert.equal(validateCaseManifest(caseManifest()).kind, 'case');
  assert.equal(validateRunRecord(runRecord()).kind, 'run');
});

test('build schema nested wire contracts agree with emitted records', async () => {
  const fixture = buildManifest();
  const schema = JSON.parse(
    await readFile(join(HERE, 'schema/build-manifest.schema.json'), 'utf8')
  );
  requiredKeys(schema, fixture);
  requiredKeys(schema.properties.executable, fixture.executable);
  requiredKeys(schema.properties.artifacts, fixture.artifacts);
  requiredKeys(schema.properties.toolchain.items, fixture.toolchain[0]);
  requiredKeys(schema.$defs.evidence, fixture.evidence[0]);
  requiredKeys(schema.$defs.stringClaim, fixture.commit);
  requiredKeys(schema.$defs.artifact, {
    id: 'artifact',
    localPath: '/private/artifact',
    digestSha256: 'a'.repeat(64),
    evidenceRefs: [],
  });
  assert.equal(
    schema.$defs.commitClaim.allOf[1].else.properties.value.pattern,
    '^(?:[a-f0-9]{40}|[a-f0-9]{64})$'
  );
  assert.match(
    fixture.executable.uuid.value,
    new RegExp(schema.$defs.uuidClaim.allOf[1].else.properties.value.pattern)
  );
});

test('case schema nested wire contracts and quality domain agree with records', async () => {
  const fixture = caseManifest();
  const schema = JSON.parse(
    await readFile(join(HERE, 'schema/case-manifest.schema.json'), 'utf8')
  );
  requiredKeys(schema, fixture);
  requiredKeys(schema.properties.source, fixture.source);
  requiredKeys(schema.properties.frame, fixture.frame);
  requiredKeys(schema.properties.viewport, fixture.viewport);
  requiredKeys(schema.properties.verification, fixture.verification);
  requiredKeys(schema.$defs.analysisConfig, fixture.analysisConfig);
  requiredKeys(schema.$defs.renderConfig, fixture.renderConfig);
  requiredKeys(schema.$defs.evidence, fixture.evidence[0]);
  assert.equal(schema.$defs.qualityValue.properties.value.minimum, 0);
  assert.equal(schema.$defs.qualityValue.properties.value.maximum, 4);
  assert.equal(schema.$defs.qualityValue.allOf[0].$ref, '#/$defs/availability');
  assert.equal(
    schema.$defs.availability.then.properties.unavailableReason.$ref,
    '#/$defs/unavailableReason'
  );
});

test('run schema nested wire contracts and measurement pairs agree with records', async () => {
  const fixture = runRecord();
  const schema = JSON.parse(
    await readFile(join(HERE, 'schema/run-record.schema.json'), 'utf8')
  );
  requiredKeys(schema, fixture);
  requiredKeys(schema.properties.buildRef, fixture.buildRef);
  requiredKeys(schema.properties.caseRef, fixture.caseRef);
  requiredKeys(schema.$defs.attempt, fixture.attempts[0]);
  requiredKeys(schema.$defs.strata, fixture.attempts[0].strata);
  requiredKeys(
    schema.$defs.attempt.properties.action,
    fixture.attempts[0].action
  );
  requiredKeys(
    schema.$defs.attempt.properties.terminals.items,
    fixture.attempts[0].terminals[0]
  );
  requiredKeys(
    schema.$defs.attempt.properties.freshExecution,
    fixture.attempts[0].freshExecution
  );
  requiredKeys(schema.$defs.measurement, fixture.attempts[0].measurements[0]);
  requiredKeys(schema.$defs.evidence, fixture.evidence[0]);
  assert.equal(schema.$defs.numericValue.allOf[0].$ref, '#/$defs/availability');
  assert.equal(schema.$defs.measurement.allOf[2].oneOf.length, 4);
  assert.equal(schema.$defs.attempt.properties.terminals.items.allOf.length, 1);
  assert.equal(schema.$defs.attempt.properties.freshExecution.allOf.length, 1);
});

test('validators reject unknown fields and versions', () => {
  const unknown = buildManifest();
  unknown.surprise = true;
  assert.throws(() => validateBuildManifest(unknown), {
    code: 'UNKNOWN_FIELD',
  });
  const version = caseManifest();
  version.version = 2;
  assert.throws(() => validateCaseManifest(version), {
    code: 'UNSUPPORTED_VERSION',
  });
});

test('case quality accepts every real preset from zero through four', () => {
  for (const quality of [0, 1, 2, 3, 4]) {
    const fixture = caseManifest();
    fixture.analysisConfig.quality = available(quality);
    assert.equal(
      validateCaseManifest(fixture).analysisConfig.quality.value,
      quality
    );
  }
});

test('case quality rejects negative, out-of-domain, fractional, and nonfinite values', () => {
  for (const quality of [-1, 5, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    const fixture = caseManifest();
    fixture.analysisConfig.quality = available(quality);
    assert.throws(() => validateCaseManifest(fixture));
  }
});

test('case validation preserves unavailable values and rejects zero-like substitutions', () => {
  const valid = caseManifest();
  valid.viewport.scale = unavailable('not-exposed');
  assert.equal(validateCaseManifest(valid).viewport.scale.value, null);
  const invalid = caseManifest();
  invalid.viewport.scale = { value: null, unavailableReason: null };
  assert.throws(() => validateCaseManifest(invalid), { code: 'INVALID_ENUM' });
});

test('case validation enforces config types', () => {
  const fixture = caseManifest();
  fixture.analysisConfig.clusters = available(82.5);
  assert.throws(() => validateCaseManifest(fixture), {
    code: 'INVALID_INTEGER',
  });
});

test('case exact frame claims require two available equal timestamps', () => {
  const exact = caseManifest();
  exact.frame.status = 'exact';
  exact.frame.achievedSeconds = clone(exact.frame.requestedSeconds);
  assert.equal(validateCaseManifest(exact).frame.status, 'exact');

  const mismatch = caseManifest();
  mismatch.frame.status = 'exact';
  assert.throws(() => validateCaseManifest(mismatch), {
    code: 'FRAME_STATUS_CONFLICT',
  });
  const unavailableExact = caseManifest();
  unavailableExact.frame.status = 'exact';
  unavailableExact.frame.requestedSeconds = unavailable('not-applicable');
  unavailableExact.frame.achievedSeconds = unavailable('not-applicable');
  assert.throws(() => validateCaseManifest(unavailableExact), {
    code: 'FRAME_STATUS_CONFLICT',
  });
});

test('run exact frame claims use the same availability and equality rule', () => {
  const exact = runRecord({ frameStatus: 'exact' });
  exact.caseRef.achievedFrameSeconds = clone(
    exact.caseRef.requestedFrameSeconds
  );
  assert.equal(validateRunRecord(exact).caseRef.frameStatus, 'exact');
  const mismatch = runRecord({ frameStatus: 'exact' });
  assert.throws(() => validateRunRecord(mismatch), {
    code: 'FRAME_STATUS_CONFLICT',
  });
  const unavailableExact = runRecord({ frameStatus: 'exact' });
  unavailableExact.caseRef.requestedFrameSeconds =
    unavailable('not-applicable');
  unavailableExact.caseRef.achievedFrameSeconds = unavailable('not-applicable');
  assert.throws(() => validateRunRecord(unavailableExact), {
    code: 'FRAME_STATUS_CONFLICT',
  });
});

test('dirty unknown is unavailable rather than silently clean', () => {
  const manifest = buildManifest();
  manifest.dirty = {
    value: null,
    status: 'unavailable',
    evidenceRef: null,
    unavailableReason: 'unverified',
  };
  assert.equal(validateBuildManifest(manifest).dirty.value, null);
});

test('build commit claims accept only full forty or sixty-four digit identities', () => {
  for (const length of [40, 64]) {
    const manifest = buildManifest();
    manifest.commit = claim('a'.repeat(length));
    assert.equal(validateBuildManifest(manifest).commit.value.length, length);
  }
  for (const value of ['release-ish', 'a'.repeat(41), 'a'.repeat(63)]) {
    const manifest = buildManifest();
    manifest.commit.value = value;
    assert.throws(() => validateBuildManifest(manifest), {
      code: 'INVALID_COMMIT_ID',
    });
  }
});

test('available executable UUID claims require UUID wire format', () => {
  const invalid = buildManifest();
  invalid.executable.uuid.value = 'UUID-A';
  assert.throws(() => validateBuildManifest(invalid), { code: 'INVALID_UUID' });
  const unavailableUuid = buildManifest();
  unavailableUuid.executable.uuid = {
    value: null,
    status: 'unavailable',
    evidenceRef: null,
    unavailableReason: 'not-collected',
  };
  assert.equal(
    validateBuildManifest(unavailableUuid).executable.uuid.value,
    null
  );
});

test('claims require evidence and matching availability state', () => {
  const manifest = buildManifest();
  manifest.executable.profile.evidenceRef = null;
  assert.throws(() => validateBuildManifest(manifest), {
    code: 'MISSING_EVIDENCE',
  });
});

test('run validation rejects duplicate attempts and non-increasing sequence', () => {
  const duplicate = runRecord();
  duplicate.attempts.push(clone(duplicate.attempts[0]));
  duplicate.attempts[1].sequence = 2;
  assert.throws(() => validateRunRecord(duplicate), {
    code: 'DUPLICATE_ATTEMPT_ID',
  });
  const unordered = runRecord();
  const second = clone(unordered.attempts[0]);
  second.id = 'attempt-2';
  second.action.id = 'action:attempt-2';
  second.terminals[0].id = 'terminal:attempt-2';
  second.sequence = 0;
  unordered.attempts.push(second);
  assert.throws(() => validateRunRecord(unordered), {
    code: 'INVALID_ATTEMPT_ORDER',
  });
});

test('run validation rejects missing and conflicting terminal outcomes', () => {
  const missing = runRecord();
  missing.attempts[0].terminals = [];
  assert.throws(() => validateRunRecord(missing), { code: 'TERMINAL_COUNT' });
  const reasonOnSuccess = runRecord();
  reasonOnSuccess.attempts[0].terminals[0].reasonCode = 'reason-failed';
  assert.throws(() => validateRunRecord(reasonOnSuccess), {
    code: 'CONFLICTING_TERMINAL',
  });
});

test('run validation rejects negative and nonfinite measurements', () => {
  for (const value of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
    const record = runRecord();
    record.attempts[0].measurements[0].value = value;
    assert.throws(() => validateRunRecord(record), { code: 'INVALID_NUMBER' });
  }
});

test('measurement methods require matching evidence levels and evidence kinds', () => {
  const validPairs = [
    ['ui-transcription', 'ui-transcription', 'ui'],
    ['app-log-interval', 'app-log', 'log'],
    ['instrument-span', 'instrumentation', 'instrument'],
    ['presented-observation', 'presented-evidence', 'presented'],
  ];
  for (const [method, evidenceLevel, evidenceRef] of validPairs) {
    const record = runRecord();
    record.attempts[0].measurements = [
      measurement({ method, evidenceLevel, evidenceRefs: [evidenceRef] }),
    ];
    assert.equal(validateRunRecord(record).attempts.length, 1);
  }
  const promoted = runRecord();
  promoted.attempts[0].measurements = [
    measurement({
      method: 'presented-observation',
      evidenceLevel: 'presented-evidence',
      evidenceRefs: ['ui'],
    }),
  ];
  assert.throws(() => validateRunRecord(promoted), {
    code: 'MEASUREMENT_EVIDENCE_MISMATCH',
  });
});

test('available measurements require evidence while unavailable measurements are explicit', () => {
  const missing = runRecord();
  missing.attempts[0].measurements[0].evidenceRefs = [];
  assert.throws(() => validateRunRecord(missing), {
    code: 'MISSING_MEASUREMENT_EVIDENCE',
  });
  const unavailableMeasurement = runRecord();
  unavailableMeasurement.attempts[0].measurements = [
    measurement({ value: null, evidenceRefs: [] }),
  ];
  assert.equal(
    validateRunRecord(unavailableMeasurement).attempts[0].measurements[0]
      .unavailableReason,
    'not-exposed'
  );
});

test('timeouts are censored and cannot carry a completed duration', () => {
  const timedOut = runRecord();
  const attempt = timedOut.attempts[0];
  attempt.terminals[0].status = 'timeout';
  attempt.terminals[0].reasonCode = 'reason-timeout';
  attempt.freshExecution = { status: 'unproven', evidenceRefs: [] };
  attempt.exclusionReason = 'timeout';
  attempt.measurements = [measurement({ value: null, evidenceRefs: [] })];
  assert.equal(
    validateRunRecord(timedOut).attempts[0].measurements[0].value,
    null
  );
  attempt.measurements[0].value = 60000;
  attempt.measurements[0].unavailableReason = null;
  attempt.measurements[0].evidenceRefs = ['ui'];
  assert.throws(() => validateRunRecord(timedOut), {
    code: 'DURATION_WITHOUT_COMPLETION',
  });
});

test('fresh execution proof remains distinct from explicit eligibility exclusions', () => {
  const record = runRecord();
  record.attempts[0].exclusionReason = 'wrong-source';
  assert.equal(
    validateRunRecord(record).attempts[0].freshExecution.status,
    'proven'
  );
});

test('CLI argument parser rejects unknowns, duplicates, and missing values', () => {
  assert.deepEqual(
    parseCliArgs(['--input', 'a', '--input', 'b'], { '--input': 'many' }),
    { '--input': ['a', 'b'] }
  );
  assert.throws(() => parseCliArgs(['--wat'], {}), {
    code: 'UNKNOWN_ARGUMENT',
  });
  assert.throws(() => parseCliArgs(['--input'], { '--input': 'value' }), {
    code: 'MISSING_ARGUMENT_VALUE',
  });
});

test('public APIs use stable ManifestError codes', () => {
  assert.throws(
    () => validateRunRecord({}),
    (error) => error instanceof ManifestError && error.code === 'MISSING_FIELD'
  );
});
