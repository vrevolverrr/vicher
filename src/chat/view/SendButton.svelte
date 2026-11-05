<script lang="ts">
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
  }
</script>

<button
  class="vicher-send"
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
  .vicher-send {
    flex: none;
    width: 28px;
    height: 28px;
    display: grid;
    padding: 0;
    place-items: center;
    border: none;
    border-radius: 50%;
    corner-shape: round;
    box-shadow: none;
    cursor: pointer;
    transition:
      background-color 150ms ease,
      color 150ms ease,
      opacity 150ms ease,
      transform 150ms ease;
    background: var(--text-normal);
    color: var(--background-primary);
  }

  .vicher-send-icon {
    display: flex;
    grid-area: 1 / 1;
  }

  .vicher-send :global(.svg-icon) {
    width: 14px;
    height: 14px;
  }

  .vicher-send:hover {
    background: var(--text-normal);
    color: var(--background-primary);
    opacity: 0.9;
    transform: scale(1.05);
  }

  .vicher-send:active {
    transform: scale(0.94);
  }

  .vicher-send:disabled {
    opacity: 0.3;
    transform: none;
    cursor: default;
  }

  @media (prefers-reduced-motion: reduce) {
    .vicher-send {
      transition: none;
    }
  }
</style>
