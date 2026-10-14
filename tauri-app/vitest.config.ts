import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { defineConfig } from 'vitest/config';

const configRequire = createRequire(import.meta.url);
const compilerModule = await import(
  pathToFileURL(configRequire.resolve('svelte/compiler')).href
);
const compiler = compilerModule.default ?? compilerModule;

function svelteComponentSsrTransform() {
  return {
    name: 'svelte-component-ssr-tests',
    enforce: 'pre' as const,
    transform(source: string, id: string) {
      const filename = id.split('?', 1)[0];
      if (!filename.endsWith('.svelte')) return null;
      const compiled = compiler.compile(source, {
        dev: true,
        filename,
        generate: 'server',
      });
      return { code: compiled.js.code, map: compiled.js.map };
    },
  };
}

export default defineConfig({
  plugins: [svelteComponentSsrTransform()],
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      enabled: false,
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
