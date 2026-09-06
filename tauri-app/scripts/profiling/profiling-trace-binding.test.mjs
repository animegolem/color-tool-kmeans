import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import test from 'node:test';

import { importTraceRun } from './import-trace-run.mjs';
import { importOptions, withFixture } from './trace-fixtures.mjs';

test('binding accounts every action and selects multiple cases explicitly', async () => {
  const actions = [
    { id: 'action-a', sequence: 1 },
    { id: 'action-b', sequence: 2 },
  ];
  await withFixture({ actions }, async ({ paths, binding }) => {
    binding.actions[1].disposition = 'selected';
    binding.actions[0].role = 'warmup';
    await writeFile(paths.binding, JSON.stringify(binding));
    const { run, receipt } = await importTraceRun(importOptions(paths));
    assert.equal(run.attempts.length, 2);
    assert.deepEqual(
      run.attempts.map((attempt) => attempt.sequence),
      [1, 2]
    );
    assert.equal(receipt.selectedActionCount, 2);
  });
});

test('binding cannot omit, duplicate, or invent an action', async () => {
  for (const mutate of [
    (binding) => binding.actions.pop(),
    (binding) => binding.actions.push({ ...binding.actions[0] }),
    (binding) => {
      binding.actions[1].id = 'invented-action';
    },
  ]) {
    const actions = [
      { id: 'action-a', sequence: 1 },
      { id: 'action-b', sequence: 2 },
    ];
    await withFixture({ actions }, async ({ paths, binding }) => {
      mutate(binding);
      await writeFile(paths.binding, JSON.stringify(binding));
      await assert.rejects(importTraceRun(importOptions(paths)));
    });
  }
});

test('binding digest mismatch is rejected or explicitly diagnostic', async () => {
  await withFixture({}, async ({ paths, binding }) => {
    binding.trace.digestSha256 = 'f'.repeat(64);
    await writeFile(paths.binding, JSON.stringify(binding));
    await assert.rejects(importTraceRun(importOptions(paths)), {
      code: 'TRACE_BINDING_MISMATCH',
    });
    const { run, receipt } = await importTraceRun({
      ...importOptions(paths, true),
      outputPath: `${paths.output}.diagnostic`,
    });
    assert.equal(receipt.diagnostic, true);
    assert.equal(run.attempts[0].terminals[0].status, 'unverified');
  });
});
