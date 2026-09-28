import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fixture, root } from './hook-fixtures.mjs';

for (const [name, body, status] of [
  ['clean dependency tree', 'echo color-core', 0],
  ['forbidden dependency', 'echo tauri', 1],
  ['failed Cargo query', 'exit 73', 73],
]) {
  test(`core boundary: ${name}`, (t) => {
    const f = fixture(t, { dependencies: false });
    f.write('fake-bin/cargo', `#!/bin/sh\n${body}\n`);
    chmodSync(join(f.dir, 'fake-bin/cargo'), 0o755);
    const result = spawnSync(
      'bash',
      [join(root, 'scripts/ci/core-boundary.sh')],
      {
        cwd: f.dir,
        encoding: 'utf8',
        env: {
          ...process.env,
          PATH: `${join(f.dir, 'fake-bin')}:${process.env.PATH}`,
        },
      }
    );
    assert.ifError(result.error);
    assert.equal(result.status, status, result.stdout + result.stderr);
  });
}

// Execute the actual aggregate shell body, not a duplicate implementation.
const workflow = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8');
const aggregate = workflow.split(
  '      - name: Require every gate to pass\n'
)[1];
assert.ok(aggregate, 'aggregate step must exist');
const script = aggregate
  .split('        run: |\n')[1]
  .replace(/^          /gm, '');
const resultNames = [
  'HOOK_RESULT',
  'FRONTEND_RESULT',
  'RUST_RESULT',
  'WINDOWS_RESULT',
];
for (const state of ['success', 'failure', 'cancelled', 'skipped', '']) {
  for (const name of resultNames) {
    test(`CI aggregate: ${name}=${state || '(empty)'}`, () => {
      const env = {
        ...process.env,
        ...Object.fromEntries(resultNames.map((key) => [key, 'success'])),
      };
      env[name] = state;
      const result = spawnSync(
        'bash',
        ['-e', '-u', '-o', 'pipefail', '-c', script],
        {
          encoding: 'utf8',
          env,
        }
      );
      assert.ifError(result.error);
      assert.equal(result.status, state === 'success' ? 0 : 1, result.stderr);
    });
  }
}

test('CI retains all required jobs and never allows a failed or missing bundle', () => {
  assert.match(
    workflow,
    /needs: \[hook-regressions, frontend-quality, rust-quality, build-windows\]/
  );
  assert.match(workflow, /if: \$\{\{ always\(\) \}\}/);
  assert.match(workflow, /if-no-files-found: error/);
  assert.doesNotMatch(workflow, /continue-on-error|paths-ignore:|\n\s+paths:/);
});
