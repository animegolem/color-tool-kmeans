import {
  array,
  assertEvidenceReferences,
  commitId,
  digest,
  enumeration,
  evidenceRefs,
  exactKeys,
  fail,
  nullableOpaque,
  string,
  UNAVAILABLE_REASONS,
  uuid,
  validateProvenanceEvidenceList,
} from './validation-primitives.mjs';

function validateClaim(value, label, allowedValue) {
  exactKeys(
    value,
    ['value', 'status', 'evidenceRef', 'unavailableReason'],
    [],
    label
  );
  enumeration(
    value.status,
    new Set(['asserted', 'verified-file', 'external-reference', 'unavailable']),
    `${label}.status`
  );
  nullableOpaque(value.evidenceRef, `${label}.evidenceRef`);
  if (value.status === 'unavailable') {
    if (value.value !== null) fail('CONFLICTING_AVAILABILITY', label);
    enumeration(
      value.unavailableReason,
      UNAVAILABLE_REASONS,
      `${label}.unavailableReason`
    );
    if (value.evidenceRef !== null) fail('CONFLICTING_EVIDENCE', label);
  } else {
    allowedValue(value.value, `${label}.value`);
    if (value.unavailableReason !== null)
      fail('CONFLICTING_AVAILABILITY', label);
    if (value.evidenceRef === null) fail('MISSING_EVIDENCE', label);
  }
}

function validateArtifact(value, label) {
  exactKeys(
    value,
    ['id', 'localPath', 'digestSha256', 'evidenceRefs'],
    [],
    label
  );
  string(value.id, `${label}.id`, { opaque: true });
  string(value.localPath, `${label}.localPath`);
  digest(value.digestSha256, `${label}.digestSha256`);
  evidenceRefs(value.evidenceRefs, `${label}.evidenceRefs`);
}

function assertClaimEvidence(claim, evidenceById, label) {
  if (claim.status === 'unavailable') return;
  const evidence = evidenceById.get(claim.evidenceRef);
  const expectedKind = {
    asserted: 'caller-assertion',
    'verified-file': 'hash-checked-file',
    'external-reference': 'external-reference',
  }[claim.status];
  if (!evidence || evidence.kind !== expectedKind)
    fail('CLAIM_EVIDENCE_MISMATCH', label);
}

function assertHashEvidence(references, expectedDigest, evidenceById, label) {
  const matched = references.some((reference) => {
    const evidence = evidenceById.get(reference);
    return (
      evidence?.kind === 'hash-checked-file' &&
      evidence.digestSha256 === expectedDigest
    );
  });
  if (!matched) fail('HASH_EVIDENCE_MISMATCH', label);
}

export function validateBuildManifest(value) {
  exactKeys(
    value,
    [
      'version',
      'kind',
      'id',
      'commit',
      'dirty',
      'executable',
      'artifacts',
      'toolchain',
      'evidence',
    ],
    [],
    'build'
  );
  if (value.version !== 1 || value.kind !== 'build')
    fail('UNSUPPORTED_VERSION', 'build');
  string(value.id, 'build.id', { opaque: true });
  const evidenceIds = validateProvenanceEvidenceList(
    value.evidence,
    'build.evidence'
  );
  const evidenceById = new Map(value.evidence.map((item) => [item.id, item]));
  validateClaim(value.commit, 'build.commit', commitId);
  validateClaim(value.dirty, 'build.dirty', (item, label) => {
    if (typeof item !== 'boolean') fail('INVALID_BOOLEAN', label);
  });
  exactKeys(
    value.executable,
    [
      'localPath',
      'digestSha256',
      'uuid',
      'profile',
      'compilerFlags',
      'evidenceRefs',
    ],
    [],
    'build.executable'
  );
  string(value.executable.localPath, 'build.executable.localPath');
  digest(value.executable.digestSha256, 'build.executable.digestSha256');
  validateClaim(value.executable.uuid, 'build.executable.uuid', uuid);
  validateClaim(value.executable.profile, 'build.executable.profile', string);
  array(value.executable.compilerFlags, 'build.executable.compilerFlags');
  value.executable.compilerFlags.forEach((flag, index) =>
    validateClaim(flag, `build.executable.compilerFlags[${index}]`, string)
  );
  evidenceRefs(value.executable.evidenceRefs, 'build.executable.evidenceRefs');
  assertHashEvidence(
    value.executable.evidenceRefs,
    value.executable.digestSha256,
    evidenceById,
    'build.executable'
  );
  exactKeys(
    value.artifacts,
    ['locks', 'symbols', 'sourceMaps', 'sidecars'],
    [],
    'build.artifacts'
  );
  for (const key of ['locks', 'symbols', 'sourceMaps', 'sidecars']) {
    array(value.artifacts[key], `build.artifacts.${key}`);
    value.artifacts[key].forEach((item, index) => {
      const label = `build.artifacts.${key}[${index}]`;
      validateArtifact(item, label);
      assertHashEvidence(
        item.evidenceRefs,
        item.digestSha256,
        evidenceById,
        label
      );
    });
  }
  array(value.toolchain, 'build.toolchain');
  value.toolchain.forEach((item, index) => {
    const label = `build.toolchain[${index}]`;
    exactKeys(item, ['name', 'version'], [], label);
    string(item.name, `${label}.name`, { opaque: true });
    validateClaim(item.version, `${label}.version`, string);
  });
  for (const [claim, label] of [
    [value.commit, 'build.commit'],
    [value.dirty, 'build.dirty'],
    [value.executable.uuid, 'build.executable.uuid'],
    [value.executable.profile, 'build.executable.profile'],
  ]) {
    assertClaimEvidence(claim, evidenceById, label);
  }
  value.executable.compilerFlags.forEach((claim, index) =>
    assertClaimEvidence(
      claim,
      evidenceById,
      `build.executable.compilerFlags[${index}]`
    )
  );
  value.toolchain.forEach((item, index) =>
    assertClaimEvidence(
      item.version,
      evidenceById,
      `build.toolchain[${index}].version`
    )
  );
  assertEvidenceReferences(value, evidenceIds);
  return value;
}
