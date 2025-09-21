#!/usr/bin/env node
/* eslint-disable no-console */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const THRESHOLD = parseInt(process.env.LOC_MAX || '350', 10);
const BYPASS = process.env.LOC_BYPASS === '1';

function sh(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
}

function getChangedFiles() {
  try {
    return sh('git diff --name-only HEAD^').split('\n').filter(Boolean);
  } catch {
    // initial commit fallback
    return sh('git ls-files').split('\n').filter(Boolean);
  }
}

function isTextFile(path) {
  try {
    const out = sh(`file -b ${JSON.stringify(path)}`);
    return /text|json|xml|javascript|typescript|html|css/i.test(out);
  } catch {
    return false;
  }
}

function getCommitMessage() {
  try {
    return sh('git log -1 --pretty=%B');
  } catch {
    return '';
  }
}

const files = getChangedFiles().filter((f) => !(
  f.startsWith('figma/') ||
  f.includes('node_modules/') ||
  f.startsWith('dist/') ||
  f.startsWith('build/') ||
  f.startsWith('pkgs/proportions-et-relations-colorees/')
));

const offenders = [];
for (const f of files) {
  try {
    if (!isTextFile(f)) continue;
    const content = readFileSync(f, 'utf8');
    const loc = content.split(/\r?\n/).length;
    if (loc > THRESHOLD) offenders.push({ file: f, loc });
  } catch {}
}

if (offenders.length === 0) {
  console.log(`[loc-enforce] OK — no files over ${THRESHOLD} LOC.`);
  process.exit(0);
}

const msg = getCommitMessage();
const hasBypass = /\[loc-bypass\]/i.test(msg);

console.warn('[loc-enforce] Files over threshold:');
for (const o of offenders) console.warn(` - ${o.file} (${o.loc} LOC)`);

if (BYPASS || hasBypass) {
  console.warn('[loc-enforce] Bypassed due to LOC_BYPASS=1 or [loc-bypass] in commit message.');
  process.exit(0);
}

console.error(`::error:: LOC check failed. Threshold=${THRESHOLD}. Add [loc-bypass] in commit message if intentional.`);
process.exit(1);

