import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  buildManifest,
  caseManifest,
  unavailable,
} from './profiling-fixtures.mjs';
import { importTraceRun, parseTraceJsonl } from './import-trace-run.mjs';
import { canonicalStringify } from './validate-manifest.mjs';
import { digest } from './trace-fixtures.mjs';

const execute = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const TAURI = resolve(HERE, '../..');

function unavailableFrame(testCase) {
  testCase.frame = {
    requestedSeconds: unavailable('not-applicable'),
    achievedSeconds: unavailable('not-applicable'),
    status: 'unverified',
    decodedFrameDigest: unavailable('not-applicable'),
  };
}

function actionIds(parsed) {
  return [
    ...new Set(
      parsed.records.flatMap((record) =>
        typeof record.actionId === 'string' ? [record.actionId] : []
      )
    ),
  ];
}

function finalSeal(parsed) {
  const seal = parsed.records.at(-1);
  assert.equal(seal.recordType, 'session-seal');
  assert.equal(seal.sealed, true);
  return seal;
}

async function importNativeArtifact({
  directory,
  tracePath,
  traceBytes,
  parsed,
  selectedActionId,
  suffix,
}) {
  const ids = actionIds(parsed);
  assert.ok(ids.includes(selectedActionId));
  const selectedBatch = parsed.records.find(
    (record) =>
      record.recordType === 'renderer-batch' &&
      record.actionId === selectedActionId
  );
  const build = buildManifest();
  const testCase = caseManifest();
  unavailableFrame(testCase);
  if (selectedBatch) {
    const analysisConfig =
      selectedBatch.schemaVersion === 2
        ? selectedBatch.analysisConfig.value
        : selectedBatch.analysisConfig;
    assert.ok(analysisConfig, 'selected action must have resolved config');
    for (const [key, value] of Object.entries(analysisConfig))
      testCase.analysisConfig[key].value = value;
    for (const [key, value] of Object.entries(selectedBatch.renderConfig))
      testCase.renderConfig[key].value = value;
  }
  const buildText = JSON.stringify(build);
  const caseText = JSON.stringify(testCase);
  const buildPath = join(directory, `${suffix}-build.json`);
  const casePath = join(directory, `${suffix}-case.json`);
  const bindingPath = join(directory, `${suffix}-binding.json`);
  const outputPath = join(directory, `${suffix}-run.json`);
  const session = parsed.records[0];
  const binding = {
    version: 1,
    kind: 'trace-acquisition-binding',
    id: `${suffix}-binding`,
    trace: {
      digestSha256: digest(traceBytes),
      sessionId: session.sessionId,
    },
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
    actions: ids.map((id) => ({
      id,
      disposition: id === selectedActionId ? 'selected' : 'nonselected',
      role: 'measured',
    })),
    verification: {
      status: 'verified',
      evidenceRef: 'native-production-writer',
    },
  };
  await Promise.all([
    writeFile(buildPath, buildText),
    writeFile(casePath, caseText),
    writeFile(bindingPath, JSON.stringify(binding)),
  ]);
  return importTraceRun({
    tracePath,
    bindingPath,
    buildPath,
    casePath,
    outputPath,
  });
}

test(
  'production Rust writer interoperates with importer across inputs, sealing, capacity, and rejected identities',
  { timeout: 120_000 },
  async () => {
    const directory = await mkdtemp(join(tmpdir(), 'color-tool-native-wire-'));
    await chmod(directory, 0o700);
    try {
      await execute(
        'cargo',
        [
          'test',
          '--offline',
          'profiling_tests::emit_native_interop_fixture',
          '--',
          '--ignored',
          '--exact',
          '--nocapture',
        ],
        {
          cwd: join(TAURI, 'src-tauri'),
          env: { ...process.env, COLOR_TOOL_PROFILE_INTEROP_DIR: directory },
          maxBuffer: 4 * 1024 * 1024,
        }
      );
      const profileDirectory = join(directory, 'profiling');
      const metadata = JSON.parse(
        await readFile(
          join(profileDirectory, 'native-interop-actions.json'),
          'utf8'
        )
      );
      assert.deepEqual(Object.keys(metadata).sort(), [
        'actions',
        'sessionId',
        'traceFile',
      ]);
      assert.deepEqual(Object.keys(metadata.actions).sort(), [
        'boolean',
        'invalid',
        'numeric',
      ]);
      assert.equal(metadata.traceFile.includes('/'), false);
      const tracePath = join(profileDirectory, metadata.traceFile);
      const traceBytes = await readFile(tracePath);
      const parsed = parseTraceJsonl(traceBytes);
      assert.ok(parsed.records.every((record) => record.schemaVersion === 2));
      const batches = Object.fromEntries(
        parsed.records
          .filter((record) => record.recordType === 'renderer-batch')
          .map((batch) => [batch.actionId, batch])
      );
      assert.deepEqual(batches[metadata.actions.invalid].analysisConfig, {
        state: 'unavailable',
        reasonCode: 'input-target-invalid',
      });
      assert.equal(
        batches[metadata.actions.numeric].analysisConfig.state,
        'resolved'
      );
      assert.ok(
        parsed.records.indexOf(batches[metadata.actions.invalid]) <
          parsed.records.findIndex(
            (record) =>
              record.recordType === 'native-event' &&
              record.actionId === metadata.actions.numeric &&
              record.phase === 'receive'
          )
      );
      assert.equal(
        'targetBoolean' in batches[metadata.actions.numeric].input,
        false
      );
      assert.equal(
        typeof batches[metadata.actions.numeric].input.targetNumber,
        'number'
      );
      assert.equal(
        'targetNumber' in batches[metadata.actions.boolean].input,
        false
      );
      assert.equal(
        typeof batches[metadata.actions.boolean].input.targetBoolean,
        'boolean'
      );
      assert.equal(
        'targetNumber' in batches[metadata.actions.invalid].input,
        false
      );
      assert.equal(
        'targetBoolean' in batches[metadata.actions.invalid].input,
        false
      );
      const numericLine = traceBytes
        .toString('utf8')
        .split('\n')
        .find(
          (line) =>
            line.includes('"recordType":"renderer-batch"') &&
            line.includes(`"actionId":"${metadata.actions.numeric}"`)
        );
      assert.match(numericLine, /"targetNumber":46\.0/);
      for (const actionId of Object.values(metadata.actions)) {
        const index = parsed.records.findIndex(
          (record) =>
            record.recordType === 'renderer-batch' &&
            record.actionId === actionId
        );
        const close = parsed.records.find(
          (record) =>
            record.recordType === 'action-close' && record.actionId === actionId
        );
        assert.equal(close.acceptedByteCount, parsed.recordByteLengths[index]);
      }
      const { run } = await importNativeArtifact({
        directory,
        tracePath,
        traceBytes,
        parsed,
        selectedActionId: metadata.actions.numeric,
        suffix: 'native-interop',
      });
      assert.equal(run.attempts.length, 1);
      assert.equal(run.attempts[0].terminals[0].status, 'completed');

      const round03 = JSON.parse(
        await readFile(
          join(profileDirectory, 'native-round03-fixtures.json'),
          'utf8'
        )
      );
      assert.deepEqual(Object.keys(round03).sort(), [
        'capacityRefusal',
        'identifierRejection',
        'postSeal',
      ]);

      const post = round03.postSeal;
      assert.equal(post.traceFile.includes('/'), false);
      const postPath = join(profileDirectory, post.traceFile);
      const postBytes = await readFile(postPath);
      const postParsed = parseTraceJsonl(postBytes);
      const postSeal = finalSeal(postParsed);
      assert.equal(postBytes.length, post.sealedByteCount);
      assert.equal(post.postAttemptByteCount, post.sealedByteCount);
      assert.equal(postSeal.artifactByteCount, post.sealedByteCount);
      assert.deepEqual(post.repeatedReceipt, post.sealedReceipt);
      const { run: postRun } = await importNativeArtifact({
        directory,
        tracePath: postPath,
        traceBytes: postBytes,
        parsed: postParsed,
        selectedActionId: post.knownActionId,
        suffix: 'native-post-seal',
      });
      assert.equal(postRun.attempts[0].terminals[0].status, 'cancelled');

      const capacity = round03.capacityRefusal;
      assert.equal(capacity.traceFile.includes('/'), false);
      assert.equal(capacity.refusalCode, 'profiling-action-capacity');
      const capacityPath = join(profileDirectory, capacity.traceFile);
      const capacityBytes = await readFile(capacityPath);
      assert.equal(
        capacityBytes.includes(Buffer.from(capacity.refusedActionId)),
        false
      );
      const capacityParsed = parseTraceJsonl(capacityBytes);
      const capacitySeal = finalSeal(capacityParsed);
      assert.equal(capacitySeal.actionCount, capacity.expectedActionCount);
      assert.equal(
        capacitySeal.droppedEventCount,
        capacity.expectedDroppedEventCount
      );
      assert.equal(
        capacitySeal.lastBatchSequence,
        capacity.expectedLastBatchSequence
      );
      assert.deepEqual(
        capacityParsed.records
          .filter((record) => record.recordType === 'session-loss')
          .map((record) => record.droppedEventCount),
        [capacity.expectedDroppedEventCount]
      );
      assert.equal(capacity.sealReceipt.sealed, true);
      const { run: capacityRun } = await importNativeArtifact({
        directory,
        tracePath: capacityPath,
        traceBytes: capacityBytes,
        parsed: capacityParsed,
        selectedActionId: capacity.selectedActionId,
        suffix: 'native-capacity',
      });
      assert.equal(capacityRun.attempts[0].terminals[0].status, 'unverified');
      assert.equal(capacityRun.attempts[0].freshExecution.status, 'proven');
      assert.ok(
        capacityRun.attempts[0].measurements.every(
          (measurement) => measurement.value === null
        )
      );

      const identifiers = round03.identifierRejection;
      assert.equal(identifiers.traceFile.includes('/'), false);
      const identifierPath = join(profileDirectory, identifiers.traceFile);
      const identifierBytes = await readFile(identifierPath);
      for (const rejected of identifiers.rejectedIdentifiers)
        assert.equal(identifierBytes.includes(Buffer.from(rejected)), false);
      const identifierParsed = parseTraceJsonl(identifierBytes);
      const identifierSeal = finalSeal(identifierParsed);
      assert.equal(identifierSeal.actionCount, identifiers.expectedActionCount);
      assert.equal(
        identifierSeal.droppedEventCount,
        identifiers.expectedDroppedEventCount
      );
      assert.equal(
        identifierSeal.lastBatchSequence,
        identifiers.expectedLastBatchSequence
      );
      assert.equal(identifiers.validInvalidPayloadReceipt.acceptedCount, 0);
      assert.equal(
        identifiers.validInvalidPayloadReceipt.outcomeAccepted,
        false
      );
      assert.equal(identifiers.validInvalidPayloadReceipt.closed, true);
      assert.equal(identifiers.validInvalidPayloadReceipt.sessionTainted, true);
      assert.equal(
        identifierParsed.records.some(
          (record) =>
            record.recordType === 'renderer-batch' &&
            record.actionId === identifiers.validInvalidPayloadActionId
        ),
        false
      );
      assert.equal(
        identifierParsed.records.some(
          (record) =>
            record.recordType === 'action-close' &&
            record.actionId === identifiers.validInvalidPayloadActionId
        ),
        true
      );
      const { run: identifierRun } = await importNativeArtifact({
        directory,
        tracePath: identifierPath,
        traceBytes: identifierBytes,
        parsed: identifierParsed,
        selectedActionId: identifiers.validInvalidPayloadActionId,
        suffix: 'native-identifiers',
      });
      assert.equal(identifierRun.attempts[0].terminals[0].status, 'unverified');
      assert.equal(
        identifierRun.attempts[0].terminals[0].reasonCode,
        'trace-persistence-unverified'
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
);
