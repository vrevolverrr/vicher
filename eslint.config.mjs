// Mirrors the community plugin scanner (eslint-plugin-obsidianmd docs/configuration.md, "Community plugin
// scanner configuration"): its security rules are errors that block a submission; it leaves the rest as advice.
import { defineConfig, globalIgnores } from 'eslint/config';
import obsidianmd from 'eslint-plugin-obsidianmd';
import svelte from 'eslint-plugin-svelte';
import ts from 'typescript-eslint';
import layers from './scripts/eslintLayers.js';
import svelteConfig from './svelte.config.js';

const warn = (setting) => (Array.isArray(setting) ? ['warn', ...setting.slice(1)] : setting === 'off' || setting === 0 ? setting : 'warn');
const advisory = obsidianmd.configs.recommended.map((config) =>
  config.rules ? { ...config, rules: Object.fromEntries(Object.entries(config.rules).map(([rule, setting]) => [rule, warn(setting)])) } : config,
);
// The scanner's TypeScript entries skip `.svelte`; the same rules on components, keeping svelte-eslint-parser as the parser.
const SVELTE_FILES = ['**/*.svelte', '**/*.svelte.ts'];
const TS_FILES = '**/*.{ts,cts,mts,tsx}';
const advisorySvelte = advisory
  .filter((config) => config.files?.flat().includes(TS_FILES))
  .map(({ languageOptions, files, ...config }) => ({ ...config, files: ['**/*.svelte'] }));

export default defineConfig([
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['eslint.config.*', 'manifest.json'] },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.json', '.svelte'],
      },
    },
  },
  ...advisory,
  ...advisorySvelte,
  // Its rules entry has no `files`, and its rules fail on non-Svelte files such as package.json.
  ...svelte.configs.recommended.map((config) => (config.files ? config : { ...config, files: SVELTE_FILES })),
  {
    files: SVELTE_FILES,
    languageOptions: { parserOptions: { parser: ts.parser, svelteConfig } },
  },
  {
    files: ['**/*.{ts,cts,mts,tsx,js,cjs,mjs,jsx,svelte}'],
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-unsanitized/method': 'error',
      'no-unsanitized/property': 'error',
      'obsidianmd/regex-lookbehind': 'error',
      'obsidianmd/no-forbidden-elements': 'error',

      'no-undef': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      'import/no-unresolved': 'off',
      'obsidianmd/validate-manifest': 'off',
      'obsidianmd/validate-license': 'off',
      'obsidianmd/ui/sentence-case': ['warn', { enforceCamelCaseLower: true, ignoreWords: ['Vicher'] }],
    },
  },
  {
    files: ['src/**/*.{ts,svelte}'],
    plugins: { vicher: layers },
    rules: { 'vicher/layers': 'error', 'vicher/no-dom': 'error', 'vicher/provider-names': 'error', 'vicher/composer-area': 'error' },
  },
  globalIgnores([
    'main.js',
    '.context',
    'bench',
    'coverage',
    'esbuild.config.mjs',
    'vitest.config.mts',
    'svelte.config.js',
    '**/*.test.*',
    'tests',
    '**/*.cjs',
    '**/*.mjs',
    'scripts',
    'docs',
  ]),
]);
