<script module lang="ts">
  import { quintOut } from 'svelte/easing';
  import { ms } from '@/shared/view/motion';

  /** Each numbered button takes this width plus the gap after it; the trailing + takes the width alone. */
  const WIDTH = 28;
  const GAP = 4;

  /** Grows a tab and its gap from nothing, or folds them back, so the tabs beside it slide into place. */
  function squeeze(_node: Element, { duration }: { duration: number }) {
    return {
      duration: ms(duration),
      easing: quintOut,
      css: (t: number, u: number) => `overflow: hidden; width: ${t * WIDTH}px; margin-inline-end: ${t * GAP}px; opacity: ${t}; transform: scale(${1 - u * 0.15})`,
    };
  }
</script>

<script lang="ts">
  import { flushSync } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { type ChatTab, type ChatTabsHost, chatTabStatus } from '@/chat/view/ChatTab';

  /**
   * Numbered navigation over the open chats; the history menu lists the same tabs by name. Tabs that do not fit the
   * bar hide, except the selected one, which takes the last visible place.
   */
  interface Props {
    host: ChatTabsHost;
  }

  const { host }: Props = $props();

  let tabs = $state<readonly ChatTab[]>([]);
  let selected = $state<string>();
  let animate = $state(false);
  let width = $state(0);
  const leaving = new SvelteSet<Element>();
  let root: HTMLElement;

  const visible = $derived.by(() => {
    const capacity = width ? Math.max(1, Math.floor((width - WIDTH) / (WIDTH + GAP)) - leaving.size) : tabs.length;
    const ids = tabs.slice(0, capacity).map((tab) => tab.id);
    if (selected && !ids.includes(selected)) ids[ids.length - 1] = selected;
    return ids;
  });

  const tabId = (id: string) => `vicher-tab-${id}`;

  export function set(next: readonly ChatTab[], id: string | undefined): void {
    const active = root.ownerDocument.activeElement;
    const lostFocus = tabs.some((tab) => active?.id === tabId(tab.id) && !next.some((kept) => kept.id === tab.id));
    // The tabs already open when the view opens appear at once.
    animate = selected !== undefined;
    tabs = next;
    selected = id;
    // The caller is imperative and reads the bar right after.
    flushSync();
    if (lostFocus && id) root.ownerDocument.getElementById(tabId(id))?.focus();
  }

  const fit = (bar: HTMLElement) => {
    const observer = new ResizeObserver(() => (width = bar.clientWidth));
    observer.observe(bar);
    width = bar.clientWidth;
    return () => observer.disconnect();
  };

  function keys(event: KeyboardEvent, id: string): void {
    if (event.key === 'Delete') {
      event.preventDefault();
      host.close(id);
      return;
    }
    const shown = tabs.filter((tab) => visible.includes(tab.id));
    const at = shown.findIndex((tab) => tab.id === id);
    const next = { ArrowRight: shown[(at + 1) % shown.length], ArrowLeft: shown.at(at - 1), Home: shown[0], End: shown.at(-1) }[event.key];
    if (!next) return;
    event.preventDefault();
    root.ownerDocument.getElementById(tabId(next.id))?.focus();
    host.select(next.id);
  }

  /** The title is fixed so it can overflow the bar; it stays inside the pane's header. */
  function placeTitle(button: HTMLElement): void {
    const title = button.querySelector<HTMLElement>('.vicher-chat-tab-title')!;
    const header = root.parentElement!.getBoundingClientRect();
    const anchor = button.getBoundingClientRect();
    title.style.maxWidth = `${Math.min(280, header.width)}px`;
    title.style.left = `${Math.max(header.left, Math.min(anchor.left, header.right - title.offsetWidth))}px`;
    title.style.top = `${anchor.bottom + 4}px`;
  }
</script>

<div class="vicher-chat-tabs" bind:this={root} {@attach (el) => fit(el.parentElement as HTMLElement)}>
  <div class="vicher-chat-tab-list" role="tablist" aria-label="Open chats">
    {#each tabs as tab, index (tab.id)}
      {@const title = tab.title || 'New chat'}
      {@const status = chatTabStatus(tab)}
      <button
        type="button"
        role="tab"
        id={tabId(tab.id)}
        class={['vicher-chat-tab', { 'is-running': tab.running, 'is-unread': tab.unread, 'is-failed': tab.failed, 'needs-approval': tab.waitingForApproval }]}
        aria-controls="vicher-panel-{tab.id}"
        aria-selected={tab.id === selected}
        aria-label="{index + 1}: {title}{status ? `, ${status}` : ''}"
        tabindex={tab.id === selected ? 0 : -1}
        hidden={!visible.includes(tab.id)}
        onclick={() => host.select(tab.id)}
        onauxclick={(event) => {
          if (event.button !== 1) return;
          event.preventDefault();
          host.close(tab.id);
        }}
        oncontextmenu={(event) => {
          event.preventDefault();
          host.close(tab.id);
        }}
        onkeydown={(event) => keys(event, tab.id)}
        onpointerenter={(event) => placeTitle(event.currentTarget)}
        onfocus={(event) => placeTitle(event.currentTarget)}
        onintrostart={(event) => leaving.delete(event.currentTarget)}
        onoutrostart={(event) => {
          event.currentTarget.removeAttribute('role');
          event.currentTarget.setAttribute('aria-hidden', 'true');
          leaving.add(event.currentTarget);
        }}
        onoutroend={(event) => leaving.delete(event.currentTarget)}
        transition:squeeze={{ duration: animate ? 240 : 0 }}
      ><span class="vicher-chat-tab-number">{index + 1}</span><span class="vicher-chat-tab-status" aria-hidden="true"></span><span class="vicher-chat-tab-title" aria-hidden="true">{title}</span></button>
    {/each}
  </div>
  <button type="button" class="vicher-chat-tab vicher-chat-tab-add" aria-label="New tab" onclick={() => host.create()}>+</button>
</div>

<style>
  .vicher-chat-tabs {
    display: flex;
    min-width: 0;
    align-items: center;
  }

  .vicher-chat-tab-list {
    display: flex;
    flex: none;
  }

  .vicher-chat-tab[hidden] {
    display: none;
  }

  .vicher-chat-tabs .vicher-chat-tab {
    position: relative;
    flex: none;
    width: 28px;
    height: 26px;
    padding: 0;
    margin-inline-end: 4px;
    border: none;
    outline: 1px solid var(--background-modifier-border);
    outline-offset: -1px;
    border-radius: var(--radius-m);
    background: var(--background-primary);
    box-shadow: 0 1px 3px color-mix(in srgb, var(--text-normal) 8%, transparent);
    pointer-events: auto;
    color: var(--text-muted);
    font-size: var(--font-ui-small);
    font-variant-numeric: tabular-nums;
    transition:
      background-color 0.15s ease,
      color 0.15s ease,
      transform 0.1s ease;
  }

  .vicher-chat-tabs .vicher-chat-tab-add {
    margin-inline-end: 0;
  }

  .vicher-chat-tabs .vicher-chat-tab:is(:hover, :focus-visible) {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .vicher-chat-tabs .vicher-chat-tab:focus-visible {
    outline: var(--vicher-focus-ring);
    outline-offset: 2px;
  }

  .vicher-chat-tabs .vicher-chat-tab:active {
    transform: scale(0.94);
  }

  .vicher-chat-tabs .vicher-chat-tab[aria-selected='true'] {
    background: color-mix(in srgb, var(--interactive-accent) 16%, var(--background-primary));
    color: var(--text-accent);
    font-weight: var(--font-semibold);
  }

  .vicher-chat-tab-title {
    position: fixed;
    z-index: var(--layer-popover);
    width: max-content;
    max-width: min(280px, 65vw);
    padding: 6px 10px;
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m);
    background: var(--background-primary);
    box-shadow: var(--shadow-s);
    color: var(--text-normal);
    font-weight: normal;
    white-space: normal;
    overflow-wrap: anywhere;
    text-align: start;
    visibility: hidden;
    opacity: 0;
    transition:
      opacity 100ms ease,
      visibility 0s linear 100ms;
  }

  .vicher-chat-tab:is(:hover, :focus-visible) .vicher-chat-tab-title {
    visibility: visible;
    opacity: 1;
    transition-delay: 200ms;
  }

  .vicher-chat-tab-status {
    position: absolute;
    top: 4px;
    right: 3px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
  }

  .vicher-chat-tab.is-unread .vicher-chat-tab-status {
    background: var(--text-accent);
  }

  .vicher-chat-tab.is-failed .vicher-chat-tab-status {
    background: var(--text-error);
  }

  .vicher-chat-tab.is-running .vicher-chat-tab-status {
    width: 7px;
    height: 7px;
    border: 1px solid var(--text-faint);
    border-top-color: var(--text-accent);
    background: transparent;
    animation: vicher-spin 900ms linear infinite;
  }

  .vicher-chat-tab.is-running.needs-approval .vicher-chat-tab-status {
    background: var(--text-warning);
    animation: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .vicher-chat-tab.is-running .vicher-chat-tab-status {
      animation: none;
    }

    .vicher-chat-tab-title {
      transition: none;
    }

    .vicher-chat-tabs .vicher-chat-tab {
      transition: none;
    }

    .vicher-chat-tabs .vicher-chat-tab:active {
      transform: none;
    }
  }
</style>
