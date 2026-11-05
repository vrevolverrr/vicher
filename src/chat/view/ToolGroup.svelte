<script lang="ts" module>
  import { SvelteMap } from 'svelte/reactivity';

  const PHRASE_MS = 4000;

  const WORKING_PHRASES = [
    'Following the thread',
    'Reading your note',
    'Tracing the backlinks',
    'Checking the margins',
    'Leafing through the vault',
    'Untangling the knot',
    'Gathering the threads',
    'Sketching it out',
    'Cross-referencing',
    'Working through it',
  ];

  const NAMED_KINDS = 3;

  /** "1 Bash, 2 Reads, and 3 other": the most-used kinds by name, the rest as one count. */
  function countByName(names: string[]): string {
    const counts = new SvelteMap<string, number>();
    for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
    const kinds = [...counts].sort((a, b) => b[1] - a[1]);
    const named = kinds.length > NAMED_KINDS ? kinds.slice(0, NAMED_KINDS - 1) : kinds;
    const parts = named.map(([name, count]) => `${count} ${count === 1 || /[shx]$/.test(name) ? name : `${name}s`}`);
    const other = kinds.slice(named.length).reduce((sum, [, count]) => sum + count, 0);
    if (other) parts.push(`${other} other`);
    return parts.length < 3 ? parts.join(' and ') : `${parts.slice(0, -1).join(', ')}, and ${parts.at(-1)}`;
  }
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import type { ToolPart } from '@/chat/ChatRecord';
  import { formatElapsed } from '@/chat/view/formatElapsed';
  import { icon } from '@/shared/view/icon';

  /**
   * A run of tool calls with no text between them: one summary line that expands to a row per call. With no calls it
   * is a working line. It is active while a call runs; the owner sets `holding` to keep it active after every call
   * has ended, when the next may follow at once, and `finished` when the turn is over.
   */
  interface Props {
    rows: readonly ToolPart[];
    holding?: boolean;
    finished?: boolean;
    /** Eases in once, not again when its tab is shown. */
    entering?: boolean;
    /** When the group began, for its time and its working phrase. */
    startedAt: number;
  }

  const { rows, holding = false, finished = false, entering: enter = false, startedAt }: Props = $props();

  let entering = $state(untrack(() => enter));
  let open = $state(false);
  let now = $state(Date.now());
  let settledAt = $state<number | null>(null);
  const phraseOffset = Math.floor(Math.random() * WORKING_PHRASES.length);

  const empty = $derived(rows.length === 0);
  const running = $derived(rows.filter((row) => row.status === 'running'));
  const active = $derived(!finished && (empty || running.length > 0 || holding));
  /** Whole seconds the group has been active, held once it settles. */
  const seconds = $derived(Math.floor(((settledAt ?? now) - startedAt) / 1000));
  const elapsed = $derived(seconds < 1 || (empty && !active) ? '' : formatElapsed(seconds));

  const summary = $derived.by(() => {
    if (empty) {
      return active
        ? WORKING_PHRASES[(phraseOffset + Math.floor((now - startedAt) / PHRASE_MS)) % WORKING_PHRASES.length]
        : `Thought for ${formatElapsed(seconds)}`;
    }
    if (active) {
      const using = running.length ? running : rows.slice(-1);
      return `Using ${[...new Set(using.map((row) => row.name))].join(', ')}`;
    }
    const failed = rows.filter((row) => row.status === 'failed').length;
    return `Used ${countByName(rows.map((row) => row.name))}${failed ? ` (${failed} failed)` : ''}`;
  });

  $effect.pre(() => {
    if (active) settledAt = null;
    else untrack(() => (settledAt ??= Date.now()));
  });

  $effect(() => {
    if (!active) return;
    now = Date.now();
    const ticker = window.setInterval(() => (now = Date.now()), 1000);
    return () => window.clearInterval(ticker);
  });
</script>

<div
  class={['vicher-tools', { 'is-running': active, 'is-empty': empty, 'is-open': open, 'is-entering': entering }]}
  onanimationend={() => (entering = false)}
>
  <button class="vicher-tools-header" aria-expanded={open} onclick={() => { if (!empty) open = !open; }}>
    <span class="vicher-tools-orb" aria-hidden="true"></span>
    <span class="vicher-tools-summary">{summary}</span>
    <span class="vicher-tools-time">{elapsed}</span>
    <span class="vicher-tools-chevron" {@attach icon('chevron-right')}></span>
  </button>
  <!-- The list's wrapper animates its height between none and all of it. -->
  <div class="vicher-tools-drawer">
    <div class="vicher-tools-list" inert={!open}>
      {#each rows as row (row.id)}
        <div class="vicher-tool" data-status={row.status}>{row.title}</div>
      {/each}
    </div>
  </div>
</div>

<style>
  .vicher-tools {
    color: var(--text-muted);
    font-size: var(--font-ui-small);
  }

  :global(.vicher-reply) > .vicher-tools:first-child {
    margin-top: var(--size-4-2);
  }

  /* The header is a full line tall, so the reply's gap after it reads wider than the gap between text blocks. */
  .vicher-tools + :global(.vicher-reply-text) {
    margin-top: calc(var(--size-4-1) * -1);
  }

  .vicher-tools.is-entering {
    animation: vicher-tools-enter 260ms cubic-bezier(0.2, 0, 0, 1) backwards;
  }

  /* The working line that opens with a send follows the bubble rather than arriving with it. */
  :global(.vicher-turn.is-waiting) .vicher-tools.is-entering {
    animation-delay: 120ms;
  }

  @keyframes vicher-tools-enter {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .vicher-tools.is-entering {
      animation: none;
    }
  }

  /* As tall as a line of reply text, so a line that replaces another lands in the same spot. */
  .vicher-tools .vicher-tools-header {
    display: flex;
    align-items: center;
    gap: var(--size-2-2);
    max-width: 100%;
    height: auto;
    min-height: calc(var(--font-ui-medium) * var(--vicher-reply-line-height));
    padding: 0;
    border: none;
    background: transparent;
    box-shadow: none;
    color: inherit;
    transition: color 240ms cubic-bezier(0.4, 0, 0.2, 1);
    font-size: inherit;
    text-align: left;
    cursor: pointer;
  }

  .vicher-tools .vicher-tools-header:hover {
    background: transparent;
  }

  .vicher-tools:not(.is-empty) .vicher-tools-header:hover {
    color: var(--text-normal);
  }

  .vicher-tools:not(.is-running) {
    color: var(--text-faint);
  }

  .vicher-tools.is-empty .vicher-tools-header {
    cursor: default;
  }

  .vicher-tools-summary,
  .vicher-tool {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vicher-tools-summary {
    font-weight: var(--font-medium);
  }

  .vicher-tools-time {
    flex-shrink: 0;
    color: var(--text-faint);
    transition: color 240ms cubic-bezier(0.4, 0, 0.2, 1);
    font-variant-numeric: tabular-nums;
  }

  .vicher-tools:not(.is-empty) .vicher-tools-header:hover .vicher-tools-time {
    color: inherit;
  }

  .vicher-tools-time:empty {
    display: none;
  }

  .vicher-tools-chevron {
    display: inline-flex;
    flex-shrink: 0;
    transition: transform 220ms cubic-bezier(0.2, 0, 0, 1);
  }

  .vicher-tools.is-empty .vicher-tools-chevron {
    display: none;
  }

  .vicher-tools-chevron :global(.svg-icon) {
    width: 14px;
    height: 14px;
  }

  .vicher-tools.is-open .vicher-tools-chevron {
    transform: rotate(90deg);
  }

  .vicher-tools-drawer {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 220ms cubic-bezier(0.2, 0, 0, 1);
  }

  .vicher-tools.is-open .vicher-tools-drawer {
    grid-template-rows: 1fr;
  }

  /* The space above the rows is the first row's margin, inside the clip: padding or a margin on the list itself would keep
     the closed drawer from reaching zero height. */
  .vicher-tools-list {
    display: flex;
    flex-direction: column;
    gap: var(--size-2-2);
    min-height: 0;
    padding-left: var(--size-4-3);
    overflow: hidden;
    border-left: 1px solid var(--background-modifier-border);
    opacity: 0;
    transition: opacity 120ms ease-out;
  }

  .vicher-tools-list > :first-child {
    margin-top: var(--size-2-3);
  }

  .vicher-tools.is-open .vicher-tools-list {
    opacity: 1;
    transition: opacity 180ms ease-out 60ms;
  }

  .vicher-tool[data-status='failed'] {
    color: var(--text-error);
  }
</style>
