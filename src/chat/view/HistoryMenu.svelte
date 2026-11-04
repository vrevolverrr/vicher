<script module lang="ts">
  import type { ChatSummary } from '@/chat/ChatRecord';
  import type { ChatTab } from '@/chat/view/ChatTabs';

  export interface HistoryMenuHost {
    /** The saved chats, newest first. */
    chats(): Promise<ChatSummary[]>;
    /** Open chats in the same order as the numbered buttons, including unsaved ones. */
    tabs?(): readonly ChatTab[];
    /** The id of the chat in this tab. */
    current(): string | undefined;
    open(chatId: string): void;
    /** Opens the searchable list of every chat. */
    showAll(): void;
  }
</script>

<script lang="ts">
  import { chatTabStatus } from '@/chat/view/ChatTabs';
  import { agentIcon } from '@/chat/view/agentIcons';
  import { formatWhen } from '@/chat/view/chatList';
  import Menu from '@/chat/view/Menu.svelte';
  import { messageOf } from '@/shared/messageOf';
  import { icon } from '@/shared/view/icon';

  /**
   * The header button and its menu of open and recent chats. The menu opens when the pointer enters the button (or on a
   * click, for the keyboard) and closes shortly after the pointer leaves both, on Escape, or on a press outside. It opens
   * in the top layer: the workspace leaf's `contain: strict` would clip it.
   */
  const { host }: { host: HistoryMenuHost } = $props();

  const RECENT = 10;
  const GAP = 4;
  const CLOSE_DELAY_MS = 200;

  const id = $props.id();
  let anchor = $state<HTMLButtonElement>();
  let menu: HTMLElement | undefined;
  let open = $state(false);
  let listing = $state<{ chats: ChatSummary[]; error: string; tabs: readonly ChatTab[]; current: string | undefined }>();
  const recent = $derived(listing?.chats.filter((chat) => !listing!.tabs.some((tab) => tab.id === chat.id)).slice(0, RECENT) ?? []);
  let closing: number | undefined;
  /** Bumps on each read, so a slow read cannot replace a newer one. */
  let generation = 0;
  let focusFirst = false;

  export function refresh(): void {
    if (open) void load();
  }

  export function close(): void {
    cancelClose();
    open = false;
    focusFirst = false;
  }

  function show(): void {
    cancelClose();
    if (open) return;
    listing = undefined;
    open = true;
    void load();
  }

  async function load(): Promise<void> {
    const at = ++generation;
    let chats: ChatSummary[] = [];
    let error = '';
    try {
      chats = await host.chats();
    } catch (cause) {
      error = `Could not load recent chats: ${messageOf(cause)}`;
    }
    if (at !== generation) return;
    listing = { chats, error, tabs: host.tabs?.() ?? [], current: host.current() };
  }

  // Runs once the rows a read brought are drawn.
  $effect(() => {
    if (listing && focusFirst) focusItem();
  });

  function focusItem(): void {
    focusFirst = false;
    menu?.querySelector<HTMLElement>('.vicher-menu-item')?.focus();
  }

  function cancelClose(): void {
    window.clearTimeout(closing);
    closing = undefined;
  }

  const enter = (): void => {
    if (open) cancelClose();
    else show();
  };

  const leave = (): void => {
    cancelClose();
    closing = window.setTimeout(close, CLOSE_DELAY_MS);
  };

  function keydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown') return;
    event.preventDefault();
    focusFirst = true;
    show();
    if (listing) focusItem();
  }

  const place = (el: HTMLElement) => {
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    el.style.top = `${rect.bottom + GAP}px`;
    el.style.right = `${anchor.ownerDocument.documentElement.clientWidth - rect.right}px`;
    // jsdom has no popover API and hides an element it cannot open.
    if ('showPopover' in el) {
      el.popover = 'manual';
      el.showPopover();
    }
    menu = el;
    return () => {
      if (menu === el) menu = undefined;
    };
  };

  $effect(() => cancelClose);

  const pick = (action: () => void) => (): void => {
    close();
    action();
  };
</script>

{#snippet row(chat: Pick<ChatSummary, 'id' | 'title' | 'agent'>, number?: number, status?: string, when?: string)}
  <button
    type="button"
    class="vicher-menu-item vicher-history-row"
    role="menuitem"
    title={chat.title || 'New chat'}
    aria-current={chat.id === listing?.current ? 'true' : undefined}
    onclick={pick(() => host.open(chat.id))}
  >
    {#if number !== undefined}<span class="vicher-history-number">{number}</span>{/if}
    <svg {@attach agentIcon(chat.agent)}></svg>
    <span class="vicher-history-title">{chat.title || 'New chat'}</span>
    {#if status}<span class="vicher-history-status">{status}</span>{/if}
    {#if when}<span class="vicher-history-when">{when}</span>{/if}
  </button>
{/snippet}

<button
  bind:this={anchor}
  type="button"
  {id}
  class="vicher-icon-action clickable-icon vicher-history-button"
  aria-haspopup="menu"
  aria-expanded={open}
  onclick={show}
  onkeydown={keydown}
  onpointerenter={enter}
  onpointerleave={leave}
>
  <span class="vicher-history-icon" {@attach icon('history')}></span>
  <span class="vicher-visually-hidden">Open and recent chats</span>
</button>
<Menu
  {open}
  {anchor}
  {close}
  class="vicher-history-menu"
  onpointerenter={enter}
  onpointerleave={leave}
  {@attach place}
>
  {#if listing}
    {#if listing.tabs.length}
      <div class="vicher-history-group">Open chats</div>
      {#each listing.tabs as tab, index (tab.id)}
        {@render row(tab, index + 1, chatTabStatus(tab))}
      {/each}
    {/if}
    {#if !listing.tabs.length && !recent.length}
      <div class="vicher-history-empty">{listing.error || 'No saved chats yet.'}</div>
    {:else}
      {#if listing.tabs.length && recent.length}<div class="vicher-history-group">Recent chats</div>{/if}
      {#each recent as chat (chat.id)}
        {@render row(chat, undefined, undefined, formatWhen(chat.updatedAt, Date.now()))}
      {/each}
      {#if listing.error}<div class="vicher-history-empty">{listing.error}</div>{/if}
      <button type="button" class="vicher-menu-item vicher-history-all" role="menuitem" onclick={pick(() => host.showAll())}>Show all chats</button>
    {/if}
  {/if}
</Menu>

<style>
  .vicher-history-icon {
    display: contents;
  }

  /* Two classes, to override the menu's own padding. */
  :global(.vicher-menu.vicher-history-menu) {
    position: fixed;
    inset: auto;
    margin: 0;
    display: flex;
    flex-direction: column;
    width: min(300px, 90vw);
    max-height: min(400px, 70vh);
    padding-inline-end: 12px;
    transform-origin: top right;
    scrollbar-width: auto;
  }

  :global(.vicher-history-menu::-webkit-scrollbar) {
    width: 3px;
  }

  :global(.vicher-history-menu::-webkit-scrollbar-track) {
    background: transparent;
  }

  :global(.vicher-history-menu::-webkit-scrollbar-thumb) {
    border: none;
    border-radius: 999px;
    background: var(--scrollbar-thumb-bg);
  }

  .vicher-history-row,
  .vicher-history-all {
    gap: 8px;
    padding: 6px 8px;
  }

  .vicher-history-row[aria-current='true'] {
    color: var(--text-accent);
  }

  .vicher-history-row svg {
    flex: none;
    width: 14px;
    height: 14px;
  }

  .vicher-history-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vicher-history-when,
  .vicher-history-status {
    flex: none;
    color: var(--text-faint);
    font-size: var(--font-ui-smaller);
  }

  .vicher-history-status {
    color: var(--text-muted);
  }

  .vicher-history-number {
    flex: none;
    min-width: 18px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  .vicher-history-all {
    margin-top: 4px;
    color: var(--text-muted);
  }

  .vicher-history-group,
  .vicher-history-empty {
    padding: 6px 8px 3px;
    color: var(--text-muted);
    font-size: var(--font-ui-smaller);
  }

  .vicher-history-empty {
    padding-bottom: 6px;
    color: var(--text-faint);
    font-size: inherit;
  }
</style>
