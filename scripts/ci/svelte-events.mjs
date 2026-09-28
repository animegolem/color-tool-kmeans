import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// IMP-203 / 856fc987f12ca78753205a67b960e5383144319a:
// the word boundary avoids CSS animation:none and button:disabled.
// This is a token guard, not a complete Svelte parser.
export const LEGACY_EVENT = /\bon:[a-zA-Z]/;

export function checkFiles(files) {
  let failed = false;
  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (LEGACY_EVENT.test(lines[i])) {
        console.error(
          `${JSON.stringify(file)}:${i + 1}: use Svelte 5 onclick/oninput, not legacy on: events`
        );
        failed = true;
      }
    }
  }
  return !failed;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const args = process.argv.slice(2);
    let files;
    if (args.length === 1 && args[0] === '--all') {
      files = execFileSync('git', ['ls-files', '-z', '--', 'tauri-app/src'], {
        encoding: 'utf8',
      })
        .split('\0')
        .filter((file) => file.endsWith('.svelte'));
    } else if (args[0] === '--' && args.length > 1) {
      files = args.slice(1);
    } else {
      throw new Error('usage: svelte-events.mjs --all | -- <files...>');
    }
    process.exitCode = checkFiles(files) ? 0 : 1;
  } catch (error) {
    console.error(`[svelte-events] check failed: ${error.message}`);
    process.exitCode = 1;
  }
}
