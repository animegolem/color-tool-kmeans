import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

const IGNORE_GLOBS = ['dist/**', 'node_modules/**', 'src-tauri/target/**', '**/*.js', 'prettier.config.cjs'];
const BROWSER_GLOBALS = {
  window: 'readonly',
  document: 'readonly',
  console: 'readonly',
  Blob: 'readonly',
  URL: 'readonly',
  Image: 'readonly',
  OffscreenCanvas: 'readonly',
  localStorage: 'readonly',
  setTimeout: 'readonly',
  createImageBitmap: 'readonly'
};

export default [
  {
    ignores: IGNORE_GLOBS
  },
  {
    files: ['**/*.{ts,tsx,cts,mts}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: BROWSER_GLOBALS
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      ...tsPlugin.configs['flat/recommended'].rules
    }
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.svelte']
      },
      globals: BROWSER_GLOBALS
    },
    plugins: {
      svelte: sveltePlugin
    },
    rules: {
      ...sveltePlugin.configs['flat/recommended'].rules
    }
  }
];
