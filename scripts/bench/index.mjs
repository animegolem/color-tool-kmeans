#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runJsBench } from './js-runner.mjs';
import { runObservableBaseline } from './observable-baseline.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

function parseVariantFromCli() {
  const args = process.argv.slice(2);
  let variant = 'inhouse';
  const passthrough = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--variant') {
      variant = args[i + 1] ?? variant;
      i += 1;
    } else if (arg.startsWith('--variant=')) {
      variant = arg.split('=')[1] ?? variant;
    } else {
      passthrough.push(arg);
    }
  }
  return { variant, passthrough };
}

async function runRustBench(manifestPath, variant, extraArgs = []) {
  const { spawn } = await import('node:child_process');
  const args = ['run', '--quiet', '--release'];
  if (variant === 'crate') {
    args.push('--features', 'bench-crate');
  }
  args.push('--bin', 'bench_runner', '--', `--variant=${variant}`, ...extraArgs, manifestPath);
  return new Promise((resolve, reject) => {
    const cargo = spawn(
      'cargo',
      args,
      {
        cwd: path.join(repoRoot, 'tauri-app', 'src-tauri'),
        stdio: 'inherit',
        env: {
          ...process.env,
          RUSTFLAGS: ['-C', 'target-cpu=native'].join(' ')
        }
      }
    );
    cargo.on('error', reject);
    cargo.on('exit', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`bench_runner exited with code ${code}`));
      }
    });
  });
}

async function main() {
  const { variant, passthrough } = parseVariantFromCli();
  const { manifestPath } = await runJsBench(repoRoot);
  // Attempt Observable baseline (offline vendor required); non-fatal if missing.
  await runObservableBaseline(repoRoot);
  await runRustBench(manifestPath, variant, passthrough);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
