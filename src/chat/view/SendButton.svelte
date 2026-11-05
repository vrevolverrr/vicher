<script lang="ts">
  import { flushSync } from 'svelte';
  import { cubicIn, cubicOut } from 'svelte/easing';
  import { icon } from '@/shared/view/icon';
  import { pop } from '@/shared/view/motion';

  /** The composer's round button: Send, or Stop while a turn runs and there is nothing to send. */
  interface Props {
    onSend: () => void;
    onStop: () => void;
  }

  const { onSend, onStop }: Props = $props();

  let stops = $state(false);
  let disabled = $state(true);

  export function set(nextStops: boolean, nextDisabled: boolean): void {
    stops = nextStops;
    disabled = nextDisabled;
    // The composer is imperative and reads the button right after.
    flushSync();
  }
</script>

<button
  class={['vicher-send', { 'is-streaming': stops }]}
  aria-label={stops ? 'Stop' : 'Send'}
  {disabled}
  onclick={() => (stops ? onStop() : onSend())}
>
  {#key stops}
    <span
      class="vicher-send-icon"
      {@attach icon(stops ? 'square' : 'arrow-up')}
      in:pop={{ y: 0, scale: 0.5, duration: 180, easing: cubicOut }}
      out:pop={{ y: 0, scale: 0.5, duration: 120, easing: cubicIn }}
    ></span>
  {/key}
</button>

<style>
  /* The bar's own button rule is as specific as a scoped class alone; the bar in the selector outranks it, hover and press included. */
  :global(.vicher-composer-bar) .vicher-send {
    flex: none;
    width: 28px;
    height: 28px;
    display: grid;
    padding: 0;
    place-items: center;
    border-radius: 50%;
    corner-shape: round;
    background: var(--text-normal);
    color: var(--background-primary);
  }

  .vicher-send-icon {
    display: flex;
    grid-area: 1 / 1;
  }

  :global(.vicher-composer-bar) .vicher-send :global(.svg-icon) {
    width: 14px;
    height: 14px;
  }

  :global(.vicher-composer-bar) .vicher-send:hover {
    background: var(--text-normal);
    color: var(--background-primary);
    opacity: 0.9;
    transform: scale(1.05);
  }

  :global(.vicher-composer-bar) .vicher-send:active {
    transform: scale(0.94);
  }

  :global(.vicher-composer-bar) .vicher-send:disabled {
    opacity: 0.3;
    transform: none;
    cursor: default;
  }
</style>
