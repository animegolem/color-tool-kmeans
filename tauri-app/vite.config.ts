import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => ({
  plugins: [svelte()],
  resolve: {
    alias: {
      '@color-core-wasm': resolve(
        __dirname,
        '../color-core-wasm/pkg-web/color_core_wasm.js'
      ),
    },
  },
  server: {
    port: 5175,
    strictPort: true,
    fs: {
      allow: [
        resolve(__dirname, '..'),
        resolve(__dirname, '../color-core-wasm'),
      ],
    },
  },
  optimizeDeps: {
    exclude: ['@color-core-wasm'],
  },
  build: {
    target: 'esnext',
  },
}));
