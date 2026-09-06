import {
  assertEvidenceReferences,
  digest,
  enumeration,
  evidenceRefs,
  exactKeys,
  fail,
  nullableOpaque,
  number,
  numericValue,
  string,
  unavailable,
  validateFrameStatus,
  validateProvenanceEvidenceList,
} from './validation-primitives.mjs';

const ANALYSIS_FIELDS = [
  'clusters',
  'quality',
  'sampleCap',
  'maxDimension',
  'ignoreTopN',
  'mergeThreshold',
  'snapToReal',
  'seed',
  'maxIterations',
  'tolerance',
  'warmStart',
];
const RENDER_FIELDS = [
  'polarMode',
  'histogramSort',
  'hueLightnessSizeMode',
  'showAxisLabels',
  'showClusterOutline',
  'symbolScale',
  'showHistogram',
  'showHueLightness',
  'showPolarChart',
  'showSimplifiedTones',
  'frameLabel',
  'stripMode',
  'compactSidebars',
];

function validateResolvedConfig(value, fields, validators, label) {
  exactKeys(value, fields, [], label);
  for (const field of fields) {
    const fieldLabel = `${label}.${field}`;
    const item = value[field];
    exactKeys(item, ['value', 'unavailableReason'], [], fieldLabel);
    if (item.value === null) {
      unavailable(item, fieldLabel);
    } else {
      if (item.unavailableReason !== null)
        fail('CONFLICTING_AVAILABILITY', fieldLabel);
      validators[field](item.value, `${fieldLabel}.value`);
    }
  }
}

export function validateCaseManifest(value) {
  exactKeys(
    value,
    [
      'version',
      'kind',
      'id',
      'source',
      'frame',
      'analysisConfig',
      'renderConfig',
      'viewport',
      'verification',
      'evidence',
    ],
    [],
    'case'
  );
  if (value.version !== 1 || value.kind !== 'case')
    fail('UNSUPPORTED_VERSION', 'case');
  string(value.id, 'case.id', { opaque: true });
  const evidenceIds = validateProvenanceEvidenceList(
    value.evidence,
    'case.evidence'
  );
  exactKeys(
    value.source,
    ['id', 'digestSha256', 'privatePathMapId'],
    [],
    'case.source'
  );
  string(value.source.id, 'case.source.id', { opaque: true });
  digest(value.source.digestSha256, 'case.source.digestSha256');
  nullableOpaque(value.source.privatePathMapId, 'case.source.privatePathMapId');
  exactKeys(
    value.frame,
    ['requestedSeconds', 'achievedSeconds', 'status', 'decodedFrameDigest'],
    [],
    'case.frame'
  );
  numericValue(value.frame.requestedSeconds, 'case.frame.requestedSeconds');
  numericValue(value.frame.achievedSeconds, 'case.frame.achievedSeconds');
  exactKeys(
    value.frame.decodedFrameDigest,
    ['value', 'unavailableReason'],
    [],
    'case.frame.decodedFrameDigest'
  );
  if (value.frame.decodedFrameDigest.value === null) {
    unavailable(
      value.frame.decodedFrameDigest,
      'case.frame.decodedFrameDigest'
    );
  } else {
    if (value.frame.decodedFrameDigest.unavailableReason !== null)
      fail('CONFLICTING_AVAILABILITY', 'case.frame.decodedFrameDigest');
    digest(
      value.frame.decodedFrameDigest.value,
      'case.frame.decodedFrameDigest.value'
    );
  }
  validateFrameStatus(value.frame, 'case.frame');

  const integer = (item, label) => number(item, label, { integer: true });
  const positiveInteger = (item, label) =>
    number(item, label, { integer: true, positive: true });
  const boolean = (item, label) => {
    if (typeof item !== 'boolean') fail('INVALID_BOOLEAN', label);
  };
  validateResolvedConfig(
    value.analysisConfig,
    ANALYSIS_FIELDS,
    {
      clusters: positiveInteger,
      quality: (item, label) =>
        number(item, label, { integer: true, maximum: 4 }),
      sampleCap: positiveInteger,
      maxDimension: positiveInteger,
      ignoreTopN: integer,
      mergeThreshold: number,
      snapToReal: boolean,
      seed: integer,
      maxIterations: positiveInteger,
      tolerance: number,
      warmStart: (item, label) =>
        enumeration(item, new Set(['none', 'provided']), label),
    },
    'case.analysisConfig'
  );
  validateResolvedConfig(
    value.renderConfig,
    RENDER_FIELDS,
    {
      polarMode: string,
      histogramSort: string,
      hueLightnessSizeMode: string,
      showAxisLabels: boolean,
      showClusterOutline: boolean,
      symbolScale: (item, label) => number(item, label, { positive: true }),
      showHistogram: boolean,
      showHueLightness: boolean,
      showPolarChart: boolean,
      showSimplifiedTones: boolean,
      frameLabel: string,
      stripMode: string,
      compactSidebars: boolean,
    },
    'case.renderConfig'
  );
  exactKeys(value.viewport, ['width', 'height', 'scale'], [], 'case.viewport');
  numericValue(value.viewport.width, 'case.viewport.width', {
    integer: true,
    positive: true,
  });
  numericValue(value.viewport.height, 'case.viewport.height', {
    integer: true,
    positive: true,
  });
  numericValue(value.viewport.scale, 'case.viewport.scale', { positive: true });
  exactKeys(
    value.verification,
    ['source', 'runtimeConfig', 'evidenceRefs'],
    [],
    'case.verification'
  );
  enumeration(
    value.verification.source,
    new Set(['asserted', 'hash-verified', 'runtime-verified', 'unverified']),
    'case.verification.source'
  );
  enumeration(
    value.verification.runtimeConfig,
    new Set(['asserted', 'runtime-verified', 'unverified']),
    'case.verification.runtimeConfig'
  );
  evidenceRefs(
    value.verification.evidenceRefs,
    'case.verification.evidenceRefs'
  );
  assertEvidenceReferences(value, evidenceIds);
  return value;
}
