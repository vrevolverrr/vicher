<script lang="ts">
  import { untrack } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import type { Param } from '@/renderer/figure/FigureData';
  import type { Markdown } from '@/renderer/figure/view/dom';
  import { formatFigure } from '@/renderer/figure/formatFigure';

  /** The controls for a figure's params; `label` draws a label's text and maths, and each change reports the param's new value. */
  interface Props {
    params: readonly Param[];
    values: ReadonlyMap<string, unknown>;
    label: Markdown;
    change: (key: string, value: unknown) => void;
  }

  const { params, values, label, change }: Props = $props();

  const current = new SvelteMap<string, unknown>(untrack(() => params.map((param) => [param.key, values.has(param.key) ? values.get(param.key) : param.value])));

  function set(key: string, value: unknown): void {
    current.set(key, value);
    change(key, value);
  }

  const write = (text: string) => (el: HTMLElement) => label(el, text);
  /** A range input snaps its value to its step, and the readout shows where it landed. */
  const snap = (key: string) => (input: HTMLInputElement) => void current.set(key, Number(input.value));
</script>

{#each params as param (param.key)}
  {#if param.kind === 'slider'}
    {@const value = Number(current.get(param.key))}
    <label class="vicher-slider">
      <span class="vicher-control-row"><span {@attach write(param.label)}></span><output>{formatFigure(value)}{param.unit ? ` ${param.unit}` : ''}</output></span>
      <input
        type="range"
        min={param.min}
        max={param.max}
        step={param.step}
        {value}
        style:--vicher-progress="{((value - param.min) / (param.max - param.min)) * 100}%"
        oninput={(event) => set(param.key, Number(event.currentTarget.value))}
        {@attach snap(param.key)}
      />
    </label>
  {:else if param.kind === 'choice'}
    <div class="vicher-choice">
      <span class="vicher-control-row" {@attach write(param.label)}></span>
      <div class="vicher-choice-options" role="group" aria-label={param.label}>
        {#each param.options as option (option)}
          <button type="button" class="vicher-choice-option" aria-pressed={option === current.get(param.key)} onclick={() => set(param.key, option)}>{formatFigure(option)}</button>
        {/each}
      </div>
    </div>
  {:else}
    <label class="vicher-text-input">
      <span class="vicher-control-row" {@attach write(param.label)}></span>
      <input type="text" spellcheck="false" autocomplete="off" value={String(current.get(param.key))} oninput={(event) => set(param.key, event.currentTarget.value)} />
    </label>
  {/if}
{/each}

<style>
  .vicher-control-row {
    color: var(--text-muted);
    font-size: var(--font-ui-small);
  }

  .vicher-slider,
  .vicher-text-input,
  .vicher-choice {
    display: flex;
    flex-direction: column;
    gap: var(--size-2-3);
  }

  .vicher-slider .vicher-control-row {
    display: flex;
    justify-content: space-between;
    gap: var(--size-4-2);
  }

  .vicher-slider output {
    color: var(--text-normal);
    font-weight: var(--font-semibold);
    font-variant-numeric: tabular-nums;
  }

  /* Obsidian draws the track on the input itself and lifts the thumb by --slider-thumb-y, so the slider sets those variables. */
  .vicher-slider input[type='range'] {
    --slider-thumb-width: 12px;
    --slider-thumb-height: 12px;
    --slider-thumb-width-active: 12px;
    --slider-thumb-height-active: 12px;
    --slider-thumb-radius: 50%;
    --slider-thumb-y: -4px;
    --slider-thumb-y-active: -4px;
    --slider-thumb-background: var(--interactive-accent);
    --slider-thumb-background-hover: var(--interactive-accent);
    --slider-thumb-border-width: 0px;
    --slider-thumb-shadow: 0 0 0 3px var(--background-primary);
    --slider-thumb-shadow-hover: 0 0 0 3px var(--background-primary);
    --slider-thumb-shadow-active: 0 0 0 3px var(--background-primary);
    width: 100%;
    height: 16px;
    margin: 0;
    background: linear-gradient(to right, var(--interactive-accent) var(--vicher-progress, 0%), var(--background-modifier-border) var(--vicher-progress, 0%)) center / 100% 4px no-repeat;
    border-radius: 2px;
  }

  .vicher-slider input[type='range']::-webkit-slider-runnable-track {
    height: 4px;
    background: none;
  }

  .vicher-text-input input[type='text'] {
    width: 100%;
    height: auto;
    padding: var(--size-4-2) var(--size-4-3);
    font-size: var(--font-ui-medium);
  }

  .vicher-choice-options {
    display: flex;
    flex-wrap: wrap;
    align-self: flex-start;
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m);
    overflow: hidden;
  }

  /* Doubled up so Obsidian's own button styles (background, shadow, height) do not win. */
  .vicher-choice .vicher-choice-option {
    height: auto;
    padding: var(--size-4-2) var(--size-4-4);
    border: 0;
    border-radius: 0;
    background: var(--background-primary);
    box-shadow: none;
    color: var(--text-muted);
    font-size: var(--font-ui-medium);
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  .vicher-choice .vicher-choice-option + .vicher-choice-option {
    border-left: 1px solid var(--background-modifier-border);
  }

  .vicher-choice .vicher-choice-option:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .vicher-choice .vicher-choice-option:active {
    background: var(--background-modifier-active-hover);
  }

  /* The weight stays the same when picked, so the segments do not change width and shift their neighbours. */
  .vicher-choice .vicher-choice-option[aria-pressed='true'] {
    background: color-mix(in srgb, var(--interactive-accent) 16%, var(--background-primary));
    color: var(--text-accent);
  }

  .vicher-choice .vicher-choice-option:focus-visible {
    outline: var(--vicher-focus-ring);
    outline-offset: -2px;
  }

  /* Obsidian gives the thumb its own `cursor: default`, so the input's cursor never shows over it. */
  .vicher-slider input[type='range'],
  .vicher-slider input[type='range']::-webkit-slider-thumb,
  .vicher-slider input[type='range']::-webkit-slider-runnable-track {
    cursor: pointer;
  }
</style>
