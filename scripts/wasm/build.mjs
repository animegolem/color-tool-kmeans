import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '../..');
const crateRoot = resolve(repoRoot, 'color-core-wasm');
const webOutput = resolve(crateRoot, 'pkg-web');
const nodeOutput = resolve(crateRoot, 'pkg-node');
const WASM_BINDGEN_VERSION = 'wasm-bindgen 0.2.128';
const WASM_SIZE_LIMIT = 4 * 1024 * 1024;

function capture(command, args) {
  return execFileSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function run(command, args) {
  execFileSync(command, args, { cwd: repoRoot, stdio: 'inherit' });
}

const installedVersion = capture('wasm-bindgen', ['--version']);
if (installedVersion !== WASM_BINDGEN_VERSION) {
  throw new Error(
    `wasm-bindgen-cli version mismatch: expected ${WASM_BINDGEN_VERSION}, found ${installedVersion}`
  );
}

const installedTargets = capture('rustup', ['target', 'list', '--installed'])
  .split(/\r?\n/)
  .filter(Boolean);
if (!installedTargets.includes('wasm32-unknown-unknown')) {
  throw new Error('missing required Rust target wasm32-unknown-unknown');
}

run('cargo', [
  'build',
  '--locked',
  '--release',
  '--target',
  'wasm32-unknown-unknown',
  '-p',
  'color-core-wasm',
]);

const metadata = JSON.parse(
  capture('cargo', ['metadata', '--locked', '--format-version=1', '--no-deps'])
);
const inputWasm = resolve(
  metadata.target_directory,
  'wasm32-unknown-unknown/release/color_core_wasm.wasm'
);
if (!existsSync(inputWasm)) {
  throw new Error(`missing compiled wasm artifact: ${inputWasm}`);
}

for (const output of [webOutput, nodeOutput]) {
  rmSync(output, { recursive: true, force: true });
  mkdirSync(output, { recursive: true });
}

run('wasm-bindgen', [
  inputWasm,
  '--target',
  'web',
  '--out-dir',
  webOutput,
  '--out-name',
  'color_core_wasm',
]);
run('wasm-bindgen', [
  inputWasm,
  '--target',
  'nodejs',
  '--out-dir',
  nodeOutput,
  '--out-name',
  'color_core_wasm',
]);
writeFileSync(
  resolve(nodeOutput, 'package.json'),
  `${JSON.stringify({ type: 'commonjs' })}\n`,
  'utf8'
);

const webWasm = resolve(webOutput, 'color_core_wasm_bg.wasm');
const nodeWasm = resolve(nodeOutput, 'color_core_wasm_bg.wasm');
const sizes = {
  compiled: statSync(inputWasm).size,
  web: statSync(webWasm).size,
  node: statSync(nodeWasm).size,
};
for (const [target, size] of Object.entries(sizes)) {
  if (size > WASM_SIZE_LIMIT) {
    throw new Error(
      `${target} wasm is ${size} bytes, exceeding the ${WASM_SIZE_LIMIT}-byte ceiling`
    );
  }
}

console.log(
  JSON.stringify({
    wasmBindgen: installedVersion,
    rustTarget: 'wasm32-unknown-unknown',
    sizeLimitBytes: WASM_SIZE_LIMIT,
    wasmBytes: sizes,
    webOutput,
    nodeOutput,
  })
);
