/** @vitest-environment jsdom */
import { flushSync, mount, unmount } from 'svelte';
import type { ChatTab } from '@/chat/view/chatList';
import ChatTabs from '@/chat/view/ChatTabs.svelte';
import { installFakeAnimate } from '../../../fakeAnimate';

let resize: () => void;
const tab = (id: string, fields: Partial<ChatTab> = {}): ChatTab => ({ id, title: `Topic ${id}`, agent: 'claude', running: false, unread: false, failed: false, ...fields });
const host = () => ({ create: vi.fn(), select: vi.fn(), close: vi.fn() });
const tabButtons = (bar: HTMLElement) => [...bar.querySelectorAll<HTMLButtonElement>('[role="tab"]')];

function open(bar: HTMLElement = document.body.createDiv(), callbacks = host()) {
  const tabs = mount(ChatTabs, { target: bar, props: { host: callbacks } });
  flushSync();
  return { bar, set: tabs.set, close: () => void unmount(tabs) };
}

beforeEach(() => {
  document.body.empty();
  globalThis.ResizeObserver = class {
    constructor(callback: () => void) { resize = callback; }
    observe(): void {} disconnect(): void {}
  } as unknown as typeof ResizeObserver;
});

it('updates status and selection without replacing focused buttons', () => {
  const { bar, set, close } = open();
  set([tab('a'), tab('b')], 'a');
  const first = tabButtons(bar)[0]!;
  first.focus();

  set([tab('a', { running: true }), tab('b', { unread: true })], 'a');

  expect(document.activeElement).toBe(first);
  expect(first.getAttribute('aria-label')).toBe('1: Topic a, Working');
  expect(first.getAttribute('aria-selected')).toBe('true');
  expect(tabButtons(bar)[1]!.getAttribute('aria-label')).toBe('2: Topic b, Unread reply');
  expect(first.querySelector('.vicher-chat-tab-title')!.textContent).toBe('Topic a');
  close();
});

it('fits the composer strip, keeps the selected tab visible and restores tabs as it grows', () => {
  const header = document.body.createDiv();
  let width = 92;
  Object.defineProperty(header, 'clientWidth', { get: () => width });
  const { bar, set, close } = open(header);
  set(['a', 'b', 'c', 'd'].map((id) => tab(id)), 'd');
  const visible = () => tabButtons(bar).filter((button) => !button.hidden).map((button) => button.textContent);
  const create = bar.querySelector<HTMLButtonElement>('[aria-label="New tab"]')!;

  expect(visible()).toEqual(['1Topic a', '4Topic d']);
  expect(create.hidden).toBe(false);
  expect(create.parentElement!.lastElementChild).toBe(create);

  width = 91; resize(); flushSync();
  expect(visible()).toEqual(['4Topic d']);
  expect(create.hidden).toBe(false);

  width = 200; resize(); flushSync();
  expect(visible()).toEqual(['1Topic a', '2Topic b', '3Topic c', '4Topic d']);
  close();
});

it('supports arrow navigation and closing without changing chats on hover', () => {
  const callbacks = host();
  const { bar, set, close } = open(undefined, callbacks);
  set([tab('a'), tab('b')], 'a');
  const first = tabButtons(bar)[0]!;

  first.dispatchEvent(new Event('pointerenter'));
  expect(callbacks.select).not.toHaveBeenCalled();

  first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  expect(callbacks.select).toHaveBeenCalledWith('b');
  expect(document.activeElement).toBe(tabButtons(bar)[1]);

  first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
  expect(callbacks.close).toHaveBeenCalledWith('a');

  callbacks.close.mockClear();
  const rightClick = new MouseEvent('contextmenu', { button: 2, bubbles: true, cancelable: true });
  first.dispatchEvent(rightClick);
  expect(rightClick.defaultPrevented).toBe(true);
  expect(callbacks.close).toHaveBeenCalledTimes(1);
  expect(callbacks.close).toHaveBeenCalledWith('a');
  close();
});

it('keeps replacement order for numbering, overflow and keyboard navigation, with a trailing new-tab button', () => {
  const callbacks = host();
  const { bar, set, close } = open(undefined, callbacks);
  set([tab('a'), tab('b'), tab('c')], 'b');
  set([tab('a'), tab('d'), tab('c')], 'd');
  const buttons = tabButtons(bar);

  expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual(['1: Topic a', '2: Topic d', '3: Topic c']);
  buttons[1]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  expect(callbacks.select).toHaveBeenLastCalledWith('c');

  const create = bar.querySelector<HTMLButtonElement>('[aria-label="New tab"]')!;
  create.click();
  expect(callbacks.create).toHaveBeenCalledTimes(1);
  expect(create.closest('[role="tablist"]')).toBeNull();
  close();
});

describe('tab motion', () => {
  let removeAnimate: () => void;
  let reduced: boolean;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.useFakeTimers();
    removeAnimate = installFakeAnimate();
    reduced = false;
    window.matchMedia = (() => ({ matches: reduced })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    removeAnimate();
    window.matchMedia = originalMatchMedia;
    vi.useRealTimers();
  });

  it('keeps a removed tab in its slot while it shrinks, with survivors immediately numbered and focus restored', () => {
    const { bar, set, close } = open();
    set([tab('a'), tab('b'), tab('c')], 'b');
    const middle = tabButtons(bar)[1]!;
    middle.focus();

    set([tab('a'), tab('c')], 'c');
    vi.advanceTimersByTime(100);

    expect(middle.isConnected).toBe(true);
    expect(middle.inert).toBe(true);
    expect(middle.getAttribute('aria-hidden')).toBe('true');
    expect([...middle.parentElement!.children].indexOf(middle)).toBe(1);
    const survivors = tabButtons(bar);
    expect(survivors[1]!.getAttribute('aria-label')).toBe('2: Topic c');
    expect(document.activeElement).toBe(survivors[1]);

    vi.advanceTimersByTime(200);
    expect(middle.isConnected).toBe(false);
    close();
  });

  it('opens the tabs of a restored view at once and later tabs with motion', () => {
    const animate = vi.spyOn(Element.prototype, 'animate');
    const { set, close } = open();

    set([tab('a'), tab('b')], 'a');
    vi.advanceTimersByTime(0);
    expect(animate).not.toHaveBeenCalled();

    set([tab('a'), tab('b'), tab('c')], 'c');
    vi.advanceTimersByTime(0);
    expect(animate).toHaveBeenCalled();
    close();
  });

  it('adds and removes immediately under reduced motion', () => {
    reduced = true;
    const { bar, set, close } = open();
    set([tab('a')], 'a');
    set([tab('a'), tab('b')], 'b');

    set([tab('a')], 'a');

    expect(tabButtons(bar)).toHaveLength(1);
    expect(bar.querySelectorAll('button')).toHaveLength(2);
    close();
  });
});
