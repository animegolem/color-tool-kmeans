module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module'
  },
  extends: ['eslint:recommended', 'plugin:svelte/recommended'],
  plugins: ['@typescript-eslint'],
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    }
  ],
  env: {
    browser: true,
    es2021: true
  },
  ignorePatterns: ['dist', 'node_modules']
};
