import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default tseslint.config(
  // Never lint build output or generated dirs.
  { ignores: ['dist/', '.astro/', 'node_modules/'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,

  // Sample scripts shipped alongside the articles. These are not part of the
  // site build: `thai-digits.mjs` is a Node script, and `team-demo.workflow.js`
  // is written for an agent-workflow runtime that injects `phase`, `agent` and
  // `log` into scope. Declare what each one is handed so `no-undef` stops
  // reporting a runtime it cannot see.
  {
    files: ['docs/samples/**/*.{js,mjs}'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        agent: 'readonly',
        phase: 'readonly',
        log: 'readonly',
      },
    },
  },

  // Project-wide rule tweaks.
  {
    rules: {
      // Allow intentional `_`-prefixed unused args/vars (e.g. ignored callback params).
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
);
