import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Called only after the shell dispatcher has identified staged frontend code.
// No writes, installs, globs or package-manager lifecycle scripts.
try {
  const [dependencies, snapshot, pathList] = process.argv.slice(2);
  if (!dependencies || !snapshot || !pathList) {
    throw new Error(
      'usage: prettier-index.mjs <dependencies> <snapshot> <paths>'
    );
  }
  const prettier = await import(
    pathToFileURL(resolve(dependencies, 'prettier/index.mjs')).href
  );
  const files = readFileSync(pathList, 'utf8').split('\0').filter(Boolean);
  let failures = 0;
  for (const file of files) {
    const absolute = resolve(snapshot, file);
    const info = await prettier.getFileInfo(absolute, {
      ignorePath: resolve(snapshot, 'tauri-app/.prettierignore'),
    });
    if (info.ignored) continue;
    const options = await prettier.resolveConfig(absolute, {
      config: resolve(snapshot, 'tauri-app/prettier.config.mjs'),
      editorconfig: true,
    });
    if (
      !(await prettier.check(readFileSync(absolute, 'utf8'), {
        ...options,
        filepath: absolute,
      }))
    ) {
      console.error(`[pre-commit] formatting: ${JSON.stringify(file)}`);
      failures++;
    }
  }
  console.log(
    `[pre-commit] Prettier: ${files.length} staged paths, ${failures} failures`
  );
  process.exitCode = failures ? 1 : 0;
} catch (error) {
  console.error(`[pre-commit] Prettier check failed: ${error.message}`);
  process.exitCode = 1;
}
