import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const lockHash =
  'ed8b50c13f72f8ace2b15ffddff9c3a717dc2ba75e4ea72cb24fc02bd995bc51';
const realBuilds = process.env.COLOR_TOOL_REAL_BUILD_TESTS === '1';
const workflow = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8');

// Inspect ordered steps within each job, never a cross-job regex match.
function assertProvisionedBeforeBuild(source, job, buildCommand) {
  const start = source.indexOf(`  ${job}:\n`);
  assert.notEqual(start, -1, `missing job ${job}`);
  const body = source.slice(start).split(/\n  [a-z][\w-]*:\n/)[0];
  const steps = body.split(/\n      - /).slice(1);
  const build = steps.findIndex((step) => step.includes(buildCommand));
  assert.ok(build >= 0, `missing build in ${job}`);
  for (const prerequisite of [
    'rustup target add wasm32-unknown-unknown',
    'cargo install --locked wasm-bindgen-cli --version 0.2.128',
  ]) {
    const provision = steps.findIndex((step) => step.includes(prerequisite));
    assert.ok(
      provision >= 0 && provision < build,
      `${job}: ${prerequisite} must precede the build`
    );
  }
}

test('AI-IMP-207: exact F1 Cargo.lock is admitted to the checkout', () => {
  const indexed = execFileSync('git', ['ls-files', '--', 'Cargo.lock'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(indexed.trim(), 'Cargo.lock', 'root lock must be tracked');
  const bytes = readFileSync(join(root, 'Cargo.lock'));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), lockHash);
});

test('AI-IMP-207: build owns WASM exactly once, including Playwright', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'tauri-app/package.json')));
  assert.equal(pkg.scripts.build, 'npm run wasm:build && tsc && vite build');
  assert.equal(pkg.scripts.dev, 'vite');
  const playwright = readFileSync(
    join(root, 'tauri-app/playwright.config.ts'),
    'utf8'
  );
  assert.ok(playwright.includes('npm run build && npm run preview'));
  assert.ok(!playwright.includes('npm run wasm:build'));
});

for (const [job, command] of [
  ['browser-e2e', 'npm run --prefix tauri-app test:browser'],
  ['build-windows', 'npm run --prefix tauri-app tauri build'],
]) {
  test(`AI-IMP-207: ${job} prerequisites precede its build`, () => {
    assertProvisionedBeforeBuild(workflow, job, command);
  });
}

test('AI-IMP-207: ordering check rejects late or absent provisioning', () => {
  const install =
    '      - name: Provision\n        run: |\n' +
    '          rustup target add wasm32-unknown-unknown\n' +
    '          cargo install --locked wasm-bindgen-cli --version 0.2.128\n';
  const build = '      - name: Build\n        run: npm run build\n';
  assertProvisionedBeforeBuild(
    `  fixture:\n    steps:\n${install}${build}`,
    'fixture',
    'npm run build'
  );
  for (const steps of [build, build + install]) {
    assert.throws(() =>
      assertProvisionedBeforeBuild(
        `  fixture:\n    steps:\n${steps}`,
        'fixture',
        'npm run build'
      )
    );
  }
});

function checkout(t) {
  const dir = mkdtempSync(join(tmpdir(), 'color-tool-clean-build-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  // Use only indexed bytes: no ignored lock, generated bindings, or warm dist.
  // Local callers stage the proposed patch first; CI naturally uses HEAD.
  execFileSync('git', ['checkout-index', '--all', `--prefix=${dir}/`], {
    cwd: root,
  });
  const modules = join(dir, 'tauri-app/node_modules');
  mkdirSync(modules, { recursive: true });
  for (const entry of readdirSync(join(root, 'tauri-app/node_modules'))) {
    if (entry.startsWith('.') && entry !== '.bin') continue;
    symlinkSync(
      join(root, 'tauri-app/node_modules', entry),
      join(modules, entry)
    );
  }
  const run = (command, args, options = {}) =>
    spawnSync(command, args, {
      cwd: dir,
      encoding: 'utf8',
      timeout: 300_000,
      maxBuffer: 16 * 1024 * 1024,
      ...options,
      env: {
        ...process.env,
        // Compiler caches may be warm; generated web/node binding trees may not.
        CARGO_TARGET_DIR: join(root, 'target'),
        ...options.env,
      },
    });
  return { dir, run };
}

function succeeds(result) {
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
}

test(
  'AI-IMP-207 real: missing lock fails locked Cargo; indexed lock succeeds',
  { skip: !realBuilds },
  (t) => {
    const f = checkout(t);
    const lock = join(f.dir, 'Cargo.lock');
    const saved = join(f.dir, 'Cargo.lock.saved');
    if (existsSync(lock)) renameSync(lock, saved);
    const args = [
      'build',
      '--locked',
      '--release',
      '--target',
      'wasm32-unknown-unknown',
      '-p',
      'color-core-wasm',
    ];
    const missing = f.run('cargo', args);
    assert.ifError(missing.error);
    assert.notEqual(missing.status, 0);
    // Offline resolution may reject a missing lock before Cargo reports its
    // --locked guard. The positive below differs only by restoring that lock.
    assert.match(
      missing.stderr,
      /lock file|lockfile|failed to select a version/
    );
    assert.equal(existsSync(lock), false, '--locked must not create a lock');
    if (existsSync(saved)) renameSync(saved, lock);
    succeeds(f.run('cargo', args));
    assert.equal(
      createHash('sha256').update(readFileSync(lock)).digest('hex'),
      lockHash
    );
  }
);

test(
  'AI-IMP-207 real: cold npm build generates bindings',
  { skip: !realBuilds },
  (t) => {
    const f = checkout(t);
    const binding = join(f.dir, 'color-core-wasm/pkg-web/color_core_wasm.js');
    assert.equal(existsSync(binding), false);
    const build = () => f.run('npm', ['run', '--prefix', 'tauri-app', 'build']);
    succeeds(build());
    assert.ok(existsSync(binding));
    assert.ok(existsSync(join(f.dir, 'tauri-app/dist/index.html')));
  }
);

test(
  'AI-IMP-207 real: warm build without bindgen fails',
  { skip: !realBuilds },
  (t) => {
    const f = checkout(t);
    const binding = join(f.dir, 'color-core-wasm/pkg-web/color_core_wasm.js');
    succeeds(f.run('npm', ['run', '--prefix', 'tauri-app', 'wasm:build']));
    assert.ok(existsSync(binding));
    const bin = join(f.dir, 'node-only-bin');
    mkdirSync(bin);
    symlinkSync(process.execPath, join(bin, 'node'));
    const npm = execFileSync('/bin/sh', ['-c', 'command -v npm'], {
      encoding: 'utf8',
    }).trim();
    symlinkSync(npm, join(bin, 'npm'));
    const absent = f.run('npm', ['run', '--prefix', 'tauri-app', 'build'], {
      env: { PATH: `${bin}:/usr/bin:/bin` },
    });
    assert.ifError(absent.error);
    assert.notEqual(
      absent.status,
      0,
      'warm output must not hide missing bindgen'
    );
    assert.match(
      absent.stdout + absent.stderr,
      /wasm-bindgen.*ENOENT|ENOENT.*wasm-bindgen/s
    );
    assert.ok(
      existsSync(binding),
      'warm binding was present during negative control'
    );
  }
);
