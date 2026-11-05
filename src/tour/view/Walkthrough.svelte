<script lang="ts" module>
  const SNIPPET_WORDS = 8;
  const MISSED = 'The text was not found, so the note may have changed.';

  /** The start of a quote, for a stop that has no comment of its own. */
  function snippet(quote: string): string {
    const words = quote.trim().split(/\s+/);
    return words.length > SNIPPET_WORDS ? `${words.slice(0, SNIPPET_WORDS).join(' ')}…` : words.join(' ');
  }

  function noteName(path: string): string {
    return path.split('/').pop()!.replace(/\.md$/, '');
  }
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import type { TourStep } from '@/chat/ChatRecord';
  import type { WalkthroughHost } from '@/tour/view/WalkthroughHost';

  /**
   * A run of the stops an agent pointed at, drawn in the reply where it wrote them. One list of stops belongs to the
   * whole reply and a run shows its own part of it, `count` stops from `start`, so a stop's number and what a click
   * plays are the reply's, not the run's. As the tour plays, the stop on screen is marked, the ones before it count as
   * done, and a click on any stop plays from there.
   */
  interface Props {
    /** Every stop of the reply; `count` grows as the agent points at more. */
    steps: readonly TourStep[];
    /** The number of stops in the reply; a lone stop is drawn without a number. */
    total: number;
    start: number;
    count: number;
    host: WalkthroughHost;
  }

  const { steps, total, start, count, host }: Props = $props();

  const numbered = $derived(total > 1);
  const indices = $derived(Array.from({ length: count }, (_, i) => start + i));
  /** The stop on screen, or -1. */
  let current = $state(-1);
  /** The stops before this one count as done; the mark stays when the tour rests. */
  let done = $state(0);
  let missed = $state<number[]>([]);

  untrack(() =>
    host.watch((event) => {
      current = -1;
      if (!event) return;
      const at = steps.indexOf(event.step);
      if (event.state === 'playing') current = at;
      done = at;
      const others = missed.filter((index) => index !== at);
      missed = event.state === 'missed' ? [...others, at] : others;
    }),
  );
</script>

<div class="vicher-walkthrough">
  {#each indices as index (index)}
    {@const step = steps[index]}
    <button
      class={[{ 'vicher-step': numbered }, 'vicher-walk-step', { 'is-current': current === index, 'is-done': index < done, 'is-missed': missed.includes(index) }]}
      type="button"
      aria-label={numbered ? `Show stop ${index + 1}` : 'Show the highlight'}
      title={missed.includes(index) ? MISSED : undefined}
      onclick={() => host.pick(steps, index)}
    >{#if numbered}<span class="vicher-step-dot">{index + 1}</span>{/if}<span class="vicher-walk-body"><span class="vicher-walk-comment">{step.comment ?? snippet(step.quote)}</span>{#if step.comment}<span class="vicher-walk-quote">{snippet(step.quote)}</span>{/if}{#if step.path !== steps[0].path}<span class="vicher-walk-note">{noteName(step.path)}</span>{/if}</span></button>
  {/each}
</div>

<style>
  /* The tour's stepper keeps the tour's purple, and its dots sit inside each row's padding. */
  .vicher-walkthrough {
    --vicher-accent: var(--color-purple, #8b5cf6);
    --vicher-step-accent: var(--vicher-accent);
    --vicher-step-accent-text: var(--vicher-accent);
    --vicher-step-done: color-mix(in srgb, var(--vicher-step-accent) 50%, var(--background-primary));
    --vicher-step-x: 8px;
    --vicher-step-y: 7px;
    display: flex;
    flex-direction: column;
    margin: 8px 0;
    padding: 4px;
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m);
    background: var(--background-secondary);
  }

  /* Doubled up so Obsidian's own button styles (background, shadow, height) do not win. */
  .vicher-walkthrough .vicher-walk-step {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    width: 100%;
    height: auto;
    padding: 7px 10px 7px 8px;
    border: 0;
    border-radius: calc(var(--radius-m) - 2px);
    background: transparent;
    box-shadow: none;
    color: var(--text-normal);
    text-align: left;
    cursor: pointer;
    transition: background-color 120ms ease;
  }

  .vicher-walkthrough .vicher-walk-step:hover,
  .vicher-walkthrough .vicher-walk-step:focus-visible {
    background: var(--background-modifier-hover);
  }

  .vicher-walkthrough .vicher-walk-step:focus-visible {
    outline: 2px solid var(--vicher-accent);
    outline-offset: -2px;
  }

  /* A play mark on hover says a click starts the tour here. */
  .vicher-walkthrough .vicher-walk-step::after {
    content: '';
    align-self: center;
    flex: none;
    width: 0;
    height: 0;
    margin-left: auto;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 8px solid var(--vicher-accent);
    opacity: 0;
    transition: opacity 120ms ease;
  }

  .vicher-walkthrough .vicher-walk-step:hover::after,
  .vicher-walkthrough .vicher-walk-step:focus-visible::after {
    opacity: 0.9;
  }

  .vicher-walk-body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
    padding-top: 2px;
  }

  .vicher-walk-comment {
    font-size: var(--font-ui-small);
    line-height: 1.4;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .vicher-walk-quote {
    overflow: hidden;
    color: var(--text-muted);
    font-size: var(--font-ui-smaller);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vicher-walk-quote::before {
    content: '\201C';
  }

  .vicher-walk-quote::after {
    content: '\201D';
  }

  .vicher-walk-note {
    align-self: flex-start;
    margin-top: 3px;
    padding: 0 7px;
    border-radius: 999px;
    background: var(--background-modifier-border);
    color: var(--text-muted);
    font-size: var(--font-ui-smaller);
  }

  .vicher-walkthrough .vicher-walk-step.is-current {
    background: color-mix(in srgb, var(--vicher-accent) 13%, transparent);
  }

  .vicher-walkthrough .vicher-walk-step.is-missed {
    opacity: 0.55;
  }

  .vicher-walkthrough .vicher-walk-step.is-missed .vicher-step-dot {
    border-style: dashed;
  }

  @media (prefers-reduced-motion: reduce) {
    .vicher-walkthrough .vicher-walk-step,
    .vicher-walkthrough .vicher-walk-step::after {
      transition: none;
    }
  }
</style>
