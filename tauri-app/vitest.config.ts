import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      enabled: false
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
