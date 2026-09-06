import { isAbsolute } from 'node:path';

import {
  MAX_INPUT_BYTES,
  ManifestError,
  canonicalStringify,
  captureRegularFile,
  validateBuildManifest,
  validateCaseManifest,
} from './validate-manifest.mjs';
import { SHA256, exactKeys, fail } from './validation-primitives.mjs';
import {
  ANALYSIS_FIELDS,
  MAX_TRACE_BYTES,
  RENDER_FIELDS,
  sha256,
} from './trace-wire.mjs';

function finite(value, code) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
    fail(code);
}

function exact(value, required, optional, label) {
  try {
    exactKeys(value, required, optional, label);
  } catch (error) {
    if (error instanceof ManifestError) fail('INVALID_BINDING_SHAPE');
    throw error;
  }
}

function opaque(value, code = 'INVALID_BINDING_ID') {
  if (
    typeof value !== 'string' ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/.test(value)
  )
    fail(code);
}

function availability(value, code, digest = false) {
  exact(value, ['value', 'unavailableReason'], [], code);
  if (value.value === null) {
    if (typeof value.unavailableReason !== 'string') fail(code);
  } else {
    if (digest) {
      if (!SHA256.test(value.value)) fail(code);
    } else finite(value.value, code);
    if (value.unavailableReason !== null) fail(code);
  }
}

export function validateAcquisitionBinding(value) {
  exact(
    value,
    [
      'version',
      'kind',
      'id',
      'trace',
      'build',
      'case',
      'actions',
      'verification',
    ],
    [],
    'binding'
  );
  if (value.version !== 1 || value.kind !== 'trace-acquisition-binding')
    fail('UNSUPPORTED_BINDING');
  opaque(value.id);
  exact(value.trace, ['digestSha256', 'sessionId'], [], 'binding.trace');
  exact(
    value.build,
    ['manifestDigestSha256', 'executableDigestSha256'],
    [],
    'binding.build'
  );
  exact(
    value.case,
    [
      'manifestDigestSha256',
      'sourceDigestSha256',
      'configDigestSha256',
      'frame',
      'viewport',
    ],
    [],
    'binding.case'
  );
  for (const digest of [
    value.trace.digestSha256,
    value.build.manifestDigestSha256,
    value.build.executableDigestSha256,
    value.case.manifestDigestSha256,
    value.case.sourceDigestSha256,
    value.case.configDigestSha256,
  ])
    if (!SHA256.test(digest)) fail('INVALID_BINDING_DIGEST');
  opaque(value.trace.sessionId);
  exact(
    value.case.frame,
    [
      'requestedSeconds',
      'achievedSeconds',
      'status',
      'decodedFrameDigestSha256',
    ],
    [],
    'binding.frame'
  );
  if (!['exact', 'unmatched', 'unverified'].includes(value.case.frame.status))
    fail('INVALID_BINDING_FRAME');
  availability(value.case.frame.requestedSeconds, 'INVALID_BINDING_FRAME');
  availability(value.case.frame.achievedSeconds, 'INVALID_BINDING_FRAME');
  availability(
    value.case.frame.decodedFrameDigestSha256,
    'INVALID_BINDING_FRAME',
    true
  );
  if (
    value.case.frame.status === 'exact' &&
    (value.case.frame.requestedSeconds.value === null ||
      value.case.frame.requestedSeconds.value !==
        value.case.frame.achievedSeconds.value)
  )
    fail('INVALID_BINDING_FRAME');
  exact(
    value.case.viewport,
    ['width', 'height', 'scale'],
    [],
    'binding.viewport'
  );
  for (const key of ['width', 'height', 'scale']) {
    availability(value.case.viewport[key], 'INVALID_BINDING_VIEWPORT');
    if (value.case.viewport[key].value === 0) fail('INVALID_BINDING_VIEWPORT');
  }
  if (
    !Array.isArray(value.actions) ||
    value.actions.length === 0 ||
    value.actions.length > 10_000
  )
    fail('INVALID_BINDING_ACTIONS');
  const ids = new Set();
  for (const action of value.actions) {
    exact(action, ['id', 'disposition', 'role'], [], 'binding.action');
    opaque(action.id);
    if (ids.has(action.id)) fail('DUPLICATE_ACTION_SELECTION');
    ids.add(action.id);
    if (
      !['selected', 'nonselected'].includes(action.disposition) ||
      !['setup', 'reset', 'warmup', 'measured'].includes(action.role)
    )
      fail('INVALID_BINDING_ACTION');
  }
  if (!value.actions.some((item) => item.disposition === 'selected'))
    fail('NO_SELECTED_ACTIONS');
  exact(
    value.verification,
    ['status', 'evidenceRef'],
    [],
    'binding.verification'
  );
  if (
    !['verified', 'caller-asserted', 'unverified'].includes(
      value.verification.status
    )
  )
    fail('INVALID_BINDING_VERIFICATION');
  if (value.verification.status === 'unverified') {
    if (value.verification.evidenceRef !== null)
      fail('CONFLICTING_BINDING_EVIDENCE');
  } else opaque(value.verification.evidenceRef, 'INVALID_BINDING_EVIDENCE');
  return value;
}

function json(bytes) {
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch {
    fail('INVALID_JSON');
  }
}

async function read(path, maxBytes = MAX_INPUT_BYTES) {
  if (!isAbsolute(path)) fail('INPUT_PATH_NOT_ABSOLUTE');
  const bytes = await captureRegularFile(path, {
    maxBytes,
    requireAbsolute: true,
  });
  return { bytes, digest: sha256(bytes) };
}

function plainConfig(config, fields) {
  const result = {};
  for (const field of fields) {
    if (config[field].value === null) return null;
    result[field] = config[field].value;
  }
  return result;
}

function frame(caseManifest) {
  return {
    requestedSeconds: caseManifest.frame.requestedSeconds,
    achievedSeconds: caseManifest.frame.achievedSeconds,
    status: caseManifest.frame.status,
    decodedFrameDigestSha256: caseManifest.frame.decodedFrameDigest,
  };
}

export async function readBoundInputs({
  tracePath,
  bindingPath,
  buildPath,
  casePath,
}) {
  for (const path of [tracePath, bindingPath, buildPath, casePath])
    if (!isAbsolute(path)) fail('INPUT_PATH_NOT_ABSOLUTE');
  const [traceFile, bindingFile, buildFile, caseFile] = await Promise.all([
    read(tracePath, MAX_TRACE_BYTES),
    read(bindingPath),
    read(buildPath),
    read(casePath),
  ]);
  const binding = validateAcquisitionBinding(json(bindingFile.bytes));
  const build = validateBuildManifest(json(buildFile.bytes));
  const caseManifest = validateCaseManifest(json(caseFile.bytes));
  const configDigest = sha256(
    canonicalStringify({
      analysisConfig: caseManifest.analysisConfig,
      renderConfig: caseManifest.renderConfig,
      viewport: caseManifest.viewport,
    })
  );
  const problems = [];
  if (binding.trace.digestSha256 !== traceFile.digest)
    problems.push('TRACE_BINDING_MISMATCH');
  if (
    binding.build.manifestDigestSha256 !== buildFile.digest ||
    binding.build.executableDigestSha256 !== build.executable.digestSha256
  )
    problems.push('BUILD_BINDING_MISMATCH');
  if (
    binding.case.manifestDigestSha256 !== caseFile.digest ||
    binding.case.sourceDigestSha256 !== caseManifest.source.digestSha256 ||
    binding.case.configDigestSha256 !== configDigest ||
    canonicalStringify(binding.case.frame) !==
      canonicalStringify(frame(caseManifest)) ||
    canonicalStringify(binding.case.viewport) !==
      canonicalStringify(caseManifest.viewport)
  )
    problems.push('CASE_BINDING_MISMATCH');
  if (binding.verification.status !== 'verified')
    problems.push('ACQUISITION_NOT_VERIFIED');
  return {
    traceFile,
    bindingFile,
    buildFile,
    caseFile,
    binding,
    build,
    caseManifest,
    configDigest,
    expectedAnalysis: plainConfig(caseManifest.analysisConfig, ANALYSIS_FIELDS),
    expectedRender: plainConfig(caseManifest.renderConfig, RENDER_FIELDS),
    problems,
  };
}
