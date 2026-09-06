#!/usr/bin/env node

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readJsonFile } from './private-files.mjs';
import { validateBuildManifest } from './validate-build.mjs';
import { validateCaseManifest } from './validate-case.mjs';
import { validateRunRecord } from './validate-run.mjs';
import { fail, parseCliArgs, safeErrorCode } from './validation-primitives.mjs';

export {
  assertSafePrivateOutput,
  captureRegularFile,
  readJsonFile,
  writePrivateJson,
} from './private-files.mjs';
export { validateBuildManifest } from './validate-build.mjs';
export { validateCaseManifest } from './validate-case.mjs';
export { validateRunRecord } from './validate-run.mjs';
export {
  MAX_ATTEMPTS,
  MAX_EVIDENCE_ITEMS,
  MAX_INPUT_BYTES,
  ManifestError,
  canonicalStringify,
  canonicalize,
  compareCodeUnits,
  parseCliArgs,
  redactOpaqueId,
  safeErrorCode,
} from './validation-primitives.mjs';

export function validateManifest(value, expectedKind) {
  if (expectedKind === 'build') return validateBuildManifest(value);
  if (expectedKind === 'case') return validateCaseManifest(value);
  if (expectedKind === 'run') return validateRunRecord(value);
  fail('UNKNOWN_MANIFEST_KIND', 'kind');
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2), {
    '--input': 'value',
    '--kind': 'value',
  });
  if (!args['--input'] || !args['--kind']) fail('MISSING_ARGUMENT');
  const manifest = await readJsonFile(args['--input']);
  validateManifest(manifest, args['--kind']);
  process.stdout.write(
    `${JSON.stringify({ kind: manifest.kind, valid: true, version: manifest.version })}\n`
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    process.stderr.write(`validation failed: ${safeErrorCode(error)}\n`);
    process.exitCode = 1;
  });
}
