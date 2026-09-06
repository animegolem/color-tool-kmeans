export const SHA_A = 'a'.repeat(64);
export const SHA_B = 'b'.repeat(64);
export const SHA_C = 'c'.repeat(64);
export const SHA_D = 'd'.repeat(64);

export function available(value) {
  return { value, unavailableReason: null };
}

export function unavailable(reason = 'not-exposed') {
  return { value: null, unavailableReason: reason };
}

export function evidence(id = 'assertion') {
  return {
    id,
    kind: 'caller-assertion',
    ref: null,
    digestSha256: null,
    note: null,
  };
}

export function claim(value, evidenceRef = 'assertion') {
  return {
    value,
    status: 'asserted',
    evidenceRef,
    unavailableReason: null,
  };
}

export function buildManifest() {
  return {
    version: 1,
    kind: 'build',
    id: 'build-a',
    commit: claim('a'.repeat(40)),
    dirty: claim(false),
    executable: {
      localPath: '/private/build/executable',
      digestSha256: SHA_A,
      uuid: claim('123e4567-e89b-12d3-a456-426614174000'),
      profile: claim('release'),
      compilerFlags: [claim('-Cdebuginfo=1')],
      evidenceRefs: ['hash:executable'],
    },
    artifacts: { locks: [], symbols: [], sourceMaps: [], sidecars: [] },
    toolchain: [{ name: 'node', version: claim('20.0.0') }],
    evidence: [
      evidence(),
      {
        id: 'hash:executable',
        kind: 'hash-checked-file',
        ref: 'executable',
        digestSha256: SHA_A,
        note: null,
      },
    ],
  };
}

export function caseManifest() {
  const analysisConfig = {
    clusters: available(82),
    quality: available(2),
    sampleCap: available(180000),
    maxDimension: available(2200),
    ignoreTopN: available(2),
    mergeThreshold: available(0),
    snapToReal: available(true),
    seed: available(1),
    maxIterations: available(40),
    tolerance: available(0.001),
    warmStart: available('none'),
  };
  const renderConfig = {
    polarMode: available('okhsv'),
    histogramSort: available('frequency'),
    hueLightnessSizeMode: available('frequency'),
    showAxisLabels: available(true),
    showClusterOutline: available(false),
    symbolScale: available(1),
    showHistogram: available(true),
    showHueLightness: available(true),
    showPolarChart: available(true),
    showSimplifiedTones: available(true),
    frameLabel: available('timestamp'),
    stripMode: available('barcode'),
    compactSidebars: available(false),
  };
  return {
    version: 1,
    kind: 'case',
    id: 'case-a',
    source: {
      id: 'source-a',
      digestSha256: SHA_B,
      privatePathMapId: 'private-map-a',
    },
    frame: {
      requestedSeconds: available(58.4163),
      achievedSeconds: available(58.421),
      status: 'unmatched',
      decodedFrameDigest: unavailable('not-collected'),
    },
    analysisConfig,
    renderConfig,
    viewport: {
      width: available(1215),
      height: available(768),
      scale: unavailable(),
    },
    verification: {
      source: 'hash-verified',
      runtimeConfig: 'runtime-verified',
      evidenceRefs: ['case-evidence'],
    },
    evidence: [
      {
        id: 'case-evidence',
        kind: 'external-reference',
        ref: 'evidence-a',
        digestSha256: null,
        note: null,
      },
    ],
  };
}

export function runEvidence() {
  return [
    {
      id: 'ui',
      kind: 'ui-transcription',
      ref: '/private/raw.tsv',
      note: 'private note',
    },
    {
      id: 'log',
      kind: 'app-log',
      ref: '/private/raw.log',
      note: 'raw error text',
    },
    {
      id: 'instrument',
      kind: 'instrumentation',
      ref: 'trace-span',
      note: null,
    },
    {
      id: 'presented',
      kind: 'presented-evidence',
      ref: 'screen-capture',
      note: null,
    },
    { id: 'fresh', kind: 'app-log', ref: 'pending-ready-pair', note: null },
  ];
}

export function measurement({
  endpoint = 'run-kmeans',
  value = 95,
  method = 'ui-transcription',
  evidenceLevel = 'ui-transcription',
  evidenceRefs = ['ui'],
  clock,
} = {}) {
  return {
    endpoint,
    value,
    unavailableReason: value === null ? 'not-exposed' : null,
    unit: 'ms',
    clock:
      clock ??
      (method === 'ui-transcription' ? 'native-duration' : 'event-log-wall'),
    method,
    precision: 1,
    evidenceLevel,
    evidenceRefs,
  };
}

export function attempt({
  id = 'attempt-1',
  sequence = 1,
  role = 'measured',
  status = 'completed',
  freshStatus = 'proven',
  visibility = 'visible',
  process = 'warm',
  cache = 'warm',
  workload = 'owner-quiet-intent-busy-observed',
  exclusionReason = null,
  measurements = [measurement()],
} = {}) {
  return {
    id,
    sequence,
    role,
    strata: { process, cache, workload, visibility },
    action: {
      id: `action:${id}`,
      kind: 'analysis-request',
      evidenceRefs: ['fresh'],
    },
    terminals: [
      {
        id: `terminal:${id}`,
        status,
        reasonCode: status === 'completed' ? null : `reason-${status}`,
        evidenceRefs: ['log'],
      },
    ],
    freshExecution: {
      status: freshStatus,
      evidenceRefs: freshStatus === 'proven' ? ['fresh'] : [],
    },
    measurements,
    exclusionReason,
  };
}

export function runRecord({
  id = 'run-a',
  buildId = 'build-a',
  buildDigest = SHA_A,
  caseId = 'case-a',
  caseDigest = SHA_B,
  sourceDigest = SHA_C,
  configDigest = SHA_D,
  frameStatus = 'unmatched',
  operation = 'analysis-rerun',
  attempts = [attempt()],
} = {}) {
  return {
    version: 1,
    kind: 'run',
    id,
    buildRef: { id: buildId, digestSha256: buildDigest },
    caseRef: {
      id: caseId,
      digestSha256: caseDigest,
      sourceDigestSha256: sourceDigest,
      configDigestSha256: configDigest,
      requestedFrameSeconds: available(58.4163),
      achievedFrameSeconds: available(58.421),
      frameStatus,
      decodedFrameDigestSha256: unavailable('not-collected'),
    },
    operation,
    attempts,
    evidence: runEvidence(),
  };
}

export function clone(value) {
  return structuredClone(value);
}

export function recursivelyReverseKeys(value) {
  if (Array.isArray(value)) return value.map(recursivelyReverseKeys);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .reverse()
      .map(([key, child]) => [key, recursivelyReverseKeys(child)])
  );
}
