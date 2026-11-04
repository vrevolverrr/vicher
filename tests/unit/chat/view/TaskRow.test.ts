/** @vitest-environment jsdom */
import { flushSync, mount, unmount } from 'svelte';

import type { NoticeEvent } from '@/agents/types';
import TaskRow from '@/chat/view/TaskRow.svelte';
import { installFakeAnimate } from '../../../fakeAnimate';

vi.mock('obsidian', () => ({ setIcon: vi.fn() }));

const done = (task: string, description: string, text: string, status: NoticeEvent['status'] = 'completed'): NoticeEvent =>
  ({ type: 'notice', task, description, status, text });

let removeAnimate: () => void;
let unmountRow: () => void;

beforeEach(() => {
  vi.useFakeTimers();
  removeAnimate = installFakeAnimate();
});

afterEach(() => {
  unmountRow();
  removeAnimate();
  vi.useRealTimers();
});

function setup(stop: (id: string) => Promise<void> = async () => undefined) {
  const host = document.createElement('div');
  const row = mount(TaskRow, { target: host, props: { agent: () => 'claude', stop } });
  unmountRow = () => void unmount(row);
  /** Calls the card, then draws what changed. */
  const act = (run: (card: typeof row) => void): void => {
    run(row);
    flushSync();
  };
  /** Lets `ms` pass, with the timers, motion and redraws it holds. */
  const wait = async (ms: number): Promise<void> => {
    await vi.advanceTimersByTimeAsync(ms);
  };
  const card = (): HTMLElement | null => host.querySelector('.vicher-task-row');
  const names = (selector = '.vicher-task'): string[] =>
    [...host.querySelectorAll(`${selector} .vicher-task-description`)].map((el) => el.textContent ?? '');
  const shown = (): string[] => names('.vicher-task:not(.is-folded, .is-replaced)');
  const more = (): string => host.querySelector('.vicher-task-more')?.textContent?.trim() ?? '';
  const click = (selector: string): void => {
    host.querySelector<HTMLElement>(selector)!.click();
    flushSync();
  };
  return { host, act, wait, card, names, shown, more, click };
}

it('collapsed, shows the first running task with a count of the rest, and opening only reveals the others', () => {
  const { act, click, shown, more } = setup();

  act((row) => row.set([{ id: 'a', description: 'Review' }, { id: 'b', description: 'Count' }]));

  expect(shown()).toEqual(['Review']);
  expect(more()).toBe('+ 1 other');

  click('.vicher-task-toggle');

  expect(shown()).toEqual(['Review', 'Count']);
  expect(more()).toBe('');
});

it('opens from a click anywhere on the collapsed card, but not from a row button', () => {
  const { act, click, shown } = setup();
  act((row) => row.set([{ id: 'a', description: 'Review' }, { id: 'b', description: 'Count' }]));

  click('.vicher-task-dismiss');
  expect(shown()).toEqual(['Review']);

  click('.vicher-task-list');
  expect(shown()).toEqual(['Review', 'Count']);
});

it('collapses when nothing is left to reveal, so the next task does not find it open', async () => {
  const { act, click, wait, shown } = setup();
  act((row) => row.set([{ id: 'a', description: 'Review' }, { id: 'b', description: 'Count' }]));
  click('.vicher-task-toggle');
  expect(shown()).toEqual(['Review', 'Count']);

  act((row) => row.set([{ id: 'a', description: 'Review' }]));
  await wait(1000);
  act((row) => row.set([{ id: 'a', description: 'Review' }, { id: 'c', description: 'Draw' }]));

  expect(shown()).toEqual(['Review']);
});

it('collapsed, shows every waiting result and one running task, a failure without a pill', async () => {
  const { host, act, wait, names, shown, more } = setup();
  act((row) => {
    row.set([{ id: 'a', description: 'Draw' }, { id: 'b', description: 'Review' }, { id: 'c', description: 'Count' }]);
    row.notice(done('b', 'Review', 'Two typos.'));
    row.notice(done('c', 'Count', 'No such file', 'failed'));
    row.set([{ id: 'a', description: 'Draw' }]);
  });
  await wait(2000);

  expect(names()).toEqual(['Draw', 'Review', 'Count']);
  expect(shown()).toEqual(['Draw', 'Review', 'Count']);
  expect(more()).toBe('');
  const results = [...host.querySelectorAll<HTMLElement>('.vicher-task.is-result')];
  expect(results.map((el) => `${el.dataset.status} ${el.querySelector('.vicher-task-note')?.textContent ?? ''}`)).toEqual(['completed ', 'failed ']);
  expect(results.map((el) => el.querySelector('.vicher-task-time')?.textContent?.trim())).toEqual(['Done in 0s', '0s']);
  expect(host.textContent).not.toContain('Two typos.');
  expect(results.map((el) => el.querySelector('.vicher-task-mark.is-drawing') !== null)).toEqual([true, false]);
});

it('counts a running task up each second', async () => {
  const { host, act, wait } = setup();
  act((row) => row.set([{ id: 'a', description: 'Draw' }]));

  await wait(65_000);

  expect(host.querySelector('.vicher-task-time')?.textContent?.trim()).toBe('1m 5s');
});

it('keeps a result that comes after its task left, then fades it after 4 s off the card', async () => {
  const { act, wait, card, names } = setup();
  act((row) => row.set([{ id: 'a', description: 'Review' }]));
  act((row) => row.set([]));
  await wait(1000);
  expect(card()).toBeNull();

  act((row) => row.notice(done('a', 'Review', 'Fine.')));
  await wait(1000);
  card()!.dispatchEvent(new Event('pointerenter'));
  await wait(60_000);
  expect(names()).toEqual(['Review']);

  card()!.dispatchEvent(new Event('pointerleave'));
  await wait(2990);
  expect(names()).toEqual(['Review']);
  await wait(400);

  expect(card()).toBeNull();
});

it('dismisses one result from its row, leaving the rest', async () => {
  const { act, click, wait, names } = setup();
  act((row) => {
    row.set([{ id: 'a', description: 'Draw' }, { id: 'b', description: 'Count' }]);
    row.notice(done('a', 'Draw', 'No such file', 'failed'));
    row.notice(done('b', 'Count', '4'));
    row.set([]);
  });

  click('.vicher-task.is-result .vicher-task-dismiss');
  expect(names()).toEqual(['Draw', 'Count']);
  await wait(500);

  expect(names()).toEqual(['Count']);
});

it('fades a failure like any other result', async () => {
  const { act, wait, card, names } = setup();
  act((row) => {
    row.set([{ id: 'a', description: 'Draw' }]);
    row.notice(done('a', 'Draw', 'No such file', 'failed'));
    row.set([]);
  });
  await wait(3990);
  expect(names()).toEqual(['Draw']);

  await wait(400);

  expect(card()).toBeNull();
});

it('says when a stop fails, then offers stop again', async () => {
  const { host, act, click, wait } = setup(() => Promise.reject(new Error('no')));
  act((row) => row.set([{ id: 'a', description: 'Draw' }]));

  click('.vicher-task-stop');
  expect(host.querySelector('.vicher-task-time')?.textContent).toContain('Stopping');
  await wait(0);

  expect(host.querySelector('.vicher-task-note')?.textContent).toBe('Could not stop');
  expect(host.querySelector('.vicher-task-stop')?.hasAttribute('disabled')).toBe(false);
  await wait(3000);
  expect(host.querySelector('.vicher-task-note')).toBeNull();
});

it('adds a result as a new row at the bottom, and swaps the next running task into the running slot at once', async () => {
  const { host, act, wait, shown } = setup();
  act((row) => row.set([{ id: 'a', description: 'Proof' }, { id: 'b', description: 'Examples' }]));
  await wait(1000);
  act((row) => {
    row.notice(done('a', 'Proof', ''));
    row.set([{ id: 'b', description: 'Examples' }]);
  });

  const replaced = host.querySelector<HTMLElement>('.vicher-task.is-replaced');
  expect(replaced?.textContent).toContain('Proof');
  expect(host.querySelector('.vicher-task.is-instant')?.textContent).toContain('Examples');
  expect(shown()).toEqual(['Examples', 'Proof']);
  expect(host.querySelector('.vicher-task.is-result')?.textContent).toContain('Proof');
  await wait(500);

  expect(replaced?.isConnected).toBe(false);
  expect(host.querySelector('.vicher-task.is-instant')).toBeNull();
});

it('lets a task that ends without a result go', async () => {
  const { act, wait, card, names } = setup();
  act((row) => row.set([{ id: 'a', description: 'Watch' }]));

  act((row) => row.set([]));
  await wait(500);
  expect(names()).toEqual(['Watch']);
  await wait(1500);

  expect(card()).toBeNull();
});
