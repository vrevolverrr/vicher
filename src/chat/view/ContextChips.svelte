<script lang="ts">
  import { quartOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import type { OpenDocumentState } from '@/context/NoteContext';
  import { icon } from '@/shared/view/icon';
  import { arrive, leave, type ChipExit, ms } from '@/shared/view/motion';

  /**
   * The chips above the input that show what the next turn carries. A chip lives as long as its subject: new state
   * updates it in place, so only a chip that arrives or leaves animates.
   */
  interface Props {
    host: {
      toggleNote(): void;
      removeSelection(): void;
    };
  }

  const { host }: Props = $props();

  let shown = $state<OpenDocumentState>({});
  let exit = $state<ChipExit>('dropped');
  let animate = $state(true);
  // A subject that comes back while its old chip is still leaving gets a new chip, so each run has its own key.
  let noteRun = $state(0);
  let selectionRun = $state(0);
  let tray: HTMLElement;

  const notes = $derived(shown.note ? [{ ...shown.note, key: noteRun }] : []);
  const selections = $derived(shown.selection ? [{ ...shown.selection, key: selectionRun }] : []);

  /** The row the chips sit in, which the attachment chips join. It exists after the first flush. */
  export function trayEl(): HTMLElement {
    return tray;
  }

  /** A chip leaves by dropping out, or by rising toward the message it went with. */
  export function set(state: OpenDocumentState, leaves: ChipExit = 'dropped', animated = true): void {
    if (state.note && !shown.note) noteRun++;
    if (state.selection && !shown.selection) selectionRun++;
    shown = state;
    exit = leaves;
    animate = animated;
  }

  function toggleNote(event: KeyboardEvent) {
    if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    host.toggleNote();
  }
</script>

{#snippet text(value: string)}
  {#key value}
    <span class="vicher-context-label" in:fly={{ y: 3, opacity: 0.3, duration: animate ? ms(180) : 0, easing: quartOut }}>{value}</span>
  {/key}
{/snippet}

<div class="vicher-context-tray" bind:this={tray}>
  {#each notes as note (note.key)}
    <div
      class={['vicher-context-chip', { 'is-excluded': note.excluded }]}
      role="button"
      tabindex="0"
      aria-pressed={!note.excluded}
      title={note.excluded ? `${note.path} (left out; click to include)` : `${note.path} (click to leave out)`}
      onclick={() => host.toggleNote()}
      onkeydown={toggleNote}
      in:arrive={{ animate }}
      out:leave={{ exit }}
    >
      <span class="vicher-context-icon" {@attach icon(note.icon)}></span>
      {@render text(note.label)}
    </div>
  {/each}{#each selections as selection (selection.key)}
    {@const chat = selection.source === 'chat'}
    {@const label = `${selection.lines} ${selection.lines === 1 ? 'line' : 'lines'} selected`}
    <div
      class="vicher-context-chip"
      title={chat ? 'Selected chat text, sent with your next message' : 'Selected text, sent with your next message'}
      in:arrive={{ animate }}
      out:leave={{ exit }}
    >
      <span class="vicher-context-icon" {@attach icon(chat ? 'messages-square' : 'text-select')}></span>
      {@render text(label)}
      <button
        type="button"
        class="vicher-icon-action clickable-icon vicher-context-remove"
        aria-label="Remove selection"
        onclick={() => host.removeSelection()}
        {@attach icon('x')}
      ></button>
    </div>
  {/each}
</div>

<style>
  .vicher-context-tray {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-2-2);
    margin: 0 4px;
  }

  .vicher-context-tray:empty {
    display: none;
  }
</style>
