#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ManifestError,
  MAX_EVIDENCE_ITEMS,
  captureRegularFile,
  parseCliArgs,
  readJsonFile,
  redactOpaqueId,
  safeErrorCode,
  validateBuildManifest,
  writePrivateJson,
} from './validate-manifest.mjs';

const MAX_FILES = 256;
const MAX_FILE_BYTES = 8 * 1024 * 1024 * 1024;
const ARTIFACT_GROUPS = ['locks', 'symbols', 'sourceMaps', 'sidecars'];

function fail(code) {
  throw new ManifestError(code);
}

function exactKeys(value, required, optional = []) {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    fail('INVALID_BUILD_SPEC');
  const allowed = new Set([...required, ...optional]);
  if (Object.keys(value).some((key) => !allowed.has(key)))
    fail('UNKNOWN_BUILD_SPEC_FIELD');
  if (required.some((key) => !(key in value))) fail('MISSING_BUILD_SPEC_FIELD');
}

async function sha256File(filePath) {
  const hash = createHash('sha256');
  await captureRegularFile(filePath, {
    maxBytes: MAX_FILE_BYTES,
    requireAbsolute: true,
    domain: 'build',
    onChunk: (chunk) => hash.update(chunk),
  });
  return hash.digest('hex');
}

function hashEvidence(id, digestSha256) {
  return {
    id: `hash:${id}`,
    kind: 'hash-checked-file',
    ref: id,
    digestSha256,
    note: null,
  };
}

function validateFileReference(value) {
  exactKeys(value, ['id', 'path']);
  if (typeof value.id !== 'string' || typeof value.path !== 'string')
    fail('INVALID_FILE_REFERENCE');
}

export async function collectBuildManifest(spec) {
  exactKeys(spec, [
    'version',
    'id',
    'commit',
    'dirty',
    'executable',
    'artifacts',
    'toolchain',
    'evidence',
  ]);
  if (spec.version !== 1) fail('UNSUPPORTED_VERSION');
  exactKeys(spec.executable, ['path', 'uuid', 'profile', 'compilerFlags']);
  exactKeys(spec.artifacts, ARTIFACT_GROUPS);
  for (const list of [
    spec.evidence,
    spec.toolchain,
    spec.executable.compilerFlags,
  ]) {
    if (!Array.isArray(list) || list.length > MAX_EVIDENCE_ITEMS)
      fail('INVALID_BUILD_SPEC');
  }
  validateFileReference({ id: 'executable', path: spec.executable.path });
  let fileCount = 1;
  for (const group of ARTIFACT_GROUPS) {
    if (!Array.isArray(spec.artifacts[group])) fail('INVALID_BUILD_SPEC');
    if (spec.artifacts[group].length > MAX_FILES) fail('TOO_MANY_FILES');
    fileCount += spec.artifacts[group].length;
    if (fileCount > MAX_FILES) fail('TOO_MANY_FILES');
    spec.artifacts[group].forEach(validateFileReference);
  }
  if (spec.evidence.length + fileCount > MAX_EVIDENCE_ITEMS)
    fail('TOO_MANY_EVIDENCE_ITEMS');

  const executableDigest = await sha256File(spec.executable.path);
  const evidence = [
    ...spec.evidence,
    hashEvidence('executable', executableDigest),
  ];
  const artifacts = {};
  for (const group of ARTIFACT_GROUPS) {
    artifacts[group] = [];
    for (const item of spec.artifacts[group]) {
      const digestSha256 = await sha256File(item.path);
      const evidenceItem = hashEvidence(item.id, digestSha256);
      evidence.push(evidenceItem);
      artifacts[group].push({
        id: item.id,
        localPath: item.path,
        digestSha256,
        evidenceRefs: [evidenceItem.id],
      });
    }
  }
  const manifest = {
    version: 1,
    kind: 'build',
    id: spec.id,
    commit: structuredClone(spec.commit),
    dirty: structuredClone(spec.dirty),
    executable: {
      localPath: spec.executable.path,
      digestSha256: executableDigest,
      uuid: structuredClone(spec.executable.uuid),
      profile: structuredClone(spec.executable.profile),
      compilerFlags: structuredClone(spec.executable.compilerFlags),
      evidenceRefs: [`hash:executable`],
    },
    artifacts,
    toolchain: structuredClone(spec.toolchain),
    evidence,
  };
  validateBuildManifest(manifest);
  return manifest;
}

function redactClaim(claim, includeValue = false) {
  return {
    ...(includeValue ? { value: claim.value } : {}),
    status: claim.status,
    unavailableReason: claim.unavailableReason,
  };
}

export function redactBuildManifest(manifest) {
  validateBuildManifest(manifest);
  const redactArtifacts = (items) =>
    items.map((item) => ({
      id: redactOpaqueId('artifact-id', item.id),
      digestSha256: item.digestSha256,
    }));
  return {
    version: manifest.version,
    kind: manifest.kind,
    id: redactOpaqueId('build-id', manifest.id),
    commit: redactClaim(manifest.commit, true),
    dirty: redactClaim(manifest.dirty, true),
    executable: {
      digestSha256: manifest.executable.digestSha256,
      uuid: redactClaim(manifest.executable.uuid),
      profile: redactClaim(manifest.executable.profile),
      compilerFlags: manifest.executable.compilerFlags.map((claim) =>
        redactClaim(claim)
      ),
    },
    artifacts: Object.fromEntries(
      ARTIFACT_GROUPS.map((group) => [
        group,
        redactArtifacts(manifest.artifacts[group]),
      ])
    ),
    toolchain: manifest.toolchain.map((item) => ({
      name: redactOpaqueId('toolchain-name', item.name),
      version: redactClaim(item.version),
    })),
    evidence: manifest.evidence.map((item) => ({
      id: redactOpaqueId('build-evidence-id', item.id),
      kind: item.kind,
      digestSha256: item.digestSha256,
    })),
  };
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2), {
    '--spec': 'value',
    '--output': 'value',
  });
  if (!args['--spec']) fail('MISSING_ARGUMENT');
  const spec = await readJsonFile(args['--spec']);
  const manifest = await collectBuildManifest(spec);
  if (args['--output']) {
    await writePrivateJson(args['--output'], manifest);
    process.stdout.write(
      `${JSON.stringify({ id: redactOpaqueId('build-id', manifest.id), written: true })}\n`
    );
  } else {
    process.stdout.write(
      `${JSON.stringify(redactBuildManifest(manifest), null, 2)}\n`
    );
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    process.stderr.write(`build manifest failed: ${safeErrorCode(error)}\n`);
    process.exitCode = 1;
  });
}
