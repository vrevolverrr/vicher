<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cubicIn, cubicOut } from 'svelte/easing';
  import type { HTMLAttributes } from 'svelte/elements';
  import { pop } from '@/chat/view/motion';

  /**
   * A floating menu that pops in when `open` turns true and out when it turns false. Opened from a button (`anchor`),
   * it is named by the button and calls `close` on Escape, which returns focus to the button, or on a press outside
   * both. The caller's class places it; items with the `vicher-menu-item` class get the shared row look and the arrow
   * keys. It stays where it is rendered: Svelte hands clicks only to elements inside the mounted tree.
   */
  interface Props extends HTMLAttributes<HTMLDivElement> {
    open: boolean;
    anchor?: HTMLElement;
    close?: () => void;
    children: Snippet;
  }

  const { open, anchor, close, children, class: cls, ...rest }: Props = $props();

  const dismiss = (menu: HTMLElement) => {
    if (!anchor || !close) return;
    const doc = anchor.ownerDocument;
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target as Node;
      if (!menu.contains(target) && !anchor.contains(target)) close();
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      close();
      anchor.focus();
    };
    doc.addEventListener('pointerdown', onPointerDown, true);
    doc.addEventListener('keydown', onKeyDown, true);
    return () => {
      doc.removeEventListener('pointerdown', onPointerDown, true);
      doc.removeEventListener('keydown', onKeyDown, true);
    };
  };

  function keys(event: KeyboardEvent & { currentTarget: HTMLElement }): void {
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>('.vicher-menu-item')];
    const index = items.indexOf(event.currentTarget.ownerDocument.activeElement as HTMLElement);
    const next = { ArrowDown: items[(index + 1) % items.length], ArrowUp: items.at(Math.max(index, 0) - 1), Home: items[0], End: items.at(-1) }[event.key];
    if (!next) return;
    event.preventDefault();
    next.focus();
  }
</script>

{#if open}
  <div
    class={['vicher-menu', cls]}
    role="menu"
    tabindex="-1"
    aria-labelledby={anchor?.id}
    onkeydown={keys}
    {...rest}
    {@attach dismiss}
    in:pop={{ y: 6, scale: 0.97, duration: 180, easing: cubicOut }}
    out:pop={{ y: 4, scale: 0.98, duration: 120, easing: cubicIn }}
  >
    {@render children()}
  </div>
{/if}

<style>
  .vicher-menu {
    z-index: var(--layer-popover);
    overflow-y: auto;
    padding: 4px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 14px;
    background-color: Canvas;
    background-image: linear-gradient(var(--background-primary), var(--background-primary));
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06);
    font-size: var(--font-ui-small);
  }

  /* Resets Obsidian's button look. */
  .vicher-menu :global(.vicher-menu-item) {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    height: auto;
    border: none;
    border-radius: 8px;
    corner-shape: round;
    background: transparent;
    box-shadow: none;
    font-size: inherit;
    text-align: start;
    cursor: pointer;
  }

  .vicher-menu :global(.vicher-menu-item:is(:hover, :focus-visible)) {
    background: var(--background-modifier-hover);
  }

  .vicher-menu :global(.vicher-menu-item:focus-visible) {
    outline: 2px solid var(--interactive-accent);
    outline-offset: -2px;
  }
</style>
