#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../../', import.meta.url).pathname;
const CRATE_DIR = join(ROOT, 'compute-wasm');

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', cwd: CRATE_DIR, ...opts });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function main() {
  const args = process.argv.slice(2);
  const includeNode = args.includes('--node');
  const release = args.includes('--release');
  const skipBundler = args.includes('--no-bundler');

  const targets = [];
  if (!skipBundler) targets.push({ target: 'bundler', outDir: 'pkg' });
  if (includeNode) targets.push({ target: 'nodejs', outDir: 'pkg-node' });

  if (targets.length === 0) {
    console.error('Nothing to build: bundler disabled and no extra targets requested.');
    process.exit(1);
  }

  for (const { target, outDir } of targets) {
    const args = ['build', '--target', target, '--out-dir', outDir];
    if (release) args.push('--release');
    console.log(`Running wasm-pack ${args.join(' ')}`);
    await run('wasm-pack', args);
  }

  // Optionally copy artifacts to a public folder (left to downstream tasks per shell choice)
  const outDir = join(ROOT, 'electron-app', 'public', 'wasm');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  console.log('WASM build complete. Bundler output in compute-wasm/pkg/. Node output (if requested) in compute-wasm/pkg-node/.');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
