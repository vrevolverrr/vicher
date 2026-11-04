<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import Menu from '@/chat/view/Menu.svelte';
  import { icon } from '@/shared/view/icon';

  /** A button in the composer bar and its menu, which opens above it inside `container`. */
  interface Props extends HTMLButtonAttributes {
    open: boolean;
    toggle: () => void;
    close: () => void;
    /** The positioned composer the menu is placed against. */
    container: HTMLElement;
    label: Snippet;
    children: Snippet;
  }

  const { open, toggle, close, container, label, children, class: cls, ...rest }: Props = $props();

  const id = $props.id();
  const GAP = 6;
  let anchor = $state<HTMLButtonElement>();

  const place = (menu: HTMLElement): void => {
    if (!anchor) return;
    menu.style.left = `${anchor.offsetLeft}px`;
    menu.style.bottom = `${container.clientHeight - anchor.offsetTop + GAP}px`;
  };
</script>

<button bind:this={anchor} type="button" {id} class={['vicher-picker', cls]} aria-haspopup="menu" aria-expanded={open} onclick={toggle} {...rest}>
  <span class="vicher-picker-label">{@render label()}</span>
  <span class="vicher-picker-chevron" {@attach icon('chevron-down')}></span>
</button>
<Menu {open} {anchor} {close} class="vicher-picker-menu" {@attach place}>
  {@render children()}
</Menu>

<style>
  .vicher-picker-chevron {
    display: inline-flex;
    flex: none;
    opacity: 0.5;
  }

  .vicher-picker-chevron :global(.svg-icon) {
    transition: transform 160ms ease;
  }

  .vicher-picker[aria-expanded='true'] .vicher-picker-chevron :global(.svg-icon) {
    transform: rotate(180deg);
  }

  .vicher-picker-label {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    gap: 6px;
  }

  .vicher-picker-label > :global(span:last-child) {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :global(.vicher-composer) .vicher-picker {
    min-width: 0;
  }

  :global(.vicher-picker-menu) {
    position: absolute;
    right: 0;
    display: flex;
    flex-direction: column;
    min-width: 150px;
    max-width: min(210px, 100%);
    max-height: min(280px, 50vh);
    transform-origin: bottom left;
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb-bg) transparent;
  }

  @media (prefers-reduced-motion: reduce) {
    .vicher-picker-chevron :global(.svg-icon) {
      transition: none;
    }
  }
</style>
