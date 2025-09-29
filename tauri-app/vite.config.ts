import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => ({
  plugins: [svelte()],
  server: {
    port: 5175,
    strictPort: true,
    fs: {
      allow: [resolve(__dirname, '..'), resolve(__dirname, '../compute-wasm')]
    }
  },
  optimizeDeps: {
    exclude: []
  },
  build: {
    target: 'esnext'
  }
}));
