<script module lang="ts">
  import { cubicIn, quartOut } from 'svelte/easing';
  import type { EasingFunction } from 'svelte/transition';
  import { ms } from '@/chat/view/motion';

  /**
   * Grows a chip from nothing or folds it back to nothing. Its box and the gap beside it shrink together, so the chips
   * next to it slide into place.
   */
  function squeeze(chip: HTMLElement, { duration, easing, y = 0, scale = 1 }: { duration: number; easing: EasingFunction; y?: number; scale?: number }) {
    const style = getComputedStyle(chip);
    const gap = parseFloat(getComputedStyle(chip.parentElement!).columnGap) || 0;
    const { offsetWidth, offsetHeight } = chip;
    const [top, right, bottom, left] = [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].map((side) => parseFloat(side) || 0);
    return {
      duration: ms(duration),
      easing,
      css: (t: number, u: number) =>
        `width: ${t * offsetWidth}px; height: ${t * offsetHeight}px; padding: ${t * top}px ${t * right}px ${t * bottom}px ${t * left}px; margin-right: ${-u * gap}px; opacity: ${t}; transform: translateY(${u * y}px) scale(${1 - u * (1 - scale)})`,
    };
  }
</script>

<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { OpenDocumentState } from '@/context/NoteContext';
  import { icon } from '@/shared/view/icon';
  import type { ChipExit } from '@/shared/view/Chip';

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

  const arrive = (chip: HTMLElement) => squeeze(chip, { duration: animate ? 200 : 0, easing: quartOut, scale: 0.9 });

  function leave(chip: HTMLElement) {
    chip.classList.add('is-leaving');
    chip.setAttribute('aria-hidden', 'true');
    return squeeze(chip, { duration: 160, easing: cubicIn, ...(exit === 'sent' ? { y: -8 } : { scale: 0.9 }) });
  }

  function toggleNote(event: KeyboardEvent) {
    if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    host.toggleNote();
  }
</script>

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
      in:arrive
      out:leave
    >
      <span class="vicher-context-icon" {@attach icon(note.icon)}></span>
      {#key note.label}
        <span class="vicher-context-label" in:fly={{ y: 3, opacity: 0.3, duration: animate ? ms(180) : 0, easing: quartOut }}>{note.label}</span>
      {/key}
    </div>
  {/each}{#each selections as selection (selection.key)}
    {@const chat = selection.source === 'chat'}
    {@const label = `${selection.lines} ${selection.lines === 1 ? 'line' : 'lines'} selected`}
    <div
      class="vicher-context-chip"
      title={chat ? 'Selected chat text, sent with your next message' : 'Selected text, sent with your next message'}
      in:arrive
      out:leave
    >
      <span class="vicher-context-icon" {@attach icon(chat ? 'messages-square' : 'text-select')}></span>
      {#key label}
        <span class="vicher-context-label" in:fly={{ y: 3, opacity: 0.3, duration: animate ? ms(180) : 0, easing: quartOut }}>{label}</span>
      {/key}
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
