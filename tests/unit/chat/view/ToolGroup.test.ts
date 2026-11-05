/** @vitest-environment jsdom */
import { flushSync, mount, unmount } from 'svelte';

import type { ToolPart } from '@/chat/ChatRecord';
import ToolGroup from '@/chat/view/ToolGroup.svelte';

vi.mock('obsidian', () => ({ setIcon: vi.fn() }));

const call = (id: string, name: string, status: ToolPart['status'], title: string): ToolPart => ({ type: 'tool', id, name, title, status });

let host: HTMLElement;
let group: ReturnType<typeof ToolGroup>;

function setup(props: Partial<{ rows: ToolPart[]; finished: boolean; entering: boolean }> = {}) {
  host = document.createElement('div');
  group = mount(ToolGroup, { target: host, props: { rows: [], startedAt: Date.now(), ...props } });
  flushSync();
  return host.querySelector<HTMLElement>('.vicher-tools')!;
}

afterEach(() => void unmount(group));

it('keeps the calls out of reach until the summary line opens them', () => {
  const tools = setup({ rows: [call('a', 'Read', 'done', 'Read notes.md')], finished: true });
  const list = tools.querySelector<HTMLElement>('.vicher-tools-list')!;

  expect(list.inert).toBe(true);

  tools.querySelector<HTMLElement>('.vicher-tools-header')!.click();
  flushSync();
  expect(list.inert).toBe(false);
  expect(tools.querySelector('.vicher-tool')!.textContent).toBe('Read notes.md');
});

it('counts every call by name, with the plural of a name that does not end in s, h or x', () => {
  const tools = setup({
    rows: [call('1', 'Bash', 'done', 'a'), call('2', 'Bash', 'done', 'b'), call('3', 'Read', 'done', 'c'), call('4', 'Read', 'failed', 'd')],
    finished: true,
  });

  expect(tools.querySelector('.vicher-tools-summary')!.textContent).toBe('Used 2 Bash and 2 Reads (1 failed)');
  expect([...tools.querySelectorAll('.vicher-tool')].map((row) => row.getAttribute('data-status'))).toEqual(['done', 'done', 'done', 'failed']);
});

it('is a working line with no calls, which cannot be opened', () => {
  const tools = setup();

  expect(tools.classList.contains('is-running')).toBe(true);
  expect(tools.classList.contains('is-empty')).toBe(true);
  tools.querySelector<HTMLElement>('.vicher-tools-header')!.click();
  flushSync();
  expect(tools.classList.contains('is-open')).toBe(false);
});

it('eases in once, then drops the entering class when the animation ends', () => {
  const tools = setup({ entering: true });
  expect(tools.classList.contains('is-entering')).toBe(true);

  tools.dispatchEvent(new Event('animationend'));
  flushSync();
  expect(tools.classList.contains('is-entering')).toBe(false);
});

it('moves to another working phrase every few seconds', () => {
  vi.useFakeTimers();
  try {
    const tools = setup();
    const phrase = () => tools.querySelector('.vicher-tools-summary')!.textContent;
    const first = phrase();

    vi.advanceTimersByTime(3999);
    flushSync();
    expect(phrase()).toBe(first);

    vi.advanceTimersByTime(1);
    flushSync();
    expect(phrase()).not.toBe(first);
  } finally {
    vi.useRealTimers();
  }
});
