import { constants } from 'node:fs';
import { access, lstat, open, realpath, stat } from 'node:fs/promises';
import { dirname, isAbsolute, parse, resolve } from 'node:path';

import {
  MAX_INPUT_BYTES,
  ManifestError,
  fail,
} from './validation-primitives.mjs';

const READ_CHUNK_BYTES = 64 * 1024;
const CAPTURE_CODES = {
  input: {
    unavailable: 'INPUT_UNAVAILABLE',
    notRegular: 'INPUT_NOT_REGULAR_FILE',
    tooLarge: 'INPUT_TOO_LARGE',
    changed: 'INPUT_CHANGED',
    relative: 'INPUT_PATH_NOT_ABSOLUTE',
  },
  build: {
    unavailable: 'FILE_UNAVAILABLE',
    notRegular: 'FILE_NOT_REGULAR',
    tooLarge: 'FILE_TOO_LARGE',
    changed: 'FILE_CHANGED',
    relative: 'FILE_PATH_NOT_ABSOLUTE',
  },
};

function validateByteLimit(maxBytes) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    fail('INVALID_BYTE_LIMIT');
  }
}

function identity(info) {
  return {
    device: info.dev,
    inode: info.ino,
    size: info.size,
    modifiedMs: info.mtimeMs,
    changedMs: info.ctimeMs,
  };
}

function sameIdentity(left, right) {
  return (
    left.device === right.device &&
    left.inode === right.inode &&
    left.size === right.size &&
    left.modifiedMs === right.modifiedMs &&
    left.changedMs === right.changedMs
  );
}

export async function captureRegularFile(
  filePath,
  {
    maxBytes,
    requireAbsolute = false,
    domain = 'input',
    onChunk,
    afterInitialStat,
  }
) {
  validateByteLimit(maxBytes);
  const codes = CAPTURE_CODES[domain];
  if (!codes) fail('INVALID_CAPTURE_DOMAIN');
  if (requireAbsolute && !isAbsolute(filePath)) fail(codes.relative);
  const before = await lstat(filePath).catch(() => fail(codes.unavailable));
  if (before.isSymbolicLink() || !before.isFile()) fail(codes.notRegular);
  if (before.size > maxBytes) fail(codes.tooLarge);
  if (afterInitialStat) await afterInitialStat();

  const handle = await open(
    filePath,
    constants.O_RDONLY |
      (constants.O_NOFOLLOW ?? 0) |
      (constants.O_NONBLOCK ?? 0)
  ).catch(() => fail(codes.changed));
  const chunks = [];
  let totalBytes = 0;
  try {
    const opened = await handle.stat().catch(() => fail(codes.unavailable));
    if (!opened.isFile()) fail(codes.changed);
    if (!sameIdentity(identity(before), identity(opened))) fail(codes.changed);

    while (totalBytes <= maxBytes) {
      const remaining = maxBytes + 1 - totalBytes;
      const buffer = Buffer.allocUnsafe(Math.min(READ_CHUNK_BYTES, remaining));
      const { bytesRead } = await handle
        .read(buffer, 0, buffer.length, null)
        .catch(() => fail(codes.unavailable));
      if (bytesRead === 0) break;
      const chunk = buffer.subarray(0, bytesRead);
      totalBytes += bytesRead;
      if (totalBytes > maxBytes) fail(codes.tooLarge);
      if (onChunk) await onChunk(chunk);
      else chunks.push(chunk);
    }

    const afterHandle = await handle
      .stat()
      .catch(() => fail(codes.unavailable));
    const afterPath = await lstat(filePath).catch(() => fail(codes.changed));
    if (
      afterPath.isSymbolicLink() ||
      !afterPath.isFile() ||
      !sameIdentity(identity(before), identity(afterHandle)) ||
      !sameIdentity(identity(before), identity(afterPath)) ||
      totalBytes !== before.size
    ) {
      fail(codes.changed);
    }
    return onChunk ? { byteLength: totalBytes } : Buffer.concat(chunks);
  } finally {
    await handle.close().catch(() => {});
  }
}

export async function readJsonFile(
  filePath,
  { maxBytes = MAX_INPUT_BYTES } = {}
) {
  const content = await captureRegularFile(filePath, { maxBytes });
  try {
    return JSON.parse(content.toString('utf8'));
  } catch {
    fail('INVALID_JSON');
  }
}

async function findGitAncestor(startPath) {
  let current = startPath;
  const root = parse(current).root;
  while (true) {
    try {
      await access(resolve(current, '.git'), constants.F_OK);
      return current;
    } catch {
      if (current === root) return null;
      current = dirname(current);
    }
  }
}

export async function assertSafePrivateOutput(outputPath) {
  const absolute = resolve(outputPath);
  const parent = dirname(absolute);
  const parentInfo = await stat(parent).catch(() =>
    fail('OUTPUT_PARENT_UNAVAILABLE')
  );
  if (!parentInfo.isDirectory()) fail('OUTPUT_PARENT_NOT_DIRECTORY');
  const realParent = await realpath(parent).catch(() =>
    fail('OUTPUT_PARENT_UNAVAILABLE')
  );
  if (await findGitAncestor(realParent)) fail('OUTPUT_INSIDE_GIT_WORKTREE');
  const realParentInfo = await stat(realParent).catch(() =>
    fail('OUTPUT_PARENT_UNAVAILABLE')
  );
  if ((realParentInfo.mode & 0o077) !== 0) fail('OUTPUT_DIRECTORY_NOT_PRIVATE');
  try {
    await lstat(absolute);
    fail('OUTPUT_EXISTS');
  } catch (error) {
    if (error instanceof ManifestError) throw error;
    if (error.code !== 'ENOENT') fail('OUTPUT_UNAVAILABLE');
  }
  return resolve(realParent, parse(absolute).base);
}

export async function writePrivateJson(outputPath, value) {
  const safePath = await assertSafePrivateOutput(outputPath);
  const handle = await open(safePath, 'wx', 0o600).catch((error) => {
    if (error.code === 'EEXIST') fail('OUTPUT_EXISTS');
    fail('OUTPUT_UNAVAILABLE');
  });
  try {
    await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
  return safePath;
}
