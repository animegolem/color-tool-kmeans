import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { LEGACY_EVENT } from './svelte-events.mjs';
import { fails, fixture, passes, root } from './hook-fixtures.mjs';

// Cases derived from IMP-203 / 856fc98; exercise the shared runtime detector.
for (const [name, input, expected] of [
  ['CSS disabled', 'button:disabled { opacity: 0.5; }', false],
  ['CSS compound', 'button:not(:disabled):hover {}', false],
  ['CSS animation', 'animation:none;', false],
  ['runes click', '<button onclick={run}>', false],
  ['capture', '<input oninputcapture={run}>', false],
  ['legacy click', '<button on:click={run}>', true],
  ['multiline', '<input\n on:input={run}>', true],
  ['modifier', '<form on:submit|preventDefault={run}>', true],
  ['forwarded', '<button on:click>', true],
  ['component', '<Widget on:change={run}>', true],
]) {
  test(`IMP-203 detector: ${name}`, () => {
    assert.equal(LEGACY_EVENT.test(input), expected);
  });
}

test('docs only passes without any language toolchains; index remains unchanged', (t) => {
  const f = fixture(t, { dependencies: false });
  f.stage('RAG/hook-test.md', '# Docs\n\nOnly documentation.\n');
  passes(f.run({ path: f.restrictedPath() }), /no staged code/);
});

test('docs with staged trailing whitespace fail without language toolchains', (t) => {
  const f = fixture(t, { dependencies: false });
  f.stage('RAG/hook-test.md', '# Docs  \n');
  fails(f.run({ path: f.restrictedPath() }), /trailing whitespace/);
});

test('staged conflict markers fail', (t) => {
  const f = fixture(t);
  f.stage('conflict.md', '<<<<<<< HEAD\na\n=======\nb\n>>>>>>> other\n');
  fails(f.run(), /conflict marker/);
});

test('unmerged index fails even with no conflict markers in the working copy', (t) => {
  const f = fixture(t, { dependencies: false });
  const blob = f.git('rev-parse', 'HEAD:README.md').trim();
  execFileSync('git', ['update-index', '--index-info'], {
    cwd: f.dir,
    input: `100644 ${blob} 1\tconflict.md\n100644 ${blob} 2\tconflict.md\n`,
  });
  fails(f.run({ path: f.restrictedPath() }), /unmerged index entries/);
});

test('binary assets need no language toolchains', (t) => {
  const f = fixture(t, { dependencies: false });
  f.stage('fixture.png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0xff]));
  passes(f.run({ path: f.restrictedPath() }), /no staged code/);
});

test('frontend requires Node, not a silent skip', (t) => {
  const f = fixture(t);
  f.stage('tauri-app/src/hook-test.ts', 'export const value = 1;\n');
  fails(f.run({ path: f.restrictedPath() }), /missing node/);
});

test('frontend requires installed Prettier', (t) => {
  const f = fixture(t, { dependencies: false });
  f.stage('tauri-app/src/hook-test.ts', 'export const value = 1;\n');
  fails(f.run(), /missing tauri-app\/node_modules\/prettier/);
});

test('frontend requires installed Svelte formatting plugin', (t) => {
  const f = fixture(t, { dependencies: false });
  f.stage('tauri-app/src/hook-test.ts', 'export const value = 1;\n');
  f.write('tauri-app/node_modules/prettier/bin/prettier.cjs', '// sentinel\n');
  fails(f.run(), /missing tauri-app\/node_modules\/prettier-plugin-svelte/);
});

test('actual Prettier rejects staged bad code despite a good unstaged repair', (t) => {
  const f = fixture(t);
  f.stage('tauri-app/src/hook-test.ts', 'export const value={a:1};\n');
  f.write('tauri-app/src/hook-test.ts', 'export const value = { a: 1 };\n');
  fails(f.run(), /formatting.*hook-test.ts/);
});

test('actual Prettier accepts staged good code despite unstaged damage', (t) => {
  const f = fixture(t);
  f.stage('tauri-app/src/hook-test.ts', 'export const value = { a: 1 };\n');
  f.write('tauri-app/src/hook-test.ts', 'export const value={a:1};\n');
  passes(f.run(), /Prettier: 1 staged paths, 0 failures/);
});

test('staged formatter config, not its unstaged replacement, controls the check', (t) => {
  const f = fixture(t);
  const config = readFileSync(
    join(root, 'tauri-app/prettier.config.mjs'),
    'utf8'
  );
  f.stage(
    'tauri-app/prettier.config.mjs',
    config.replace('singleQuote: true', 'singleQuote: false')
  );
  f.write('tauri-app/prettier.config.mjs', config);
  f.stage('tauri-app/src/hook-test.ts', "export const value = 'hello';\n");
  fails(f.run(), /formatting.*hook-test.ts/);
});

test('malformed staged Prettier config fails closed', (t) => {
  const f = fixture(t);
  f.stage('tauri-app/prettier.config.mjs', 'export default { broken;\n');
  fails(f.run(), /Prettier check failed/);
});

test('legacy events are blocked by the hook', (t) => {
  const f = fixture(t);
  f.stage('tauri-app/src/HookTest.svelte', '<button on:click>Test</button>\n');
  fails(f.run(), /legacy on: events/);
});

test('actual Svelte formatter accepts runes events and CSS negative control', (t) => {
  const f = fixture(t);
  f.stage(
    'tauri-app/src/HookTest.svelte',
    '<button onclick={() => {}}>Test</button>\n\n<style>\n  button {\n    animation: none;\n  }\n</style>\n'
  );
  passes(f.run(), /0 failures/);
});

test('standalone CI detector fails on read error, rather than claiming no events', () => {
  const result = spawnSync(
    process.execPath,
    [
      join(root, 'scripts/ci/svelte-events.mjs'),
      '--',
      '/no-such-color-tool-file.svelte',
    ],
    { encoding: 'utf8' }
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /check failed/);
});

test('Rust requires Cargo', (t) => {
  const f = fixture(t);
  f.stage('color-core/src/lib.rs', 'pub fn value() {}\n');
  fails(f.run({ path: f.restrictedPath() }), /missing cargo/);
});

test('Rust requires rustfmt', (t) => {
  const f = fixture(t);
  f.stage('color-core/src/lib.rs', 'pub fn value() {}\n');
  fails(f.run({ path: f.restrictedPath(['cargo']) }), /missing rustfmt/);
});

test('actual Rust formatting rejects staged bad code despite unstaged repair', (t) => {
  const f = fixture(t);
  f.stage('color-core/src/lib.rs', 'pub fn value(){let _x=1;}\n');
  f.write('color-core/src/lib.rs', 'pub fn value() {\n    let _x = 1;\n}\n');
  fails(f.run(), /staged cargo fmt failed/);
});

test('actual Rust formatting accepts staged good code despite unstaged damage', (t) => {
  const f = fixture(t);
  f.stage('color-core/src/lib.rs', 'pub fn value() {\n    let _x = 1;\n}\n');
  f.write('color-core/src/lib.rs', 'pub fn value(){let _x=1;}\n');
  passes(f.run(), /staged Rust formatting/);
});

test('malformed staged Cargo manifest fails closed', (t) => {
  const f = fixture(t);
  f.stage('Cargo.toml', '[workspace\n');
  fails(f.run(), /staged cargo fmt failed/);
});

test('shell syntax checks staged bytes without language toolchains', (t) => {
  const f = fixture(t, { dependencies: false });
  f.stage('scripts/ci/hook-example.sh', '#!/bin/bash\nif then\n');
  f.write('scripts/ci/hook-example.sh', '#!/bin/bash\necho fine\n');
  fails(f.run({ path: f.restrictedPath() }), /shell syntax failed/);
});

test('well-formed shell passes without language toolchains', (t) => {
  const f = fixture(t, { dependencies: false });
  f.stage('scripts/ci/hook-example.sh', '#!/bin/bash\necho fine\n');
  passes(f.run({ path: f.restrictedPath() }), /passed/);
});

test('400-line advisory never blocks documentation', (t) => {
  const f = fixture(t, { dependencies: false });
  f.stage('RAG/long.md', '# Long\n'.repeat(401));
  passes(f.run({ path: f.restrictedPath() }), /LOC warning/);
});

test('deletion dispatches correctly without reading a deleted file', (t) => {
  const f = fixture(t);
  f.git('update-index', '--force-remove', 'tauri-app/src/App.svelte');
  passes(f.run(), /Prettier: 0 staged paths/);
});

test('rename handles spaces, newlines and glob characters literally', (t) => {
  const f = fixture(t);
  const text = f.git('show', 'HEAD:tauri-app/src/App.svelte');
  f.git('update-index', '--force-remove', 'tauri-app/src/App.svelte');
  f.stage('tauri-app/src/[renamed] space\nApp.svelte', text);
  passes(f.run(), /0 failures/);
});

test('mixed docs/code does not take the docs-only path', (t) => {
  const f = fixture(t);
  f.stage('RAG/hook-test.md', '# Fine\n');
  f.stage('tauri-app/src/hook-test.ts', 'export const value={a:1};\n');
  fails(f.run(), /formatting.*hook-test.ts/);
});

test('RAG generator is never executed and unrelated files are never staged', (t) => {
  const f = fixture(t, { dependencies: false });
  f.stage(
    'RAG/scripts/generate-index.sh',
    '#!/bin/bash\necho BAD > RAG/INDEX.md\nexit 77\n'
  );
  f.write('RAG/AI-IMP/unrelated.md', '# Unstaged\n');
  passes(f.run({ path: f.restrictedPath() }), /passed/);
});

test('code snapshot rejects repository symlinks rather than following them', (t) => {
  const f = fixture(t);
  symlinkSync('/tmp', join(f.dir, 'outside'));
  f.git('add', '--', 'outside');
  f.stage('tauri-app/src/hook-test.ts', 'export const value = 1;\n');
  fails(f.run(), /contains a symlink/);
});

test('hook source never invokes heavy checks, auto-installs, or git add', () => {
  const source = readFileSync(join(root, '.githooks/pre-commit'), 'utf8');
  assert.doesNotMatch(
    source,
    /\b(?:npm|npx|eslint)\s|cargo\s+(?:clippy|test)|git\s+add|generate-index\.sh/
  );
  execFileSync('bash', ['-n', join(root, '.githooks/pre-commit')]);
});
