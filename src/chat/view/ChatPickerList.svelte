<script module lang="ts">
  import { cubicInOut } from 'svelte/easing';
  import { ms } from '@/shared/view/motion';

  /** Rows drawn at first and per scroll to the bottom, so a long history costs a screenful of DOM, not all of it. */
  const PAGE = 50;
  const NEAR_BOTTOM_PX = 200;
  const INSTRUCTIONS = [['↑↓', 'to navigate'], ['↵', 'to open'], ['esc', 'to dismiss']];

  export interface ChatPickerListHost {
    /** Closes the picker and opens the chat. */
    open(chatId: string): void;
    /** Whether the chat was deleted; the host reports a failure itself. */
    remove(chatId: string): Promise<boolean>;
    close(): void;
  }

  /** Folds a row, or a day heading, to nothing. */
  function fold(node: HTMLElement, { animate }: { animate: boolean }) {
    const { paddingTop, paddingBottom } = getComputedStyle(node);
    const height = node.offsetHeight;
    const top = parseFloat(paddingTop) || 0;
    const bottom = parseFloat(paddingBottom) || 0;
    return {
      duration: animate ? ms(200) : 0,
      easing: cubicInOut,
      css: (t: number) => `overflow: hidden; height: ${t * height}px; padding-top: ${t * top}px; padding-bottom: ${t * bottom}px; opacity: ${t}`,
    };
  }
</script>

<script lang="ts">
  import { tick, untrack } from 'svelte';
  import type { ChatSummary } from '@/chat/ChatRecord';
  import { agentIcon } from '@/chat/view/agentIcons';
  import { type ChatMatch, formatWhen, groupByDay, searchChats } from '@/chat/view/chatList';
  import { icon } from '@/shared/view/icon';

  /** Every saved chat, grouped by day, with search over titles and conversations and a delete on each row. */
  const { chats: initial, host }: { chats: ChatSummary[]; host: ChatPickerListHost } = $props();

  let chats = $state(untrack(() => initial));
  let query = $state('');
  /** Entries with a row. A redraw after a delete keeps the rows that were showing, so the list does not jump. */
  let drawn = $state(PAGE);
  let active = $state(0);
  /** The chat whose delete awaits a second click. */
  let confirming = $state<string | null>(null);
  let deleting = $state<string | null>(null);
  /** Only a delete folds rows away; a search swaps them at once. */
  let folding = $state(false);
  let input: HTMLInputElement;
  let list: HTMLElement;

  type Item = { key: string; heading: string } | { key: string; chat: ChatMatch; index: number; now: number };

  /** Every match in display order with the day heading it sits under; a search is one run with none. */
  const entries = $derived.by(() => {
    const matches = searchChats(chats, query.trim());
    const groups = query.trim() ? [{ label: '', items: matches }] : groupByDay(matches, Date.now());
    return groups.flatMap(({ label, items }) => items.map((chat) => ({ chat, label })));
  });
  const rows = $derived(entries.slice(0, drawn));
  const current = $derived(Math.min(active, rows.length - 1));
  const items = $derived.by(() => {
    const now = Date.now();
    const result: Item[] = [];
    let last = '';
    rows.forEach(({ chat, label }, index) => {
      if (label !== last) {
        result.push({ key: `group:${label}`, heading: label });
        last = label;
      }
      result.push({ key: chat.id, chat, index, now });
    });
    return result;
  });

  function reset(): void {
    active = 0;
    drawn = PAGE;
    confirming = null;
  }

  function clearOrClose(): void {
    if (!query) { host.close(); return; }
    query = '';
    reset();
    input.focus();
  }

  function drawMore(): void {
    if (drawn < entries.length) drawn += PAGE;
  }

  function setActive(index: number): void {
    while (index >= rows.length && drawn < entries.length) drawMore();
    if (!rows.length) return;
    active = Math.min(Math.max(index, 0), rows.length - 1);
    void tick().then(() => list.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' }));
  }

  function onKey(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (confirming) confirming = null;
      else setActive(current + (event.key === 'ArrowDown' ? 1 : -1));
    } else if (event.key === 'Enter' && rows[current]) {
      event.preventDefault();
      host.open(rows[current].chat.id);
    }
  }

  async function remove(id: string): Promise<void> {
    deleting = id;
    const removed = await host.remove(id);
    if (removed) {
      folding = true;
      chats = chats.filter((chat) => chat.id !== id);
      await tick();
      folding = false;
    }
    confirming = null;
    deleting = null;
  }
</script>

<div class="prompt-input-container mod-raised">
  <input
    bind:this={input}
    class="prompt-input"
    type="text"
    placeholder="Search chats"
    aria-label="Search chats"
    spellcheck="false"
    value={query}
    oninput={(event) => {
      query = event.currentTarget.value;
      reset();
    }}
    onkeydown={onKey}
    {@attach (el) => el.focus()}
  />
  <div
    class="search-input-clear-button"
    role="button"
    tabindex="0"
    aria-label={query ? 'Clear search' : 'Close'}
    onmousedown={(event) => { if (query) event.preventDefault(); }}
    onclick={clearOrClose}
    onkeydown={(event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      clearOrClose();
    }}
  ></div>
</div>
<div
  class="prompt-results vicher-chat-list"
  role="listbox"
  bind:this={list}
  onscroll={() => {
    if (list.scrollTop + list.clientHeight >= list.scrollHeight - NEAR_BOTTOM_PX) drawMore();
  }}
>
  {#if !items.length}
    <div class="vicher-chat-empty">{query.trim() ? 'No chats match.' : 'No saved chats.'}</div>
  {/if}
  {#each items as item (item.key)}
    {#if 'heading' in item}
      <div class="vicher-chat-group" out:fold|global={{ animate: folding }}>{item.heading}</div>
    {:else}
      {@const { chat } = item}
      {@const title = chat.title || 'Untitled chat'}
      <div class={['vicher-chat-row', { 'is-active': item.index === current, 'is-confirming': confirming === chat.id }]} role="option" aria-selected={item.index === current} out:fold|global={{ animate: folding }}>
        {#if confirming === chat.id}
          <div class="vicher-chat-confirm-text">Delete “{title}”?</div>
          <div class="vicher-chat-confirm">
            <button type="button" class="mod-warning" disabled={deleting === chat.id} onclick={() => void remove(chat.id)}>Delete</button>
            <button type="button" disabled={deleting === chat.id} onclick={() => (confirming = null)}>Cancel</button>
          </div>
        {:else}
          <button type="button" class="vicher-chat-open" onclick={() => host.open(chat.id)}>
            <svg {@attach agentIcon(chat.agent)}></svg>
            <div class="vicher-chat-text">
              <div class="vicher-chat-title">{title}</div>
              {#if chat.snippet}<div class="vicher-chat-snippet">{chat.snippet}</div>{/if}
            </div>
            <span class="vicher-chat-when">{formatWhen(chat.updatedAt, item.now)}</span>
          </button>
          <button type="button" class="clickable-icon vicher-chat-delete" aria-label="Delete chat" onclick={() => (confirming = chat.id)} {@attach icon('trash-2')}></button>
        {/if}
      </div>
    {/if}
  {/each}
</div>
<div class="prompt-instructions">
  {#each INSTRUCTIONS as [command, purpose] (command)}
    <div class="prompt-instruction"><span class="prompt-instruction-command">{command}</span><span>{purpose}</span></div>
  {/each}
</div>

<style>
  .vicher-chat-list {
    min-height: 0;
  }

  .vicher-chat-group {
    padding: 10px 8px 4px;
    color: var(--text-muted);
    font-size: var(--font-ui-smaller);
    font-weight: var(--font-semibold);
  }

  .vicher-chat-empty {
    padding: 12px 8px;
    color: var(--text-faint);
  }

  .vicher-chat-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 4px;
    border-radius: 8px;
    corner-shape: round;
  }

  .vicher-chat-row:is(:hover, .is-active, :focus-within) {
    background: var(--background-modifier-hover);
  }

  /* Obsidian's button look is reset for the row. */
  .vicher-chat-open {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    min-width: 0;
    height: auto;
    padding: 6px 14px 6px 8px;
    border: none;
    background: transparent;
    box-shadow: none;
    color: var(--text-normal);
    font-size: inherit;
    text-align: start;
  }

  .vicher-chat-text {
    flex: 1;
    min-width: 0;
  }

  .vicher-chat-title,
  .vicher-chat-confirm-text {
    line-height: 20px;
  }

  .vicher-chat-title,
  .vicher-chat-snippet {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vicher-chat-snippet {
    color: var(--text-muted);
    font-size: var(--font-ui-smaller);
  }

  .vicher-chat-when {
    flex: none;
    width: 56px;
    color: var(--text-faint);
    font-size: var(--font-ui-smaller);
    text-align: right;
    transition: opacity 120ms ease;
  }

  .vicher-chat-delete {
    position: absolute;
    top: 50%;
    right: 12px;
    transform: translateY(-50%) scale(0.8);
    opacity: 0;
    color: var(--text-muted);
    transition:
      opacity 120ms ease,
      transform 160ms var(--vicher-ease-out);
  }

  .vicher-chat-row:is(:hover, :has(.vicher-chat-delete:focus-visible)) .vicher-chat-when {
    opacity: 0;
  }

  .vicher-chat-row:is(:hover, :has(.vicher-chat-delete:focus-visible)) .vicher-chat-delete {
    transform: translateY(-50%);
    opacity: 1;
  }

  .vicher-chat-delete:hover {
    color: var(--text-error);
  }

  .vicher-chat-row.is-confirming {
    background: color-mix(in srgb, var(--text-error) 10%, transparent);
    animation: vicher-confirm-bg 160ms ease-out;
  }

  .is-confirming :is(.vicher-chat-confirm-text, .vicher-chat-confirm) {
    animation: vicher-confirm-in 180ms var(--vicher-ease-out);
  }

  @keyframes vicher-confirm-bg {
    from {
      background-color: transparent;
    }
  }

  @keyframes vicher-confirm-in {
    from {
      opacity: 0;
      transform: translateX(6px);
    }
  }

  .vicher-chat-confirm-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    padding: 6px 8px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vicher-chat-confirm {
    display: flex;
    flex: none;
    gap: 4px;
    padding-right: 10px;
  }

  .vicher-chat-confirm button {
    height: auto;
    padding: 3px 10px;
    font-size: var(--font-ui-smaller);
  }

  @media (prefers-reduced-motion: reduce) {
    .vicher-chat-row.is-confirming,
    .is-confirming :is(.vicher-chat-confirm-text, .vicher-chat-confirm) {
      animation-duration: 1ms;
    }

    .vicher-chat-delete,
    .vicher-chat-when {
      transition-duration: 1ms;
    }
  }
</style>
