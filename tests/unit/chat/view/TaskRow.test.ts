/** @jest-environment jsdom */
import type { NoticeEvent } from '@/agents/types';
import { TaskRow } from '@/chat/view/TaskRow';

jest.mock('obsidian', () => ({ setIcon: jest.fn() }), { virtual: true });

const done = (task: string, description: string, text: string, status: NoticeEvent['status'] = 'completed'): NoticeEvent =>
  ({ type: 'notice', task, description, status, text });

function setup() {
  jest.useFakeTimers();
  const host = document.createElement('div');
  const row = new TaskRow(host, () => 'claude', async () => undefined);
  const card = (): HTMLElement => host.querySelector('.vicher-task-row')!;
  const names = (selector = '.vicher-task'): string[] =>
    [...host.querySelectorAll(`${selector} .vicher-task-description`)].map((el) => el.textContent ?? '');
  const shown = (): string[] => names('.vicher-task:not(.is-folded, .is-replaced)');
  const more = (): string => host.querySelector('.vicher-task-more')?.textContent ?? '';
  return { host, row, card, names, shown, more };
}

afterEach(() => jest.useRealTimers());

it('collapsed, shows the first running task with a count of the rest, and opening only reveals the others', () => {
  const { host, row, shown, more } = setup();
  row.set([{ id: 'a', description: 'Review' }, { id: 'b', description: 'Count' }]);
  expect(shown()).toEqual(['Review']);
  expect(more()).toBe('+\u20091 other');

  host.querySelector<HTMLElement>('.vicher-task-toggle')!.click();
  expect(shown()).toEqual(['Review', 'Count']);
  expect(more()).toBe('');
});

it('collapsed, shows every waiting result and one running task, a failure with its pill', () => {
  const { host, row, names, shown, more } = setup();
  row.set([{ id: 'a', description: 'Draw' }, { id: 'b', description: 'Review' }, { id: 'c', description: 'Count' }]);
  row.notice(done('b', 'Review', 'Two typos.'));
  row.notice(done('c', 'Count', 'No such file', 'failed'));
  row.set([{ id: 'a', description: 'Draw' }]);
  jest.advanceTimersByTime(2000);

  expect(names()).toEqual(['Draw', 'Review', 'Count']);
  expect(shown()).toEqual(['Draw', 'Review', 'Count']);
  expect(more()).toBe('');
  const results = [...host.querySelectorAll<HTMLElement>('.vicher-task.is-result')];
  expect(results.map((el) => `${el.dataset.status} ${el.querySelector('.vicher-task-note')?.textContent}`)).toEqual(['completed ', 'failed Failed']);
  expect(results.map((el) => el.querySelector('.vicher-task-time')?.textContent)).toEqual(['Done in 0s', '0s']);
  expect(host.textContent).not.toContain('Two typos.');
  expect(results.map((el) => el.querySelector('.vicher-task-mark.is-drawing') !== null)).toEqual([true, false]);
});

it('keeps a result that comes after its task left, then fades it after 10 s off the card', () => {
  const { row, card, names } = setup();
  row.set([{ id: 'a', description: 'Review' }]);
  row.set([]);
  jest.advanceTimersByTime(700);
  row.notice(done('a', 'Review', 'Fine.'));
  card().dispatchEvent(new Event('pointerenter'));
  jest.advanceTimersByTime(60_000);
  expect(names()).toEqual(['Review']);

  card().dispatchEvent(new Event('pointerleave'));
  jest.advanceTimersByTime(9_000);
  expect(names()).toEqual(['Review']);
  jest.advanceTimersByTime(2000);
  expect(names()).toEqual([]);
  expect(card().hidden).toBe(true);
});

it('dismisses one result from its row, leaving the rest', () => {
  const { host, row, names } = setup();
  row.set([{ id: 'a', description: 'Draw' }, { id: 'b', description: 'Count' }]);
  row.notice(done('a', 'Draw', 'No such file', 'failed'));
  row.notice(done('b', 'Count', '4'));
  row.set([]);
  host.querySelector<HTMLElement>('.vicher-task.is-result .vicher-task-dismiss')!.click();
  jest.advanceTimersByTime(500);
  expect(names()).toEqual(['Count']);
});

it('keeps a failure until the student sends a message', () => {
  const { row, names } = setup();
  row.set([{ id: 'a', description: 'Draw' }]);
  row.notice(done('a', 'Draw', 'No such file', 'failed'));
  row.set([]);
  jest.advanceTimersByTime(120_000);
  expect(names()).toEqual(['Draw']);

  row.sent();
  jest.advanceTimersByTime(1000);
  expect(names()).toEqual([]);
});

it('says when a stop fails, then offers stop again', async () => {
  jest.useFakeTimers();
  const host = document.createElement('div');
  const row = new TaskRow(host, () => 'claude', () => Promise.reject(new Error('no')));
  row.set([{ id: 'a', description: 'Draw' }]);
  host.querySelector<HTMLElement>('.vicher-task-stop')!.click();
  await Promise.resolve(); await Promise.resolve();
  expect(host.querySelector('.vicher-task-note')?.textContent).toBe('Could not stop');
  expect(host.querySelector('.vicher-task-stop')?.hasAttribute('disabled')).toBe(false);
  jest.advanceTimersByTime(3000);
  expect(host.querySelector('.vicher-task-note')?.textContent).toBe('');
});

it('adds a result as a new row at the bottom, and swaps the next running task into the running slot at once', () => {
  const { host, row, shown } = setup();
  row.set([{ id: 'a', description: 'Proof' }, { id: 'b', description: 'Examples' }]);
  row.notice(done('a', 'Proof', ''));
  row.set([{ id: 'b', description: 'Examples' }]);

  const replaced = host.querySelector<HTMLElement>('.vicher-task.is-replaced');
  expect(replaced?.textContent).toContain('Proof');
  expect(host.querySelector('.vicher-task.is-instant')?.textContent).toContain('Examples');
  expect(shown()).toEqual(['Examples', 'Proof']);
  expect(host.querySelector('.vicher-task.is-result')?.textContent).toContain('Proof');
  jest.advanceTimersByTime(500);
  expect(replaced?.isConnected).toBe(false);
});

it('lets a task that ends without a result go', () => {
  const { row, card, names } = setup();
  row.set([{ id: 'a', description: 'Watch' }]);
  row.set([]);
  jest.advanceTimersByTime(2000);
  expect(names()).toEqual([]);
  expect(card().hidden).toBe(true);
});
