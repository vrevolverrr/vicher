/**
 * @vitest-environment jsdom
 */
import { flushSync, mount } from 'svelte';
import type { ChatSummary } from '@/chat/ChatRecord';
import HistoryMenu, { type HistoryMenuHost } from '@/chat/view/HistoryMenu.svelte';

vi.mock('obsidian', () => ({ setIcon: vi.fn() }));

function chat(id: string, title: string): ChatSummary {
  return { id, agent: 'claude', title, updatedAt: Date.now(), text: '' };
}

/** Svelte adds pointer listeners a microtask after it mounts. */
async function setup(chats: ChatSummary[], current?: string, tabs?: HistoryMenuHost['tabs']) {
  const host: HistoryMenuHost = {
    chats: vi.fn(async () => chats),
    current: () => current,
    open: vi.fn(),
    showAll: vi.fn(),
    tabs,
  };
  const menu = mount(HistoryMenu, { target: document.body.createDiv(), props: { host } });
  const anchor = document.querySelector<HTMLElement>('.vicher-history-button')!;
  const rows = () => [...document.querySelectorAll<HTMLElement>('.vicher-history-row')];
  await Promise.resolve();
  return { host, anchor, menu, rows };
}

const settle = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync();
};

beforeEach(() => {
  document.body.replaceChildren();
  vi.useRealTimers();
});

describe('HistoryMenu', () => {
  it('focuses the first loaded row from the keyboard and preserves focus on refresh', async () => {
    const { anchor, menu, rows } = await setup([chat('a', 'First'), chat('b', 'Second')]);
    anchor.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await settle();
    expect(document.activeElement).toBe(rows()[0]);
    rows()[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(rows()[1]);
    menu.refresh(); await settle();
    expect(document.activeElement).toBe(rows()[1]);
  });
  it('pins numbered open chats in tab order, including unsaved chats, without recent duplicates', async () => {
    const tabs: NonNullable<HistoryMenuHost['tabs']> = () => [
      { ...chat('b', 'Second'), running: true, unread: false, failed: false },
      { ...chat('draft', ''), running: false, unread: false, failed: false },
    ];
    const { anchor, rows } = await setup([chat('a', 'First'), chat('b', 'Second')], 'b', tabs);
    anchor.dispatchEvent(new Event('pointerenter')); await settle();
    expect(rows().map((row) => row.querySelector('.vicher-history-title')?.textContent)).toEqual(['Second', 'New chat', 'First']);
    expect(rows().map((row) => row.querySelector('.vicher-history-number')?.textContent)).toEqual(['1', '2', undefined]);
    expect(rows()[0]!.textContent).toContain('Working');
    expect([...document.querySelectorAll('.vicher-history-group')].map((el) => el.textContent)).toEqual(['Open chats', 'Recent chats']);
  });

  it('refreshes pinned titles and activity while the menu stays open', async () => {
    let running = true;
    const { anchor, menu, rows } = await setup([], 'a', () => [{ ...chat('a', running ? '' : 'Finished'), running, unread: !running, failed: false }]);
    anchor.dispatchEvent(new Event('pointerenter')); await settle();
    running = false; menu.refresh(); await settle();
    expect(rows()[0]!.textContent).toContain('Finished');
    expect(rows()[0]!.textContent).toContain('Unread reply');
    expect(anchor.getAttribute('aria-expanded')).toBe('true');
  });
  it('opens when the pointer enters the button and lists the recent chats', async () => {
    const { anchor, rows } = await setup([chat('a', 'First'), chat('b', 'Second')]);
    anchor.dispatchEvent(new Event('pointerenter'));
    await settle();
    expect(rows().map((row) => row.querySelector('.vicher-history-title')?.textContent)).toEqual(['First', 'Second']);
    expect(anchor.getAttribute('aria-expanded')).toBe('true');
  });

  it('lists only the ten newest chats', async () => {
    const { anchor, rows } = await setup(Array.from({ length: 14 }, (_, i) => chat(`c${i}`, `Chat ${i}`)));
    anchor.dispatchEvent(new Event('pointerenter'));
    await settle();
    expect(rows()).toHaveLength(10);
  });

  it('marks the chat in this tab', async () => {
    const { anchor, rows } = await setup([chat('a', 'First'), chat('b', 'Second')], 'b');
    anchor.dispatchEvent(new Event('pointerenter'));
    await settle();
    expect(rows().map((row) => row.getAttribute('aria-current'))).toEqual([null, 'true']);
  });

  it('opens the picked chat and closes', async () => {
    const { host, anchor, rows } = await setup([chat('a', 'First')]);
    anchor.dispatchEvent(new Event('pointerenter'));
    await settle();
    rows()[0]!.click();
    flushSync();
    expect(host.open).toHaveBeenCalledWith('a');
    expect(anchor.getAttribute('aria-expanded')).toBe('false');
  });

  it('hands over to the searchable list from the last row', async () => {
    const { host, anchor } = await setup([chat('a', 'First')]);
    anchor.dispatchEvent(new Event('pointerenter'));
    await settle();
    document.querySelector<HTMLElement>('.vicher-history-all')!.click();
    expect(host.showAll).toHaveBeenCalledTimes(1);
  });

  it('says so when there are no saved chats', async () => {
    const { anchor } = await setup([]);
    anchor.dispatchEvent(new Event('pointerenter'));
    await settle();
    expect(document.querySelector('.vicher-history-empty')?.textContent).toBe('No saved chats yet.');
    expect(document.querySelector('.vicher-history-all')).toBeNull();
  });

  it('stays open while the pointer moves from the button onto the menu', async () => {
    vi.useFakeTimers();
    const { anchor, menu } = await setup([chat('a', 'First')]);
    anchor.dispatchEvent(new Event('pointerenter'));
    anchor.dispatchEvent(new Event('pointerleave'));
    flushSync();
    await Promise.resolve();
    document.querySelector('.vicher-history-menu')!.dispatchEvent(new Event('pointerenter'));
    vi.advanceTimersByTime(500);
    expect(anchor.getAttribute('aria-expanded')).toBe('true');
    menu.close();
  });

  it('closes shortly after the pointer leaves', async () => {
    vi.useFakeTimers();
    const { anchor } = await setup([chat('a', 'First')]);
    anchor.dispatchEvent(new Event('pointerenter'));
    anchor.dispatchEvent(new Event('pointerleave'));
    vi.advanceTimersByTime(300);
    expect(anchor.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on Escape', async () => {
    const { anchor } = await setup([chat('a', 'First')]);
    anchor.dispatchEvent(new Event('pointerenter'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(anchor.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps the newest read when an older one arrives after it', async () => {
    const reads: ((chats: ChatSummary[]) => void)[] = [];
    const { host, anchor, menu, rows } = await setup([]);
    vi.mocked(host.chats).mockImplementation(() => new Promise((resolve) => reads.push(resolve)));
    anchor.dispatchEvent(new Event('pointerenter'));
    menu.refresh();

    reads[1]!([chat('b', 'Newer')]);
    await settle();
    reads[0]!([chat('a', 'Older')]);
    await settle();

    expect(rows().map((row) => row.querySelector('.vicher-history-title')?.textContent)).toEqual(['Newer']);
  });
});
