<script lang="ts">
  import type { Step } from '@/renderer/figure/FigureData';
  import type { Markdown } from '@/renderer/figure/view/dom';

  /**
   * Every step as a numbered vertical list: the current one marked and announced, any one picked by a click. `single` shows
   * only the current step, as a caption; the others stay in its grid cell, so the tallest keeps its height.
   */
  interface Props {
    steps: readonly Pick<Step, 'caption' | 'heading'>[];
    write: Markdown;
    pick: (index: number) => void;
  }

  const { steps, write, pick }: Props = $props();

  let root: HTMLElement;
  let current = $state(-1);
  let solo = $state(false);
  let live = $state('');

  export function single(on: boolean): void {
    solo = on;
  }

  export function show(index: number): void {
    current = index;
    const parts = root.querySelectorAll('.vicher-step')[index]?.querySelector('.vicher-step-text')?.children ?? [];
    live = Array.from(parts, (part) => part.textContent).join(': ');
  }
</script>

<div class={['vicher-steps', { 'is-single': solo }]} bind:this={root}>
  <!-- Divs, not an <ol>: Obsidian's list rules indent and space a list in rendered Markdown. -->
  <div class="vicher-steps-list" role="list">
    {#each steps as step, index (index)}
      {@const heading = step.heading}
      <div class={['vicher-step', { 'is-done': index < current, 'is-current': index === current }]} role="listitem" aria-current={index === current ? 'step' : undefined}>
        <!-- A caption is not a control: Tab skips it. -->
        <button class="vicher-step-button" type="button" tabindex={solo ? -1 : 0} onclick={() => pick(index)}>
          <span class="vicher-step-dot">{index + 1}</span>
          <div class="vicher-step-text">{#if heading}<div class="vicher-step-heading" {@attach (el) => write(el, heading)}></div>{/if}<div class="vicher-step-caption" {@attach (el) => write(el, step.caption)}></div></div>
        </button>
      </div>
    {/each}
  </div>
  <div class="vicher-visually-hidden" aria-live="polite">{live}</div>
</div>

<style>
  .vicher-steps {
    --vicher-step-accent: var(--interactive-accent);
    --vicher-step-accent-text: var(--text-accent);
    --vicher-step-done: color-mix(in srgb, var(--vicher-step-accent) 50%, var(--background-primary));
  }

  /* Doubled up so Obsidian's own button styles (background, shadow, height) do not win. */
  .vicher-steps .vicher-step-button {
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    gap: var(--size-4-3);
    width: 100%;
    height: auto;
    padding: 0 0 var(--size-4-5);
    border: 0;
    background: none;
    box-shadow: none;
    color: var(--text-faint);
    font: inherit;
    text-align: left;
    white-space: normal;
    cursor: pointer;
    transition: color 0.25s ease;
  }

  .vicher-step:last-child .vicher-step-button {
    padding-bottom: 0;
  }

  .vicher-steps .vicher-step-button:hover {
    color: var(--text-muted);
  }

  .vicher-step.is-current .vicher-step-button {
    color: var(--text-normal);
  }

  .vicher-steps .vicher-step-button:focus-visible {
    outline: none;
  }

  .vicher-steps .vicher-step-button:focus-visible .vicher-step-dot {
    outline: var(--vicher-focus-ring);
    outline-offset: 2px;
  }

  /* Lifted so the lowercase text, not its line box, centres on the dot. */
  .vicher-step-text {
    flex: 1;
    min-width: 0;
    margin-top: -1px;
    line-height: 24px;
    overflow-wrap: break-word;
  }

  /* Obsidian colours bold and italic text itself; here they follow the step's dimming. */
  :global(.vicher-figure) .vicher-step-text :global(:is(strong, b, em, i)) {
    color: inherit;
  }

  :is(.vicher-step-heading, .vicher-step-caption) > :global(*) {
    margin: 0;
  }

  /* With a heading, the caption is the detail under it: smaller, and muted while its step is current. */
  .vicher-step-heading {
    font-weight: var(--font-semibold);
  }

  .vicher-step-heading + .vicher-step-caption {
    margin-top: 2px;
    font-size: calc(var(--font-ui-medium) - 3px);
    line-height: 1.5;
  }

  .vicher-step.is-current .vicher-step-heading + .vicher-step-caption {
    color: var(--text-muted);
  }

  /* One caption at a time: every step in one grid cell, so the tallest keeps its height, and only the current one shows. */
  .vicher-steps.is-single > .vicher-steps-list {
    display: grid;
  }

  .vicher-steps.is-single .vicher-step {
    grid-area: 1 / 1;
    min-width: 0;
    visibility: hidden;
  }

  .vicher-steps.is-single .vicher-step.is-current {
    visibility: visible;
  }

  .vicher-steps.is-single .vicher-step::before {
    display: none;
  }

  /* A step shown here was hidden a moment ago, so it must not fade in from the dimmed colours of a step not yet reached. */
  .vicher-steps.is-single :is(.vicher-step-button, .vicher-step-dot) {
    transition: none;
  }

  .vicher-steps.is-single .vicher-step-button {
    padding-bottom: 0;
    pointer-events: none;
  }

  .vicher-steps.is-single .vicher-step:not(:only-child) > .vicher-step-button {
    justify-content: center;
  }

  .vicher-steps.is-single .vicher-step-text {
    flex: 0 1 auto;
  }

  /* A one-step figure has nothing to count. */
  .vicher-steps .vicher-step:only-child .vicher-step-dot {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .vicher-steps .vicher-step-button {
      transition: none;
    }
  }
</style>
