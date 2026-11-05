<script lang="ts" module>
  const PLAY = 'M5 3.5v9l7.5-4.5z';
  const PAUSE = 'M4.5 3.5h2v9h-2zM9.5 3.5h2v9h-2z';
</script>

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { formatFigure } from '@/renderer/figure/formatFigure';

  /** Back, Play, Next, a scrubber and a count, with the timer that Play runs. Shared by Player and figures with local snapshot state. */
  interface Props {
    /** `forward` is true when Next or the timer advanced one step, the only moves a figure animates. */
    change: (value: number, forward: boolean) => void;
  }

  const { change }: Props = $props();

  let max = $state(0);
  let current = $state(0);
  let step = $state(1);
  let offset = $state(0);
  let playing = $state(false);
  let compact = $state(false);
  let interval = 800;
  let timer: number | null = null;

  const total = $derived(formatFigure(max + offset));

  /** Non-finite or non-positive `ms` and `step` fall back to 800 and 1. `offset` shifts only the displayed count. */
  export function update(newMax: number, newCurrent: number, options: { ms?: number; step?: number; offset?: number } = {}): void {
    const { ms = NaN, step: newStep = NaN, offset: newOffset = 0 } = options;
    max = Math.max(0, Number.isFinite(newMax) ? newMax : 0);
    current = newCurrent;
    interval = Number.isFinite(ms) && ms > 0 ? ms : 800;
    step = Number.isFinite(newStep) && newStep > 0 ? newStep : 1;
    offset = newOffset;
    if (max === 0) stop();
  }

  /** Only Play shows, drawn as a dot in the step list's column. */
  export function playOnly(on: boolean): void {
    compact = on;
  }

  export function stop(): void {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    playing = false;
  }

  function move(to: number, forward: boolean): void {
    current = Math.min(max, Math.max(0, to));
    change(current, forward);
  }

  function toggle(): void {
    if (timer !== null) return stop();
    if (max === 0) return;
    if (current >= max) move(0, false);
    playing = true;
    timer = window.setInterval(() => {
      move(current + step, true);
      if (current >= max) stop();
    }, interval);
  }

  onDestroy(() => {
    if (timer !== null) window.clearInterval(timer);
  });
</script>

<div class={['vicher-player', { 'is-play-only': compact }]}>
  <button class="vicher-player-button is-back" type="button" title="Back" aria-label="Back" disabled={current <= 0} onclick={() => { stop(); move(current - step, false); }}>
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5.5 8l4.5 4.5" fill="none" /></svg>
  </button>
  <button class="vicher-player-button is-play" type="button" title={playing ? 'Pause' : 'Play'} aria-label={playing ? 'Pause' : 'Play'} disabled={max === 0} onclick={toggle}>
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d={playing ? PAUSE : PLAY} fill="currentColor" /></svg>
  </button>
  <button class="vicher-player-button is-next" type="button" title="Next" aria-label="Next" disabled={current >= max} onclick={() => { stop(); move(current + step, true); }}>
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5" fill="none" /></svg>
  </button>
  <!-- A button already takes Space; on the scrubber it would otherwise do nothing. -->
  <input
    type="range"
    min="0"
    {max}
    {step}
    aria-label="Position"
    disabled={max === 0}
    style:--vicher-progress="{max ? (current / max) * 100 : 0}%"
    oninput={(event) => { stop(); move(Number(event.currentTarget.value), false); }}
    onkeydown={(event) => {
      if (event.key !== ' ') return;
      event.preventDefault();
      toggle();
    }}
    value={current}
  />
  <output class="vicher-player-count" style:min-width="{2 * total.length + 3}ch">{formatFigure(current + offset)} / {total}</output>
</div>

<style>
  .vicher-player {
    display: flex;
    align-items: center;
    gap: var(--size-2-1);
  }

  /* Doubled up so Obsidian's own button styles (background, shadow, height) do not win. */
  .vicher-player .vicher-player-button {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    box-shadow: none;
    color: var(--text-normal);
    cursor: pointer;
    transition: background-color 0.15s ease, transform 0.1s ease;
  }

  .vicher-player .vicher-player-button:active {
    transform: scale(0.92);
  }

  .vicher-player .vicher-player-button:hover {
    background: var(--background-modifier-hover);
  }

  .vicher-player .vicher-player-button:focus-visible,
  .vicher-player input[type='range']:focus-visible {
    outline: var(--vicher-focus-ring);
    outline-offset: 1px;
  }

  .vicher-player .vicher-player-button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .vicher-player .vicher-player-button svg {
    width: 16px;
    height: 16px;
    stroke: currentColor;
    stroke-width: 1.75;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* Obsidian draws the track on the input itself and lifts the thumb by --slider-thumb-y, so the bar changes those variables. */
  .vicher-player input[type='range'] {
    --slider-thumb-width: 12px;
    --slider-thumb-height: 12px;
    --slider-thumb-width-active: 12px;
    --slider-thumb-height-active: 12px;
    --slider-thumb-y: 1px;
    --slider-thumb-y-active: 1px;
    --slider-thumb-background: var(--interactive-accent);
    --slider-thumb-background-hover: var(--interactive-accent);
    --slider-thumb-border-width: 0px;
    --slider-thumb-shadow: none;
    --slider-thumb-shadow-hover: none;
    --slider-thumb-shadow-active: none;
    flex: 1;
    min-width: 80px;
    height: 14px;
    margin: 0 var(--size-2-3);
    background: linear-gradient(to right, var(--interactive-accent) var(--vicher-progress, 0%), var(--background-modifier-border-hover) var(--vicher-progress, 0%)) center / 100% 2px no-repeat;
    border-radius: 0;
  }

  .vicher-player input[type='range']::-webkit-slider-runnable-track {
    height: 14px;
  }

  .vicher-player-count {
    text-align: right;
    color: var(--text-muted);
    font-size: var(--font-ui-smaller);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  /* The full player is its own card, like the figure's, so its controls and track read as one object. */
  .vicher-player:not(.is-play-only) {
    width: min(100%, 32em);
    padding: var(--size-4-1) var(--size-4-3) var(--size-4-1) var(--size-4-1);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-l);
    background: var(--background-primary);
  }

  .vicher-player.is-play-only :is(input[type='range'], .vicher-player-count, .is-back, .is-next) {
    display: none;
  }

  /* Play sits in the stepper's column, drawn like one of its dots. */
  .vicher-player.is-play-only .vicher-player-button {
    width: 24px;
    height: 24px;
    min-height: 0;
    border-radius: 50%;
    border: 1px solid var(--background-modifier-border-hover);
    color: var(--text-muted);
  }

  .vicher-player.is-play-only .vicher-player-button:hover {
    border-color: var(--interactive-accent);
    background: none;
    color: var(--text-accent);
  }

  .vicher-player.is-play-only .vicher-player-button svg {
    width: 12px;
    height: 12px;
  }

  /* Obsidian gives the thumb its own `cursor: default`, so the input's cursor never shows over it. */
  .vicher-player input[type='range'],
  .vicher-player input[type='range']::-webkit-slider-thumb,
  .vicher-player input[type='range']::-webkit-slider-runnable-track {
    cursor: pointer;
  }
</style>
