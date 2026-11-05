// What jsdom cannot see: component CSS against Obsidian's own, in a real window. It opens a throwaway vault, as the
// figure bench does, and draws a chat in a popout, which also proves that clicks reach a window other than the main one.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { setup, teardown } from '../../bench/figure/benchVault';
import { evalJson } from '../../bench/figure/obsidianCli';

let vault: string;

const inPage = <T>(body: string): Promise<T> => evalJson<T>(vault, `(async () => { const ui = window.__ui; ${body} })()`);
const at = async <T>(width: number, body: string): Promise<T> => {
  await inPage(`await ui.size(${width}); return null;`);
  return inPage<T>(body);
};

// Too many steps to list, so the figure takes the full player instead of a Play button under a list.
const FIGURE = `export default function () {
  const steps = Array.from({ length: 12 }, (_, i) => ({ text: 'Step ' + i }));
  return <Figure steps={steps} caption={(step) => step.text} render={() => <Text>A figure with a player</Text>} />;
}`;

const OPEN = `(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const leaf = app.workspace.openPopoutLeaf({ size: { width: 520, height: 760 } });
  await leaf.setViewState({ type: 'vicher-chat', active: true });
  for (let i = 0; i < 40 && !leaf.view.selected; i++) await wait(100);
  const view = leaf.view, root = view.contentEl, doc = root.ownerDocument, win = doc.defaultView, ew = win.electronWindow;
  // A window the OS is not drawing gets no frames, and a menu fading out then never leaves.
  ew.setAlwaysOnTop(true, 'screen-saver');
  ew.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  ew.show();
  const panel = () => root.querySelector('.vicher-chat-panel:not([hidden])');
  const size = async (width) => { ew.setSize(width, 760); await wait(500); };
  const key = (name) => doc.dispatchEvent(new win.KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
  const press = () => doc.body.dispatchEvent(new win.PointerEvent('pointerdown', { bubbles: true }));
  const step = (quote, comment) => ({ type: 'highlight', step: { path: 'note.md', quote, comment } });
  view.panes.get(view.selected).replayReply({ at: Date.now(), parts: [
    { type: 'text', text: 'Figure.\\n\\n\`\`\`figure\\n' + ${JSON.stringify(FIGURE)} + '\\n\`\`\`\\n' },
    step('A quote', 'A comment long enough that it has to wrap in a narrow pane, so it must not run past the card'),
    step('Second stop'),
  ] }, 0);
  await wait(300);
  panel().querySelector('.vicher-reply-figure').scrollIntoView();
  for (let i = 0; i < 80 && !panel().querySelector('.vicher-player'); i++) await wait(100);
  if (!panel().querySelector('.vicher-player')) throw new Error(panel().querySelector('.vicher-reply-figure').textContent);
  window.__ui = { doc, win, root, panel, size, key, press, wait };
  return doc !== document;
})()`;

before(async () => {
  vault = await setup();
  assert.equal(await evalJson<boolean>(vault, OPEN), true, 'the chat should be in a popout window');
});

after(() => teardown());

test('Claude Code opens in a vault with no other plugin to patch Node', async () => {
  await inPage(`await ui.wait(4000); return null;`);

  const notices = await inPage<string[]>(`return [...document.querySelectorAll('.notice'), ...ui.doc.querySelectorAll('.notice')].map((el) => el.textContent);`);
  const set = await inPage<string>(`try { require('events').setMaxListeners(50, new AbortController().signal); return 'ok'; } catch (error) { return error.message; }`);

  assert.deepEqual(notices.filter((text) => text.includes('Could not open the agent')), []);
  assert.equal(set, 'ok');
});

test('the permission picker drops its chevron and name in a narrow composer', async () => {
  const shown = `const picker = ui.panel().querySelector('.vicher-permission-picker');
    return [picker.querySelector('.vicher-picker-chevron'), picker.querySelector('.vicher-picker-label > span:last-child')].map((el) => ui.win.getComputedStyle(el).display);`;

  assert.deepEqual(await at<string[]>(280, shown), ['none', 'none']);

  const wide = await at<string[]>(520, shown);
  assert.ok(wide.every((display) => display !== 'none'), `wide: ${wide.join()}`);
});

test('a walkthrough comment wraps instead of running past its card', async () => {
  const fits = await at<{ over: number; lines: number }>(280, `const card = ui.panel().querySelector('.vicher-walkthrough');
    const comment = card.querySelector('.vicher-walk-comment');
    return { over: card.scrollWidth - card.clientWidth, lines: Math.round(comment.offsetHeight / parseFloat(ui.win.getComputedStyle(comment).lineHeight)) };`);

  assert.ok(fits.over <= 1, `overflows by ${fits.over}px`);
  assert.ok(fits.lines > 1, 'the comment should take several lines');
});

test('the player drops its scrubber when its count would not fit', async () => {
  const measure = `const player = ui.panel().querySelector('.vicher-player');
    const edge = (el) => el.getBoundingClientRect().right;
    return { scrubber: ui.win.getComputedStyle(player.querySelector('input')).display, past: edge(player.querySelector('output')) - edge(player) };`;

  const narrow = await at<{ scrubber: string; past: number }>(280, measure);
  assert.equal(narrow.scrubber, 'none');
  assert.ok(narrow.past <= 0, `the count runs ${narrow.past}px past the player`);

  const wide = await at<{ scrubber: string; past: number }>(520, measure);
  assert.notEqual(wide.scrubber, 'none');
  assert.ok(wide.past <= 0, `the count runs ${wide.past}px past the player`);
});

test('a menu in a popout window opens on a click and closes on Escape or a press outside', async () => {
  const menus = `ui.panel().querySelectorAll('.vicher-picker-menu').length`;
  const open = `ui.panel().querySelector('.vicher-picker').click(); await ui.wait(350); return ${menus};`;

  await inPage(`await ui.size(520); return null;`);

  assert.equal(await inPage<number>(open), 1);
  assert.equal(await inPage<number>(`ui.key('Escape'); await ui.wait(350); return ${menus};`), 0);
  assert.equal(await inPage<number>(open), 1);
  assert.equal(await inPage<number>(`ui.press(); await ui.wait(350); return ${menus};`), 0);
});
