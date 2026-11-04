const esbuild = require('esbuild');
const path = require('path');

const root = path.resolve(__dirname, '..');

/** The element names from the figure's component registry, read in Node, so the definitions and zod stay out of the worker. */
function elementNames() {
  const { text } = esbuild.buildSync({
    entryPoints: ['src/renderer/figure/components/registry.ts'],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    absWorkingDir: root,
  }).outputFiles[0];
  const module = { exports: {} };
  new Function('module', 'exports', 'require', text)(module, module.exports, require);
  return module.exports.COMPONENTS.map((definition) => definition.name);
}

/** The figure worker as one script, for the sandbox to start from a blob URL. */
function buildFigureWorker() {
  return esbuild.buildSync({
    entryPoints: ['src/renderer/figure/workerMain.ts'],
    bundle: true,
    format: 'iife',
    target: 'es2022',
    minify: true,
    write: false,
    platform: 'browser',
    absWorkingDir: root,
    define: { FIGURE_ELEMENTS: JSON.stringify(elementNames()) },
  }).outputFiles[0].text;
}

module.exports = { buildFigureWorker };
