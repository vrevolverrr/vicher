import { readFileSync } from 'node:fs';
import path from 'node:path';

import { TAGS } from '@/renderer/figure/Tag';

const css = readFileSync(path.join(__dirname, '../../../../styles.css'), 'utf8');
const selectors = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{/g)].map((match) => match[1].trim());
const SURFACES = ['vicher-figure-node', 'vicher-network-node', 'vicher-figure-cell', 'vicher-figure-seq-cell', 'vicher-network-edge', 'vicher-network-edge-label', 'vicher-figure-link', 'vicher-figure-pointer', 'vicher-figure-key-mark'];

describe('figure tag styles', () => {
  it.each(TAGS.flatMap((tag) => SURFACES.map((surface) => [tag, surface] as const)))('styles %s on %s', (tag, surface) => {
    const surfaceAt = new RegExp(`\\.${surface}(?![\\w-])`);
    expect(selectors.some((selector) => selector.includes(`[data-tag='${tag}']`) && surfaceAt.test(selector))).toBe(true);
  });

  it('never styles a bare [data-tag] for every surface', () => {
    const bare = selectors.flatMap((selector) => selector.split(',')).map((part) => part.trim()).filter((part) => /(^|\s|>)\[data-tag/.test(part));
    expect(bare).toEqual([]);
  });
});
