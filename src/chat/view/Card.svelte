<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { quintOut } from 'svelte/easing';
  import { collapse, pop } from '@/shared/view/motion';

  /**
   * A card above the chat tabs, such as the task card or the approval card. It rises in when `open` turns true, and
   * fades and shrinks with its gap when it turns false, keeping what it showed until it is gone. The caller's class
   * places it in the pane's grid and sets its bottom gap.
   */
  interface Props extends HTMLAttributes<HTMLDivElement> {
    open: boolean;
    children: Snippet;
  }

  const { open, children, class: cls, ...rest }: Props = $props();
</script>

{#if open}
  <div class={['vicher-card', cls]} {...rest} in:pop={{ y: 8, scale: 0.99, duration: 280, easing: quintOut }} out:collapse>
    {@render children()}
  </div>
{/if}

<style>
  .vicher-card {
    min-width: 0;
    margin-inline: 4px;
    overflow: hidden;
    border: 1px solid var(--background-modifier-border);
    border-radius: 14px;
    background: var(--background-primary);
    box-shadow: 0 2px 4px color-mix(in srgb, var(--text-normal) 3%, transparent), 0 8px 24px color-mix(in srgb, var(--text-normal) 4%, transparent);
    font-size: var(--font-ui-small);
  }
</style>
