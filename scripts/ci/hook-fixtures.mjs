import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  existsSync,
  lstatSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const hook = join(root, '.githooks/pre-commit');
const bash = execFileSync('/bin/sh', ['-c', 'command -v bash'], {
  encoding: 'utf8',
}).trim();

export function fixture(t, { dependencies = true } = {}) {
  const scratch = mkdtempSync(join(tmpdir(), 'color-tool-hook-test-'));
  t.after(() => rmSync(scratch, { recursive: true, force: true }));
  const dir = join(scratch, 'repo');
  // Reuse committed objects read-only; create no fixture commits and run no hook
  // through git commit. The checkout and index are independent of the source.
  execFileSync('git', [
    'clone',
    '--quiet',
    '--shared',
    '--no-checkout',
    root,
    dir,
  ]);
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: dir,
      encoding: 'utf8',
      env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
    });
  git('read-tree', 'HEAD');
  mkdirSync(join(dir, 'tauri-app'), { recursive: true });
  if (dependencies) {
    symlinkSync(
      join(root, 'tauri-app/node_modules'),
      join(dir, 'tauri-app/node_modules')
    );
  }
  const write = (file, text) => {
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    writeFileSync(join(dir, file), text);
  };
  const stage = (file, text) => {
    write(file, text);
    git('add', '--', file);
  };
  const restrictedPath = (extra = []) => {
    const bin = mkdtempSync(join(scratch, 'bin-'));
    for (const name of [
      'git',
      'bash',
      'dirname',
      'mktemp',
      'rm',
      'mkdir',
      'grep',
      'awk',
      'ln',
      ...extra,
    ]) {
      const executable = execFileSync('/bin/sh', ['-c', `command -v ${name}`], {
        encoding: 'utf8',
      }).trim();
      symlinkSync(executable, join(bin, name));
    }
    return bin;
  };
  const fingerprint = () => {
    const hash = createHash('sha256');
    hash.update(readFileSync(join(dir, '.git/index')));
    hash.update(git('status', '--porcelain=v1', '-z', '--untracked-files=all'));
    const paths = new Set([
      ...git('ls-files', '-z', '--others', '--exclude-standard').split('\0'),
      ...git('diff', '--name-only', '-z').split('\0'),
    ]);
    for (const file of paths) {
      if (!file || !existsSync(join(dir, file))) continue;
      const full = join(dir, file);
      hash.update(file);
      hash.update(
        lstatSync(full).isSymbolicLink()
          ? readlinkSync(full)
          : readFileSync(full)
      );
    }
    return hash.digest('hex');
  };
  const run = ({ path = process.env.PATH } = {}) => {
    const before = fingerprint();
    const result = spawnSync(bash, [hook], {
      cwd: dir,
      env: { ...process.env, PATH: path, GIT_OPTIONAL_LOCKS: '0' },
      encoding: 'utf8',
      timeout: 120000,
      maxBuffer: 4 * 1024 * 1024,
    });
    assert.ifError(result.error);
    assert.equal(
      fingerprint(),
      before,
      'hook must preserve index and working tree bytes'
    );
    return { ...result, output: result.stdout + result.stderr };
  };
  return { dir, git, write, stage, restrictedPath, run };
}

export function passes(result, pattern) {
  assert.equal(result.status, 0, result.output);
  if (pattern) assert.match(result.output, pattern);
}

export function fails(result, pattern) {
  assert.notEqual(result.status, 0, result.output);
  assert.notEqual(result.status, null, result.output);
  assert.match(result.output, pattern);
}
