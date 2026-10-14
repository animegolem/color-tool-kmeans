import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '../..');
const fixturePath = resolve(
  repoRoot,
  'color-core/tests/fixtures/f1-parity.json'
);
const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
const require = createRequire(import.meta.url);
const bindingPath = resolve(
  repoRoot,
  'color-core-wasm/pkg-node/color_core_wasm.js'
);
const { analyze_image: analyzeImage } = require(bindingPath);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function analyzeAndVerify(label, bytes, expectedSourceHash, expectedDigest) {
  const sourceHash = sha256(bytes);
  if (sourceHash !== expectedSourceHash) {
    throw new Error(
      `${label} source hash mismatch: expected ${expectedSourceHash}, found ${sourceHash}`
    );
  }
  const result = analyzeImage(new Uint8Array(bytes), fixture.request);
  if (!result || typeof result !== 'object') {
    throw new Error(`${label} binding returned a non-object response`);
  }
  if (result.resultDigest !== expectedDigest) {
    throw new Error(
      `${label} digest mismatch: expected ${expectedDigest}, found ${String(result.resultDigest)}`
    );
  }
  return {
    sourceSha256: sourceHash,
    resultDigest: result.resultDigest,
    clusters: result.clusters.length,
    totalSamples: result.totalSamples,
  };
}

const pngPath = resolve(repoRoot, 'color-core', fixture.input.path);
const pngBytes = await readFile(pngPath);
const jpegBytes = Buffer.from(fixture.jpeg.encodedHex, 'hex');
const results = {
  png: analyzeAndVerify(
    'PNG',
    pngBytes,
    fixture.input.sha256,
    fixture.expectedDigest
  ),
  jpeg: analyzeAndVerify(
    'JPEG',
    jpegBytes,
    fixture.jpeg.sha256,
    fixture.jpeg.expectedDigest
  ),
};

console.log(
  JSON.stringify({
    binding: pathToFileURL(bindingPath).href,
    digestVersion: fixture.digestVersion,
    results,
  })
);
