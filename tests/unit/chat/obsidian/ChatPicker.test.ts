/**
 * @vitest-environment jsdom
 */
import type { ChatSummary } from '@/chat/ChatRecord';
import type { ChatPickerActions } from '@/chat/obsidian/ChatPicker';
import { ChatPicker } from '@/chat/obsidian/ChatPicker';
import { Notice } from 'obsidian';
import { flushSync } from 'svelte';
import { installFakeAnimate } from '../../../fakeAnimate';

vi.mock('obsidian', () => ({
  Modal: class {
    contentEl = document.createElement('div');
    modalEl = document.createElement('div');
    close = vi.fn();
  },
  Notice: vi.fn(),
  setIcon: vi.fn(),
}));

const HOUR = 3_600_000;
const settle = async () => {
  await vi.advanceTimersByTimeAsync(0);
  flushSync();
};

// jsdom does not implement scrolling.
HTMLElement.prototype.scrollIntoView = vi.fn();

function chats(count: number, text = ''): ChatSummary[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `id-${i}`,
    agent: 'claude' as const,
    title: `Chat ${i}`,
    updatedAt: Date.now() - i * 5 * HOUR,
    text,
  }));
}

/** Svelte adds pointer listeners a microtask after it mounts. */
async function open(list: ChatSummary[], actions: Partial<ChatPickerActions> = {}) {
  const full: ChatPickerActions = { open: vi.fn(), remove: vi.fn(async () => undefined), ...actions };
  const picker = new ChatPicker({} as never, list, full);
  picker.onOpen();
  const el = picker.modalEl;
  document.body.appendChild(el);
  await Promise.resolve();
  const input = el.querySelector<HTMLInputElement>('.prompt-input')!;
  const listEl = el.querySelector<HTMLElement>('.vicher-chat-list')!;
  return {
    picker,
    actions: full,
    input,
    listEl,
    titles: () => [...el.querySelectorAll('.vicher-chat-row .vicher-chat-title')].map((t) => t.textContent),
    rows: () => el.querySelectorAll('.vicher-chat-row').length,
    headings: () => [...el.querySelectorAll('.vicher-chat-group')].map((h) => h.textContent),
    search: (query: string) => {
      input.value = query;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      flushSync();
    },
    key: (key: string, init: KeyboardEventInit = {}) => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true, bubbles: true, ...init }));
      flushSync();
    },
    scroll: () => {
      listEl.dispatchEvent(new Event('scroll'));
      flushSync();
    },
  };
}

describe('ChatPicker', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    vi.mocked(Notice).mockClear();
  });

  it('keeps the native search header outside the scrollable results', async () => {
    const view = await open(chats(3));
    expect(view.picker.modalEl.classList.contains('prompt')).toBe(true);
    expect(view.input.placeholder).toBe('Search chats');
    expect(view.input.parentElement!.classList.contains('prompt-input-container')).toBe(true);
    expect(view.listEl.contains(view.input)).toBe(false);
    expect(view.listEl.classList.contains('prompt-results')).toBe(true);
    expect(view.picker.modalEl.querySelector('.prompt-instructions')?.textContent).toContain('to navigate');
  });

  it('clears a search from the header control and closes when the query is already empty', async () => {
    const view = await open(chats(3));
    view.search('Chat 2');
    expect(view.titles()).toEqual(['Chat 2']);
    const clear = view.picker.modalEl.querySelector<HTMLElement>('.search-input-clear-button')!;
    expect(clear.getAttribute('aria-label')).toBe('Clear search');
    clear.click();
    flushSync();
    expect(view.input.value).toBe('');
    expect(document.activeElement).toBe(view.input);
    expect(view.titles()).toEqual(['Chat 0', 'Chat 1', 'Chat 2']);
    expect(clear.getAttribute('aria-label')).toBe('Close');
    expect(view.picker.close).not.toHaveBeenCalled();
    clear.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true, bubbles: true }));
    expect(view.picker.close).toHaveBeenCalledTimes(1);
    clear.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', cancelable: true, bubbles: true }));
    expect(view.picker.close).toHaveBeenCalledTimes(2);
  });

  it('keeps the search focused when the clear control is pressed with text, not when it only closes', async () => {
    const view = await open(chats(3));
    const clear = view.picker.modalEl.querySelector<HTMLElement>('.search-input-clear-button')!;
    const press = () => clear.dispatchEvent(new MouseEvent('mousedown', { cancelable: true, bubbles: true }));
    expect(press()).toBe(true);
    view.search('Chat');
    expect(press()).toBe(false);
  });

  it('draws one page of a long history, then the next when the list is scrolled to the bottom', async () => {
    const view = await open(chats(120));
    expect(view.rows()).toBe(50);

    view.scroll();
    expect(view.rows()).toBe(100);

    view.scroll();
    view.scroll();
    expect(view.rows()).toBe(120);
  });

  it('draws more rows when the arrow keys run past the last drawn one', async () => {
    const view = await open(chats(120));
    for (let i = 0; i < 60; i++) view.key('ArrowDown');

    expect(view.rows()).toBe(100);
    view.key('Enter');
    expect(view.actions.open).toHaveBeenCalledWith('id-60');
    expect(view.picker.close).toHaveBeenCalled();
  });

  it('moves the active row with the arrows, stops at both ends and opens it on Enter', async () => {
    const view = await open(chats(3));
    const active = () => [...view.listEl.querySelectorAll('.vicher-chat-row')].map((row) => row.classList.contains('is-active'));
    expect(active()).toEqual([true, false, false]);
    view.key('ArrowDown');
    expect(active()).toEqual([false, true, false]);
    view.key('ArrowDown');
    view.key('ArrowDown');
    expect(active()).toEqual([false, false, true]);
    view.key('ArrowUp');
    view.key('ArrowUp');
    view.key('ArrowUp');
    expect(active()).toEqual([true, false, false]);
    view.key('ArrowDown');
    view.key('Enter');
    expect(view.actions.open).toHaveBeenCalledWith('id-1');
  });

  it('ignores keys while an input method is composing', async () => {
    const view = await open(chats(3));
    view.key('ArrowDown', { isComposing: true });
    view.key('Enter', { isComposing: true });
    expect(view.listEl.querySelector('.vicher-chat-row')!.classList.contains('is-active')).toBe(true);
    expect(view.actions.open).not.toHaveBeenCalled();
  });

  it('opens the chat from a row click', async () => {
    const view = await open(chats(3));
    view.listEl.querySelectorAll<HTMLElement>('.vicher-chat-open')[2]!.click();
    expect(view.actions.open).toHaveBeenCalledWith('id-2');
    expect(view.picker.close).toHaveBeenCalled();
  });

  it('puts a day heading above each group once, even when a group spans pages', async () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 31, 12).getTime() });
    try {
      const view = await open(chats(120));
      view.scroll();

      expect(view.headings()).toEqual(['Today', 'Yesterday', 'Previous 7 days', 'Older']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('lists search matches as one run without headings, and restarts at the first page', async () => {
    const view = await open(chats(120, 'about hash joins'));
    view.scroll();
    view.key('ArrowDown');

    view.search('joins');

    expect(view.headings()).toEqual([]);
    expect(view.rows()).toBe(50);
    expect(view.listEl.querySelector('.is-active .vicher-chat-title')?.textContent).toBe('Chat 0');
  });

  it('shows the text around a match that is not in the title', async () => {
    const view = await open(chats(1, 'we compared hash joins with nested loops'));

    view.search('nested');

    expect(view.listEl.querySelector('.vicher-chat-snippet')?.textContent).toContain('hash joins with nested loops');
  });

  it('says so when nothing matches or nothing is saved', async () => {
    const view = await open(chats(3));
    view.search('zzz');
    expect(view.listEl.querySelector('.vicher-chat-empty')?.textContent).toBe('No chats match.');
    view.key('Enter');
    expect(view.actions.open).not.toHaveBeenCalled();

    expect((await open([])).listEl.querySelector('.vicher-chat-empty')?.textContent).toBe('No saved chats.');
  });

  it('asks before deleting, and keeps the rows that were showing after the delete', async () => {
    const view = await open(chats(120));
    view.scroll();

    view.listEl.querySelector<HTMLElement>('.vicher-chat-delete')!.click();
    flushSync();
    expect(view.listEl.querySelector('.vicher-chat-confirm-text')?.textContent).toBe('Delete “Chat 0”?');
    expect(view.actions.remove).not.toHaveBeenCalled();

    view.listEl.querySelector<HTMLElement>('.is-confirming .mod-warning')!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(view.actions.remove).toHaveBeenCalledWith('id-0');
    expect(view.titles()[0]).toBe('Chat 1');
    expect(view.rows()).toBe(100);
    expect(view.listEl.querySelector('.is-confirming')).toBeNull();
  });

  it('disables the buttons of the row while it is deleted', async () => {
    let finish!: () => void;
    const view = await open(chats(3), { remove: vi.fn(() => new Promise<void>((resolve) => { finish = resolve; })) });
    view.listEl.querySelector<HTMLElement>('.vicher-chat-delete')!.click();
    flushSync();
    view.listEl.querySelector<HTMLElement>('.is-confirming .mod-warning')!.click();
    flushSync();

    const buttons = [...view.listEl.querySelectorAll<HTMLButtonElement>('.is-confirming button')];
    expect(buttons).toHaveLength(2);
    expect(buttons.every((button) => button.disabled)).toBe(true);

    finish();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(view.titles()).toEqual(['Chat 1', 'Chat 2']);
  });

  it('keeps the chat and the row, and says why, when the delete fails', async () => {
    const view = await open(chats(3), { remove: vi.fn(async () => Promise.reject(new Error('locked'))) });

    view.listEl.querySelector<HTMLElement>('.vicher-chat-delete')!.click();
    flushSync();
    view.listEl.querySelector<HTMLElement>('.is-confirming .mod-warning')!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(view.titles()).toEqual(['Chat 0', 'Chat 1', 'Chat 2']);
    expect(view.listEl.querySelector('.is-confirming')).toBeNull();
    expect(Notice).toHaveBeenCalledWith('Could not delete the chat: locked');
    expect([...view.listEl.querySelectorAll<HTMLButtonElement>('button')].some((button) => button.disabled)).toBe(false);
  });

  it('cancels a pending delete with Cancel, an arrow key or a new search', async () => {
    const view = await open(chats(3));
    const ask = () => {
      view.listEl.querySelector<HTMLElement>('.vicher-chat-delete')!.click();
      flushSync();
    };
    ask();
    view.listEl.querySelector<HTMLElement>('.is-confirming button:not(.mod-warning)')!.click();
    flushSync();
    expect(view.listEl.querySelector('.is-confirming')).toBeNull();

    ask();
    view.key('ArrowDown');
    expect(view.listEl.querySelector('.is-confirming')).toBeNull();
    expect(view.listEl.querySelector('.is-active .vicher-chat-title')?.textContent).toBe('Chat 0');

    ask();
    view.search('Chat');
    expect(view.listEl.querySelector('.is-confirming')).toBeNull();
  });

  describe('folding', () => {
    let restore: () => void;
    beforeEach(() => {
      vi.useFakeTimers({ now: new Date(2026, 9, 31, 12).getTime() });
      restore = installFakeAnimate();
    });
    afterEach(() => {
      restore();
      vi.useRealTimers();
    });

    const remove = async (view: Awaited<ReturnType<typeof open>>, index: number) => {
      view.listEl.querySelectorAll<HTMLElement>('.vicher-chat-delete')[index]!.click();
      flushSync();
      view.listEl.querySelector<HTMLElement>('.is-confirming .mod-warning')!.click();
      await settle();
    };

    it('folds the row away over a short time, and its heading with it only when it was the last under it', async () => {
      const list = [
        { id: 'a', agent: 'claude' as const, title: 'Today A', updatedAt: Date.now() - HOUR, text: '' },
        { id: 'b', agent: 'claude' as const, title: 'Today B', updatedAt: Date.now() - 2 * HOUR, text: '' },
        { id: 'c', agent: 'claude' as const, title: 'Old C', updatedAt: Date.now() - 30 * 24 * HOUR, text: '' },
      ];
      const view = await open(list);

      await remove(view, 0);
      expect(view.rows()).toBe(3);
      expect(view.headings()).toEqual(['Today', 'Older']);
      await vi.advanceTimersByTimeAsync(300);
      flushSync();
      expect(view.titles()).toEqual(['Today B', 'Old C']);
      expect(view.headings()).toEqual(['Today', 'Older']);

      await remove(view, 1);
      expect(view.rows()).toBe(2);
      expect(view.headings()).toEqual(['Today', 'Older']);
      await vi.advanceTimersByTimeAsync(300);
      flushSync();
      expect(view.titles()).toEqual(['Today B']);
      expect(view.headings()).toEqual(['Today']);
    });

    it('does not fold the rows a search drops', async () => {
      const view = await open(chats(3));
      view.search('Chat 2');
      expect(view.titles()).toEqual(['Chat 2']);
    });

    it('removes the row at once when the reader asked for less motion', async () => {
      const matchMedia = window.matchMedia;
      window.matchMedia = ((media: string) => ({ media, matches: true, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
      try {
        const view = await open(chats(2));
        await remove(view, 0);
        await vi.advanceTimersByTimeAsync(0);
        flushSync();
        expect(view.titles()).toEqual(['Chat 1']);
      } finally {
        window.matchMedia = matchMedia;
      }
    });
  });
});
