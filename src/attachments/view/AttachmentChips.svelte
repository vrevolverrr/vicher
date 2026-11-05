<script lang="ts" module>
  /** An image shows a small thumbnail from `src`; a file, which has none, shows an icon. */
  export interface AttachmentChip {
    /** Names the chip across updates, so a chip that stays is not redrawn. */
    key: string;
    name: string;
    src?: string;
    title?: string;
  }
</script>

<script lang="ts">
  import { SvelteMap } from 'svelte/reactivity';
  import { icon } from '@/shared/view/icon';
  import { arrive, leave, type ChipExit } from '@/shared/view/motion';

  /**
   * The chips for what the next message carries besides text, each with a button to take it off. They join the
   * context chips in the tray they are mounted into, after them, and animate the same way.
   */
  interface Props {
    onRemove: (key: string) => void;
  }

  const { onRemove }: Props = $props();

  let shown = $state<(AttachmentChip & { run: number })[]>([]);
  let exit = $state<ChipExit>('dropped');
  // A file that comes back while its old chip is still leaving gets a new chip, so each run has its own key.
  const runs = new SvelteMap<string, number>();

  export function set(items: AttachmentChip[], leaves: ChipExit = 'dropped'): void {
    const staying = new Set(shown.map((item) => item.key));
    shown = items.map((item) => {
      if (!staying.has(item.key)) runs.set(item.key, (runs.get(item.key) ?? 0) + 1);
      return { ...item, run: runs.get(item.key)! };
    });
    exit = leaves;
  }
</script>

{#each shown as { key, run, name, src, title } (`${key}:${run}`)}
  <div class={['vicher-context-chip', 'vicher-attachment-chip', { 'vicher-image-chip': src }]} title={title ?? name} in:arrive out:leave={{ exit }}>
    {#if src}
      <span class="vicher-context-icon"><img {src} alt="" /></span>
    {:else}
      <span class="vicher-context-icon" {@attach icon('file-text')}></span>
    {/if}
    <span class="vicher-context-label">{name}</span>
    <button type="button" class="vicher-icon-action clickable-icon vicher-context-remove" aria-label="Remove {name}" onclick={() => onRemove(key)} {@attach icon('x')}></button>
  </div>
{/each}

<style>
  .vicher-attachment-chip {
    order: 1;
  }

  .vicher-image-chip {
    box-shadow: inset 0 0 0 1px var(--background-modifier-border);
  }

  .vicher-image-chip .vicher-context-icon {
    width: 18px;
    height: 18px;
  }

  .vicher-image-chip .vicher-context-icon img {
    width: 100%;
    height: 100%;
    border-radius: 3px;
    object-fit: cover;
  }
</style>
