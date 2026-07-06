import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default tseslint.config(
  // Never lint build output or generated dirs.
  { ignores: ['dist/', '.astro/', 'node_modules/'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,

  // Project-wide rule tweaks.
  {
    rules: {
      // Allow intentional `_`-prefixed unused args/vars (e.g. ignored callback params).
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
);
