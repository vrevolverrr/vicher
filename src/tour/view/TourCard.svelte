<script lang="ts" module>
  /** Plays the CSS animation `cls` carries from its start again. */
  function restart(el: HTMLElement, cls: string): void {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }
</script>

<script lang="ts">
  import { flushSync } from 'svelte';

  /**
   * The comment card of the tour. The overlay places it each frame and measures it, so its element is handed out;
   * `hold` runs when the pointer or focus enters the card (true) and leaves it (false).
   */
  interface Props {
    hold: (held: boolean) => void;
  }

  const { hold }: Props = $props();

  let text = $state('');
  let card: HTMLElement;
  let bar: HTMLElement;

  export const element = (): HTMLElement => card;

  /** The overlay measures the card right after, so the text is in the DOM when this returns. */
  export function setComment(comment?: string): void {
    text = comment ?? '';
    flushSync();
  }

  export function restartIn(): void {
    restart(card, 'is-in');
  }

  /** Drains the line on the card's bottom edge over `ms`; it freezes while the pointer is on the card. */
  export function setTiming(ms: number): void {
    bar.style.setProperty('--vicher-tour-ms', `${ms}ms`);
    restart(bar, 'is-timing');
  }
</script>

<!-- A screen reader reads each comment as it appears. `class:` toggles one class, so the `is-in` the overlay adds survives. -->
<div
  bind:this={card}
  class="vicher-tour-card"
  class:is-empty={!text}
  role="status"
  aria-live="polite"
  onmouseenter={() => hold(true)}
  onmouseleave={() => hold(false)}
  onfocusin={() => hold(true)}
  onfocusout={() => hold(false)}
>
  <div class="vicher-tour-text">{text}</div>
  <div bind:this={bar} class="vicher-tour-bar"></div>
</div>

<style>
  .vicher-tour-card {
    max-width: 300px;
    padding: 8px 12px;
    overflow: hidden;
    pointer-events: auto;
    border: 1px solid var(--vicher-accent);
    border-radius: var(--radius-m);
    background: var(--background-secondary);
    color: var(--text-normal);
    font-size: var(--font-ui-medium);
    line-height: 1.4;
    box-shadow: 0 4px 14px rgb(0 0 0 / 0.35);
  }

  .vicher-tour-card.is-empty {
    display: none;
  }

  .vicher-tour-bar {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 2px;
    background: color-mix(in srgb, var(--vicher-accent) 30%, transparent);
    transform-origin: left;
  }

  .vicher-tour-bar:global(.is-timing) {
    animation: vicher-tour-drain var(--vicher-tour-ms) linear forwards;
  }

  .vicher-tour-card:hover .vicher-tour-bar,
  .vicher-tour-card:focus-within .vicher-tour-bar {
    animation-play-state: paused;
  }

  @keyframes vicher-tour-drain {
    to {
      transform: scaleX(0);
    }
  }

  .vicher-tour-card:global(.is-in) {
    animation: vicher-tour-card-in 220ms ease-out;
  }

  @keyframes vicher-tour-card-in {
    from {
      opacity: 0;
      margin-top: 4px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .vicher-tour-card:global(.is-in) {
      animation: none;
    }

    .vicher-tour-bar {
      display: none;
    }
  }
</style>
