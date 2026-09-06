#!/usr/bin/env node

import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseCliArgs,
  safeErrorCode,
  canonicalStringify,
  validateRunRecord,
  writePrivateJson,
} from './validate-manifest.mjs';
import { fail } from './validation-primitives.mjs';
import { readBoundInputs } from './trace-binding.mjs';
import { organizeTrace } from './trace-integrity.mjs';
import { buildRun, redactedId } from './trace-to-run.mjs';
import { parseTraceJsonl } from './trace-wire.mjs';

export { validateAcquisitionBinding } from './trace-binding.mjs';
export { parseTraceJsonl } from './trace-wire.mjs';

export async function importTraceRun({
  tracePath,
  bindingPath,
  buildPath,
  casePath,
  outputPath,
  diagnostic = false,
}) {
  for (const path of [tracePath, bindingPath, buildPath, casePath, outputPath])
    if (!isAbsolute(path)) fail('INPUT_PATH_NOT_ABSOLUTE');
  const inputs = await readBoundInputs({
    tracePath,
    bindingPath,
    buildPath,
    casePath,
  });
  const parsed = parseTraceJsonl(inputs.traceFile.bytes);
  const trace = organizeTrace(parsed);
  if (inputs.traceFile.bytes.length > trace.session.limits.maxArtifactBytes)
    fail('TRACE_BYTE_LIMIT_EXCEEDED');
  if (inputs.binding.trace.sessionId !== trace.session.sessionId)
    inputs.problems.push('TRACE_BINDING_MISMATCH');
  const boundIds = new Set(inputs.binding.actions.map((item) => item.id));
  if (
    boundIds.size !== trace.actionIds.size ||
    [...trace.actionIds].some((id) => !boundIds.has(id))
  )
    fail('INCOMPLETE_ACTION_ACCOUNTING');
  const selected = inputs.binding.actions.filter(
    (item) => item.disposition === 'selected'
  );
  for (const action of selected) {
    if (!trace.actionIds.has(action.id)) fail('UNKNOWN_ACTION_SELECTION');
    const batch = trace.batches.get(action.id);
    if (!batch) continue;
    const analysisConfig =
      batch.schemaVersion === 1
        ? batch.analysisConfig
        : batch.analysisConfig.state === 'resolved'
          ? batch.analysisConfig.value
          : null;
    const renderConfigMismatch =
      inputs.expectedRender === null ||
      canonicalStringify(batch.renderConfig) !==
        canonicalStringify(inputs.expectedRender);
    if (renderConfigMismatch)
      inputs.problems.push('ACTION_CASE_CONFIG_MISMATCH');
    if (analysisConfig === null) {
      inputs.problems.push('ACTION_CASE_CONFIG_UNAVAILABLE');
      continue;
    }
    if (
      inputs.expectedAnalysis === null ||
      canonicalStringify(analysisConfig) !==
        canonicalStringify(inputs.expectedAnalysis)
    )
      if (!renderConfigMismatch)
        inputs.problems.push('ACTION_CASE_CONFIG_MISMATCH');
  }
  if (inputs.problems.length > 0 && !diagnostic) fail(inputs.problems[0]);
  const run = buildRun({
    trace,
    traceDigest: inputs.traceFile.digest,
    bindingDigest: inputs.bindingFile.digest,
    binding: inputs.binding,
    build: inputs.build,
    buildDigest: inputs.buildFile.digest,
    caseManifest: inputs.caseManifest,
    caseDigest: inputs.caseFile.digest,
    configDigest: inputs.configDigest,
    problems: inputs.problems,
  });
  validateRunRecord(run);
  await writePrivateJson(outputPath, run);
  return {
    run,
    receipt: {
      written: true,
      runId: redactedId('trace-run-id', run.id),
      selectedActionCount: selected.length,
      nonselectedActionCount: inputs.binding.actions.length - selected.length,
      selectedActionIds: selected.map((item) =>
        redactedId('trace-action-id', item.id)
      ),
      nonselectedActionIds: inputs.binding.actions
        .filter((item) => item.disposition === 'nonselected')
        .map((item) => redactedId('trace-action-id', item.id)),
      diagnostic: inputs.problems.length > 0,
      problemCodes: inputs.problems,
    },
  };
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2), {
    '--trace': 'value',
    '--binding': 'value',
    '--build': 'value',
    '--case': 'value',
    '--output': 'value',
    '--diagnostic': 'flag',
  });
  for (const key of ['--trace', '--binding', '--build', '--case', '--output'])
    if (!args[key]) fail('MISSING_ARGUMENT');
  const { receipt } = await importTraceRun({
    tracePath: args['--trace'],
    bindingPath: args['--binding'],
    buildPath: args['--build'],
    casePath: args['--case'],
    outputPath: args['--output'],
    diagnostic: args['--diagnostic'] === true,
  });
  process.stdout.write(`${JSON.stringify(receipt)}\n`);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    process.stderr.write(`trace import failed: ${safeErrorCode(error)}\n`);
    process.exitCode = 1;
  });
}
