import { readFileSync } from 'node:fs';
import path from 'node:path';

import { STATES } from '@/renderer/figure/marks';

const css = readFileSync(path.join(__dirname, '../../../../src/styles.css'), 'utf8');
const selectors = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{/g)].map((match) => match[1].trim());
const SURFACES = ['vicher-figure-node', 'vicher-network-node', 'vicher-figure-cell', 'vicher-figure-seq-cell', 'vicher-network-edge', 'vicher-network-edge-label', 'vicher-figure-link', 'vicher-figure-pointer', 'vicher-figure-key-mark'];

describe('figure mark styles', () => {
  it.each(['[data-color]', ...STATES.map((state) => `[data-state='${state}']`)].flatMap((mark) => SURFACES.map((surface) => [mark, surface] as const)))('styles %s on %s', (mark, surface) => {
    const surfaceAt = new RegExp(`\\.${surface}(?![\\w-])`);
    expect(selectors.some((selector) => selector.includes(mark) && surfaceAt.test(selector))).toBe(true);
  });

  it('never styles a bare [data-color] or [data-state] for every surface', () => {
    const bare = selectors.flatMap((selector) => selector.split(',')).map((part) => part.trim()).filter((part) => /(^|\s|>)\[data-(state|color\])/.test(part));
    expect(bare).toEqual([]);
  });
});
