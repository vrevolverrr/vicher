<script lang="ts">
  import type { ClassValue } from 'svelte/elements';
  import { icon } from '@/shared/view/icon';

  /** An icon button that copies the text it is given and shows a check for a moment. */
  interface Props {
    label: string;
    text: () => string;
    class?: ClassValue;
  }

  const { label, text, class: cls }: Props = $props();

  const COPIED_MS = 1500;
  let copied = $state(false);
  let reset: number | undefined;

  $effect(() => () => window.clearTimeout(reset));

  function copy(): void {
    void navigator.clipboard.writeText(text()).then(() => {
      copied = true;
      window.clearTimeout(reset);
      reset = window.setTimeout(() => (copied = false), COPIED_MS);
    });
  }
</script>

<button
  type="button"
  class={['vicher-icon-action', 'clickable-icon', cls, { 'is-copied': copied }]}
  aria-label={label}
  onclick={copy}
  {@attach icon(copied ? 'check' : 'copy')}
></button>
