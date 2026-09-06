import { createHash } from 'node:crypto';

export const MAX_INPUT_BYTES = 4 * 1024 * 1024;
export const MAX_ATTEMPTS = 10_000;
export const MAX_EVIDENCE_ITEMS = 10_000;

export const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
export const SHA256 = /^[a-f0-9]{64}$/;
export const UUID =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
export const UNAVAILABLE_REASONS = new Set([
  'not-collected',
  'not-exposed',
  'not-applicable',
  'unverified',
  'control-failure',
  'source-missing',
]);
export const EXCLUSION_REASONS = new Set([
  'setup',
  'reset',
  'warmup',
  'unproven-execution',
  'unavailable-measurement',
  'noncompleted',
  'wrong-source',
  'unmatched-frame',
  'visibility-caveat',
  'cache',
  'deduped',
  'timeout',
  'stale',
  'failed',
  'cancelled',
  'unverified',
]);
const REDACTION_NAMESPACES = new Set([
  'artifact-id',
  'build-evidence-id',
  'build-id',
  'case-id',
  'measurement-clock',
  'measurement-endpoint',
  'toolchain-name',
]);

export class ManifestError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'ManifestError';
    this.code = code;
  }
}

export function fail(code, message) {
  throw new ManifestError(code, message);
}

export function object(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail('INVALID_TYPE', `${label} must be an object`);
  }
  return value;
}

export function exactKeys(value, required, optional, label) {
  object(value, label);
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail('UNKNOWN_FIELD', `${label}.${key}`);
  }
  for (const key of required) {
    if (!(key in value)) fail('MISSING_FIELD', `${label}.${key}`);
  }
}

export function string(value, label, { opaque = false } = {}) {
  if (typeof value !== 'string' || value.length === 0) {
    fail('INVALID_STRING', label);
  }
  if (opaque && !OPAQUE_ID.test(value)) fail('INVALID_OPAQUE_ID', label);
}

export function enumeration(value, values, label) {
  if (!values.has(value)) fail('INVALID_ENUM', label);
}

export function number(
  value,
  label,
  { integer = false, positive = false, maximum } = {}
) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    fail('INVALID_NUMBER', label);
  }
  if (integer && !Number.isInteger(value)) fail('INVALID_INTEGER', label);
  if (positive && value === 0) fail('INVALID_POSITIVE_NUMBER', label);
  if (maximum !== undefined && value > maximum)
    fail('NUMBER_OUT_OF_RANGE', label);
}

export function digest(value, label) {
  if (typeof value !== 'string' || !SHA256.test(value)) {
    fail('INVALID_SHA256', label);
  }
}

export function commitId(value, label) {
  if (
    typeof value !== 'string' ||
    !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(value)
  ) {
    fail('INVALID_COMMIT_ID', label);
  }
}

export function uuid(value, label) {
  if (typeof value !== 'string' || !UUID.test(value)) {
    fail('INVALID_UUID', label);
  }
}

export function array(value, label, max = MAX_EVIDENCE_ITEMS) {
  if (!Array.isArray(value) || value.length > max) fail('INVALID_ARRAY', label);
}

export function nullableOpaque(value, label) {
  if (value !== null) string(value, label, { opaque: true });
}

export function unavailable(value, label) {
  exactKeys(value, ['value', 'unavailableReason'], [], label);
  if (value.value === null) {
    enumeration(
      value.unavailableReason,
      UNAVAILABLE_REASONS,
      `${label}.unavailableReason`
    );
  } else if (value.unavailableReason !== null) {
    fail('CONFLICTING_AVAILABILITY', label);
  }
}

export function numericValue(value, label, options = {}) {
  unavailable(value, label);
  if (value.value !== null) number(value.value, `${label}.value`, options);
}

export function evidenceRefs(value, label) {
  array(value, label);
  for (const [index, ref] of value.entries()) {
    string(ref, `${label}[${index}]`, { opaque: true });
  }
}

export function validateProvenanceEvidence(value, label) {
  exactKeys(value, ['id', 'kind', 'ref', 'digestSha256', 'note'], [], label);
  string(value.id, `${label}.id`, { opaque: true });
  enumeration(
    value.kind,
    new Set(['caller-assertion', 'hash-checked-file', 'external-reference']),
    `${label}.kind`
  );
  if (value.ref !== null) string(value.ref, `${label}.ref`);
  if (value.digestSha256 !== null)
    digest(value.digestSha256, `${label}.digestSha256`);
  if (value.note !== null && typeof value.note !== 'string')
    fail('INVALID_STRING', `${label}.note`);
}

export function validateProvenanceEvidenceList(values, label) {
  array(values, label);
  const ids = new Set();
  for (const [index, value] of values.entries()) {
    validateProvenanceEvidence(value, `${label}[${index}]`);
    if (ids.has(value.id)) fail('DUPLICATE_EVIDENCE_ID', value.id);
    ids.add(value.id);
  }
  return ids;
}

export function validateFrameStatus(frame, label) {
  enumeration(
    frame.status,
    new Set(['exact', 'unmatched', 'unverified']),
    `${label}.status`
  );
  if (frame.status !== 'exact') return;
  const requested = frame.requestedSeconds.value;
  const achieved = frame.achievedSeconds.value;
  if (requested === null || achieved === null || requested !== achieved) {
    fail('FRAME_STATUS_CONFLICT', label);
  }
}

export function assertEvidenceReferences(value, evidenceIds) {
  const visit = (item) => {
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    if (item === null || typeof item !== 'object') return;
    for (const [childKey, child] of Object.entries(item)) {
      if (
        childKey === 'evidenceRef' &&
        child !== null &&
        !evidenceIds.has(child)
      ) {
        fail('UNKNOWN_EVIDENCE_REFERENCE', child);
      }
      if (childKey === 'evidenceRefs') {
        child.forEach((ref) => {
          if (!evidenceIds.has(ref)) fail('UNKNOWN_EVIDENCE_REFERENCE', ref);
        });
      } else {
        visit(child);
      }
    }
  };
  visit(value);
}

export function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value === null || typeof value !== 'object') return value;
  const result = {};
  for (const key of Object.keys(value).sort(compareCodeUnits)) {
    result[key] = canonicalize(value[key]);
  }
  return result;
}

export function canonicalStringify(value) {
  return JSON.stringify(canonicalize(value));
}

export function redactOpaqueId(namespace, value) {
  enumeration(namespace, REDACTION_NAMESPACES, 'redaction.namespace');
  string(value, 'redaction.value', { opaque: true });
  const digestValue = createHash('sha256')
    .update(namespace)
    .update('\0')
    .update(value)
    .digest('hex')
    .slice(0, 24);
  return `redacted:${namespace}:${digestValue}`;
}

export function parseCliArgs(argv, specification) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const setting = specification[token];
    if (!setting) fail('UNKNOWN_ARGUMENT');
    if (setting === 'flag') {
      result[token] = true;
    } else {
      const next = argv[index + 1];
      if (next === undefined || next.startsWith('--'))
        fail('MISSING_ARGUMENT_VALUE');
      index += 1;
      if (setting === 'many') result[token] = [...(result[token] ?? []), next];
      else if (result[token] !== undefined) fail('DUPLICATE_ARGUMENT');
      else result[token] = next;
    }
  }
  return result;
}

export function safeErrorCode(error) {
  return error instanceof ManifestError ? error.code : 'UNEXPECTED_ERROR';
}
