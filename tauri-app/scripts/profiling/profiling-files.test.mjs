import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { constants } from 'node:fs';
import {
  appendFile,
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';

import {
  collectBuildManifest,
  redactBuildManifest,
} from './build-manifest.mjs';
import { buildManifest, evidence } from './profiling-fixtures.mjs';
import {
  assertSafePrivateOutput,
  captureRegularFile,
  readJsonFile,
  writePrivateJson,
} from './validate-manifest.mjs';

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));

async function withTempDirectory(callback) {
  const directory = await mkdtemp(join(tmpdir(), 'color-tool-profile-test-'));
  await chmod(directory, 0o700);
  try {
    return await callback(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function buildSpec(executablePath) {
  const base = buildManifest();
  return {
    version: 1,
    id: base.id,
    commit: base.commit,
    dirty: base.dirty,
    executable: {
      path: executablePath,
      uuid: base.executable.uuid,
      profile: base.executable.profile,
      compilerFlags: base.executable.compilerFlags,
    },
    artifacts: { locks: [], symbols: [], sourceMaps: [], sidecars: [] },
    toolchain: base.toolchain,
    evidence: [evidence()],
  };
}

test('collector hashes only explicitly supplied regular files and emits a valid manifest', async () => {
  await withTempDirectory(async (directory) => {
    const executable = join(directory, 'binary');
    const lock = join(directory, 'lock');
    await writeFile(executable, 'binary-bytes');
    await writeFile(lock, 'lock-bytes');
    const spec = buildSpec(executable);
    spec.artifacts.locks.push({ id: 'lockfile', path: lock });
    const manifest = await collectBuildManifest(spec);
    assert.equal(
      manifest.executable.digestSha256,
      '71227a7f160afca3fb3c39f448735886dda7bd366252580c2222fb87d4bb4d85'
    );
    assert.equal(
      manifest.artifacts.locks[0].digestSha256,
      '38104e10f39f66dfdd5b2f3384284fdc8b0d7fedff941ca6282cecf585ead224'
    );
    assert.equal(manifest.executable.uuid.status, 'asserted');
  });
});

test('collector rejects relative paths and leaf symlink inputs', async () => {
  await withTempDirectory(async (directory) => {
    const target = join(directory, 'target');
    const link = join(directory, 'link');
    await writeFile(target, 'content');
    await symlink(target, link);
    const spec = buildSpec(link);
    await assert.rejects(collectBuildManifest(spec), {
      code: 'FILE_NOT_REGULAR',
    });
    spec.executable.path = 'relative-binary';
    await assert.rejects(collectBuildManifest(spec), {
      code: 'FILE_PATH_NOT_ABSOLUTE',
    });
  });
});

test('collector rejects unknown specification fields', async () => {
  const spec = buildSpec('/private/build/executable');
  spec.unknown = true;
  await assert.rejects(collectBuildManifest(spec), {
    code: 'UNKNOWN_BUILD_SPEC_FIELD',
  });
});

test('bounded capture rejects deterministic growth after initial metadata check and closes on failure', async () => {
  await withTempDirectory(async (directory) => {
    const input = join(directory, 'growing.json');
    const moved = join(directory, 'moved.json');
    await writeFile(input, '{}');
    let grew = false;
    await assert.rejects(
      captureRegularFile(input, {
        maxBytes: 2,
        onChunk: async () => {
          if (!grew) {
            grew = true;
            await appendFile(input, 'x'.repeat(99));
          }
        },
      }),
      { code: 'INPUT_TOO_LARGE' }
    );
    await rename(input, moved);
    await rm(moved);
  });
});

test('bounded capture rejects path replacement and closes on changed-input failure', async () => {
  await withTempDirectory(async (directory) => {
    const input = join(directory, 'moving.json');
    const original = join(directory, 'original.json');
    await writeFile(input, '{}');
    let replaced = false;
    await assert.rejects(
      captureRegularFile(input, {
        maxBytes: 1024,
        onChunk: async () => {
          if (!replaced) {
            replaced = true;
            await rename(input, original);
            await writeFile(input, '{}');
          }
        },
      }),
      { code: 'INPUT_CHANGED' }
    );
    await rm(input);
    await rm(original);
  });
});

test(
  'bounded capture rejects pre-open FIFO replacement without hanging',
  {
    skip:
      process.platform === 'win32' || constants.O_NONBLOCK === undefined
        ? 'FIFO and O_NONBLOCK probe requires a POSIX platform'
        : false,
  },
  async () => {
    await withTempDirectory(async (directory) => {
      const input = join(directory, 'replace-with-fifo.json');
      await writeFile(input, '{}');
      const script = `
        import { execFile } from 'node:child_process';
        import { rm } from 'node:fs/promises';
        import { promisify } from 'node:util';
        import { captureRegularFile } from ${JSON.stringify(join(HERE, 'private-files.mjs'))};
        import { safeErrorCode } from ${JSON.stringify(join(HERE, 'validation-primitives.mjs'))};
        const execFileAsync = promisify(execFile);
        try {
          await captureRegularFile(${JSON.stringify(input)}, {
            maxBytes: 2,
            afterInitialStat: async () => {
              await rm(${JSON.stringify(input)});
              await execFileAsync('/usr/bin/mkfifo', [${JSON.stringify(input)}]);
            },
          });
          process.stdout.write('UNEXPECTED_SUCCESS');
        } catch (error) {
          process.stdout.write(safeErrorCode(error));
        }
      `;
      const { stdout, stderr } = await execFileAsync(
        process.execPath,
        ['--input-type=module', '--eval', script],
        { timeout: 1500, killSignal: 'SIGKILL' }
      );
      assert.equal(stderr, '');
      assert.equal(stdout, 'INPUT_CHANGED');
    });
  }
);

test('explicit input reader rejects invalid byte limits before reading', async () => {
  await withTempDirectory(async (directory) => {
    const valid = join(directory, 'valid.json');
    await writeFile(valid, '{}');
    for (const maxBytes of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      await assert.rejects(readJsonFile(valid, { maxBytes }), {
        code: 'INVALID_BYTE_LIMIT',
      });
    }
  });
});

test('explicit input reader rejects symlinks, directories, oversized files, and malformed JSON', async () => {
  await withTempDirectory(async (directory) => {
    const valid = join(directory, 'valid.json');
    const link = join(directory, 'link.json');
    const malformed = join(directory, 'malformed.json');
    await writeFile(valid, '{}');
    await writeFile(malformed, '{');
    await symlink(valid, link);
    assert.deepEqual(await readJsonFile(valid), {});
    await assert.rejects(readJsonFile(link), {
      code: 'INPUT_NOT_REGULAR_FILE',
    });
    await assert.rejects(readJsonFile(directory), {
      code: 'INPUT_NOT_REGULAR_FILE',
    });
    await assert.rejects(readJsonFile(valid, { maxBytes: 1 }), {
      code: 'INPUT_TOO_LARGE',
    });
    await assert.rejects(readJsonFile(malformed), { code: 'INVALID_JSON' });
  });
});

test('private output is exclusive, mode 0600, and refuses overwrite', async () => {
  await withTempDirectory(async (directory) => {
    const output = join(directory, 'result.json');
    assert.equal(
      await assertSafePrivateOutput(output),
      join(await realpath(directory), 'result.json')
    );
    await writePrivateJson(output, { safe: true });
    assert.deepEqual(JSON.parse(await readFile(output, 'utf8')), {
      safe: true,
    });
    await assert.rejects(writePrivateJson(output, { overwrite: true }), {
      code: 'OUTPUT_EXISTS',
    });
  });
});

test('private output allows ordinary ancestor symlinks resolving outside Git', async () => {
  await withTempDirectory(async (directory) => {
    const target = join(directory, 'private-target');
    const linked = join(directory, 'private-link');
    await mkdir(target, { mode: 0o700 });
    await chmod(target, 0o700);
    await symlink(target, linked);
    const output = join(linked, 'result.json');
    assert.equal(
      await assertSafePrivateOutput(output),
      join(await realpath(target), 'result.json')
    );
    await writePrivateJson(output, { safe: true });
  });
});

test('private output rejects non-private directories, Git worktrees, and links into Git', async () => {
  await withTempDirectory(async (directory) => {
    const publicDirectory = join(directory, 'public');
    await mkdir(publicDirectory);
    await chmod(publicDirectory, 0o755);
    await assert.rejects(
      assertSafePrivateOutput(join(publicDirectory, 'result.json')),
      { code: 'OUTPUT_DIRECTORY_NOT_PRIVATE' }
    );
    await assert.rejects(
      assertSafePrivateOutput(join(HERE, 'forbidden-output.json')),
      { code: 'OUTPUT_INSIDE_GIT_WORKTREE' }
    );
    const linked = join(directory, 'linked-worktree');
    await symlink(HERE, linked);
    await assert.rejects(
      assertSafePrivateOutput(join(linked, 'forbidden-output.json')),
      { code: 'OUTPUT_INSIDE_GIT_WORKTREE' }
    );
  });
});

test('redacted build output digests every caller-controlled identifier', () => {
  const sentinel = 'private-source-name.mov';
  const manifest = buildManifest();
  manifest.id = sentinel;
  manifest.toolchain[0].name = sentinel;
  manifest.artifacts.locks.push({
    id: sentinel,
    localPath: `/private/${sentinel}`,
    digestSha256: 'b'.repeat(64),
    evidenceRefs: [sentinel],
  });
  manifest.evidence.push({
    id: sentinel,
    kind: 'hash-checked-file',
    ref: sentinel,
    digestSha256: 'b'.repeat(64),
    note: sentinel,
  });
  const redacted = redactBuildManifest(manifest);
  const serialized = JSON.stringify(redacted);
  assert.equal(serialized.includes(sentinel), false);
  assert.match(redacted.id, /^redacted:build-id:/);
  assert.match(redacted.toolchain[0].name, /^redacted:toolchain-name:/);
  assert.match(redacted.artifacts.locks[0].id, /^redacted:artifact-id:/);
  assert.match(redacted.evidence.at(-1).id, /^redacted:build-evidence-id:/);
});

test('build CLI success and validation errors never echo filename-shaped caller IDs', async () => {
  await withTempDirectory(async (directory) => {
    const sentinel = 'private-source-name.mov';
    const executable = join(directory, 'binary');
    const specPath = join(directory, 'spec.json');
    await writeFile(executable, 'binary');
    const spec = buildSpec(executable);
    spec.id = sentinel;
    await writeFile(specPath, JSON.stringify(spec));
    const { stdout, stderr } = await execFileAsync(process.execPath, [
      join(HERE, 'build-manifest.mjs'),
      '--spec',
      specPath,
    ]);
    assert.equal(stderr, '');
    assert.equal(stdout.includes(sentinel), false);

    const privatePath = join(directory, sentinel);
    await assert.rejects(
      execFileAsync(process.execPath, [
        join(HERE, 'summarize-runs.mjs'),
        '--input',
        privatePath,
      ]),
      (error) => {
        assert.match(error.stderr, /run summary failed: INPUT_UNAVAILABLE/);
        assert.equal(error.stderr.includes(sentinel), false);
        return true;
      }
    );
  });
});

test('module imports have no stdout, stderr, or CLI side effects', async () => {
  for (const moduleName of [
    'build-manifest.mjs',
    'private-files.mjs',
    'summarize-runs.mjs',
    'validate-build.mjs',
    'validate-case.mjs',
    'validate-manifest.mjs',
    'validate-run.mjs',
    'validation-primitives.mjs',
  ]) {
    const modulePath = join(HERE, moduleName);
    const { stdout, stderr } = await execFileAsync(process.execPath, [
      '--input-type=module',
      '--eval',
      `await import(${JSON.stringify(modulePath)})`,
    ]);
    assert.equal(stdout, '');
    assert.equal(stderr, '');
  }
});

test('unknown CLI arguments fail instead of being ignored', async () => {
  await assert.rejects(
    execFileAsync(process.execPath, [
      join(HERE, 'validate-manifest.mjs'),
      '--unknown',
    ]),
    (error) => {
      assert.match(error.stderr, /validation failed: UNKNOWN_ARGUMENT/);
      return true;
    }
  );
});
