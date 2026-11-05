/**
 * @vitest-environment jsdom
 */
import { prepareDisplayOnlyInlineCode, restoreDisplayOnlyInlineCode } from '@/renderer/markdown/obsidian/DisplayOnlyInlineCode';

describe('DisplayOnlyInlineCode', () => {
  it('replaces the content of every inline code span, wherever it sits', () => {
    const markdown = [
      'Run `= this.file.name` or ``$= dv.el("b", `x`)`` now.',
      '- item `$= app.vault`',
      '> quote `= 1 +',
      '> 2`',
      '| cell | `= x` |',
    ].join('\n');

    const prepared = prepareDisplayOnlyInlineCode(markdown);

    expect(prepared.markdown).toBe([
      'Run `vicher-inline-code-0` or ``vicher-inline-code-1`` now.',
      '- item `vicher-inline-code-2`',
      '> quote `vicher-inline-code-3`',
      '| cell | `vicher-inline-code-4` |',
    ].join('\n'));
    expect(prepared.spans).toEqual(['= this.file.name', '$= dv.el("b", `x`)', '$= app.vault', '= 1 + > 2', '= x']);
  });

  it('leaves fenced code, escaped backticks, and unclosed spans alone', () => {
    const markdown = ['\\`= not code\\`', '```js', '`= in a fence`', '```', 'open `= never closed'].join('\n');

    expect(prepareDisplayOnlyInlineCode(markdown)).toEqual({ markdown, spans: [] });
  });

  it('restores span text into inline code but not into fenced code', () => {
    const container = document.createElement('div');
    container.innerHTML = '<p><code>vicher-inline-code-0</code></p><pre><code>vicher-inline-code-0</code></pre>';

    restoreDisplayOnlyInlineCode(container, ['$= dv.x']);

    expect(container.querySelector('p code')?.textContent).toBe('$= dv.x');
    expect(container.querySelector('pre code')?.textContent).toBe('vicher-inline-code-0');
  });
});
