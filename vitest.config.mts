import path from 'node:path';

import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

const alias = {
  '@': path.resolve(import.meta.dirname, 'src'),
  'figure-worker': path.resolve(import.meta.dirname, 'tests/figureWorker.ts'),
  obsidian: path.resolve(import.meta.dirname, 'tests/obsidian.ts'),
};
// Svelte's browser build: its default export is the server renderer, which cannot mount.
const resolve = { alias, conditions: ['browser'] };
const setupFiles = ['tests/setupWindow.ts', 'tests/setupDom.ts'];
const project = (name: string, include: string) => ({ plugins: [svelte()], resolve, test: { name, globals: true, setupFiles, include: [include] } });

export default defineConfig({
  test: {
    globals: true,
    globalSetup: 'tests/globalSetup.js',
    projects: [project('unit', 'tests/unit/**/*.test.ts'), project('integration', 'tests/integration/**/*.test.ts'), project('bench', 'bench/figure/*.test.ts')],
  },
});
