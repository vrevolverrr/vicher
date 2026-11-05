<script lang="ts" module>
  /** How long a run of calls that just ended stays active before a working line takes over. */
  const NEXT_CALL_MS = 600;

  const RATINGS = [
    ['up', 'thumbs-up', 'Good response'],
    ['down', 'thumbs-down', 'Poor response'],
  ] as const;
</script>

<script lang="ts">
  import { flushSync, untrack } from 'svelte';
  import type { Rating, ToolPart, TourStep } from '@/chat/ChatRecord';
  import { countFigures } from '@/chat/splitReply';
  import { formatWhen } from '@/chat/view/chatList';
  import type { ReplyFeedback } from '@/chat/view/ReplyFeedback';
  import { type MarkdownTarget, ReplyFigures, TextBlock } from '@/chat/view/TextBlock';
  import ToolGroup from '@/chat/view/ToolGroup.svelte';
  import CopyButton from '@/shared/view/CopyButton.svelte';
  import { icon } from '@/shared/view/icon';
  import { canAnimate, ease } from '@/shared/view/motion';
  import Walkthrough from '@/tour/view/Walkthrough.svelte';
  import type { WalkthroughHost } from '@/tour/view/WalkthroughHost';

  /**
   * One assistant reply, in the order the agent produced it: text, then a group for each run of tool calls,
   * then more text. Text after a tool call starts a new block, so a preamble never runs into the answer. A stop the
   * agent pointed at joins the run of stops in front of it, or starts one.
   * While the agent works without writing, an empty group at the end stands in as a working line.
   */
  interface Props {
    markdown: MarkdownTarget;
    walkthrough: WalkthroughHost;
    /** Sends a message a figure wrote for the student, such as a quiz answer; false when the chat cannot take one now. */
    ask?: (message: string) => boolean;
    /** Reports a copy the clipboard refused. */
    copyRefused: (error: unknown) => void;
    /** True for a reply being written, false for a saved one drawn again. */
    live?: boolean;
    /** The working line takes over one already on screen, so it does not ease in again. */
    handover?: boolean;
  }

  const { markdown, walkthrough, ask, copyRefused, live = false, handover = false }: Props = $props();

  type ToolsBlock = { id: number; kind: 'tools'; startedAt: number; rows: ToolPart[]; holding: boolean; finished: boolean; entering: boolean };
  type TextBlockEntry = { id: number; kind: 'text'; first: number; view?: TextBlock };
  /** A run of stops: `count` of the reply's `steps`, from `start`. */
  type WalkBlock = { id: number; kind: 'walk'; start: number; count: number };
  type Block = ToolsBlock | TextBlockEntry | WalkBlock;

  const blocks = $state<Block[]>([]);
  /** Every stop of the reply, across its runs. */
  const steps: TourStep[] = [];
  /** `steps.length`, kept in state so a lone stop's walkthrough redraws numbered when a second arrives. */
  let total = $state(0);
  const figures = untrack(() => new ReplyFigures(live, ask));
  let ids = 0;
  /** The run of calls that just ended, held active for a moment in case the next call follows. */
  let held: { block: ToolsBlock; timer: number } | null = null;
  let footer = $state<{ at?: number; feedback?: ReplyFeedback; copy: () => string } | null>(null);
  let rating = $state<Rating | undefined>();

  untrack(() => follow(live && !handover));

  $effect(() => release);

  function follow(entering = live): ToolsBlock {
    blocks.push({ id: ++ids, kind: 'tools', startedAt: Date.now(), rows: [], holding: false, finished: false, entering });
    return blocks.at(-1) as ToolsBlock;
  }

  /** Adds a text block whose element hands its view to `view` when it mounts, which `flushSync` makes happen now. */
  function addTextBlock(first: number): TextBlockEntry {
    blocks.push({ id: ++ids, kind: 'text', first });
    flushSync();
    return blocks.at(-1) as TextBlockEntry;
  }

  function discard(block: Block): void {
    blocks.splice(blocks.indexOf(block), 1);
  }

  function release(): void {
    if (!held) return;
    window.clearTimeout(held.timer);
    held.block.holding = false;
    held = null;
  }

  const isWorkingLine = (block: Block | undefined): block is ToolsBlock => block?.kind === 'tools' && block.rows.length === 0;

  export function appendText(delta: string): void {
    if (delta.trim() !== '') release();
    let block = blocks.at(-1);
    if (block?.kind !== 'text') {
      // Whitespace between two tool calls must not split their group.
      if (delta.trim() === '') return;
      if (isWorkingLine(block)) {
        // A pause long enough to notice stays as "Thought for 3s", unless a "Used …" line already sits above it.
        const previous = blocks.at(-2);
        if (Date.now() - block.startedAt >= 1000 && previous?.kind !== 'tools') block.finished = true;
        else discard(block);
      }
      const first = blocks.reduce((count, previous) => count + (previous.kind === 'text' ? countFigures(previous.view!.text) : 0), 0);
      block = addTextBlock(first);
    }
    block.view!.append(delta);
  }

  export function highlight(step: TourStep): void {
    release();
    const last = blocks.at(-1);
    if (isWorkingLine(last)) discard(last);
    steps.push(step);
    total = steps.length;
    const run = blocks.at(-1);
    if (run?.kind === 'walk') run.count += 1;
    else blocks.push({ id: ++ids, kind: 'walk', start: steps.length - 1, count: 1 });
    // The walkthrough hears the tour from the moment it mounts.
    flushSync();
  }

  export function thinking(): void {
    if (blocks.at(-1)?.kind === 'text') follow();
  }

  export function tool(event: ToolPart): void {
    release();
    let group = blocks.find((block): block is ToolsBlock => block.kind === 'tools' && block.rows.some((row) => row.id === event.id));
    if (!group) {
      const [previous, last] = blocks.slice(-2);
      // A call right after a run of calls joins that run, so the working line between them goes.
      if (isWorkingLine(last) && previous?.kind === 'tools') discard(last);
      const block = blocks.at(-1);
      group = block?.kind === 'tools' ? block : follow();
    }
    const at = group.rows.findIndex((row) => row.id === event.id);
    if (at < 0) group.rows.push(event);
    else group.rows[at] = event;
    // Every call in the run has ended. Calls often follow one another at once, so the run stays active for a moment;
    // only a real pause hands over to a working line, which would otherwise blink in and out between calls.
    if (group === blocks.at(-1) && group.rows.every((row) => row.status !== 'running') && live) {
      const block = group;
      block.holding = true;
      const timer = window.setTimeout(() => {
        release();
        follow();
      }, NEXT_CALL_MS);
      held = { block, timer };
    }
  }

  /**
   * `at` is when the turn ended; it shows beside the copy button, with a thumb pair when `feedback` is given. `copy` is
   * what the button copies, this reply's text unless the reply ends a run of several.
   */
  export function finish(at?: number, feedback?: ReplyFeedback, copy: () => string = text): void {
    release();
    const last = blocks.at(-1);
    if (isWorkingLine(last)) discard(last);
    for (const block of blocks) {
      if (block.kind === 'text') block.view!.finish();
      else if (block.kind === 'tools') block.finished = true;
    }
    // Until the repair turn exists, a held failure shows its error card when the reply ends.
    figures.settled = true;
    for (const failure of figures.held.values()) failure.showError();
    figures.held.clear();
    if (footer || !copy()) return;
    rating = feedback?.rating;
    footer = { at, feedback, copy };
  }

  export function text(): string {
    return blocks.flatMap((block) => (block.kind === 'text' ? [block.view!.text.trim()] : [])).join('\n\n');
  }

  const textBlock = (block: TextBlockEntry) => (node: HTMLElement) => {
    const view = new TextBlock(node, markdown, figures, block.first);
    block.view = view;
    return () => view.destroy();
  };

  /** Pressing the lit thumb takes it back. */
  function rate(name: Rating, button: HTMLElement): void {
    rating = rating === name ? undefined : name;
    if (canAnimate(button)) {
      button.animate([
        { transform: 'scale(0.82)' },
        { transform: 'scale(1.16)', offset: 0.55 },
        { transform: 'scale(1)' },
      ], { duration: 260, easing: ease('out') });
    }
    footer!.feedback!.rate(rating);
  }
</script>

{#each blocks as block (block.id)}
  {#if block.kind === 'tools'}
    <ToolGroup rows={block.rows} holding={block.holding} finished={block.finished} entering={block.entering} startedAt={block.startedAt} />
  {:else if block.kind === 'text'}
    <div class="vicher-reply-text" {@attach textBlock(block)}></div>
  {:else}
    <Walkthrough {steps} {total} start={block.start} count={block.count} host={walkthrough} />
  {/if}
{/each}{#if footer}
  <div class="vicher-reply-footer">
    {#if footer.at !== undefined}
      <span class="vicher-reply-time">{formatWhen(footer.at, Date.now())}</span>
    {/if}
    <CopyButton class="vicher-reply-copy" label="Copy response" text={footer.copy} refused={copyRefused} />
    {#if footer.feedback}
      {#each RATINGS as [name, iconName, label] (name)}
        <button
          class={['vicher-icon-action', 'clickable-icon', 'vicher-reply-rate', `is-${name}`, { 'is-active': rating === name }]}
          aria-label={label}
          aria-pressed={rating === name}
          onclick={(event) => rate(name, event.currentTarget)}
          {@attach icon(iconName)}
        ></button>
      {/each}
    {/if}
  </div>
{/if}

<style>
  /* An agent turn followed by another under the same message reads as one reply: only the last keeps the footer. */
  :global(.vicher-reply.is-continued) > .vicher-reply-footer {
    display: none;
  }

  .vicher-reply-footer {
    display: flex;
    align-items: center;
    align-self: flex-start;
    gap: var(--size-2-2);
    animation: vicher-pop-in 200ms ease-out;
  }

  .vicher-reply-time {
    color: var(--text-faint);
    font-size: var(--font-ui-smaller);
    font-variant-numeric: tabular-nums;
  }

  .vicher-icon-action.clickable-icon.vicher-reply-rate {
    transition:
      color 150ms ease,
      background-color 150ms ease,
      transform 100ms ease;
  }

  .vicher-reply-rate.is-up {
    --vicher-rating-color: var(--color-green);
  }

  .vicher-reply-rate.is-down {
    --vicher-rating-color: var(--color-red);
  }

  .vicher-icon-action.clickable-icon.vicher-reply-rate:active {
    transform: scale(0.88);
  }

  .vicher-icon-action.clickable-icon.vicher-reply-rate.is-active {
    color: var(--vicher-rating-color);
    background-color: color-mix(in srgb, var(--vicher-rating-color) 14%, transparent);
  }

  .vicher-reply-rate.is-active :global(.svg-icon) {
    fill: currentColor;
  }

  @media (prefers-reduced-motion: reduce) {
    .vicher-icon-action.clickable-icon.vicher-reply-rate {
      transition: none;
    }

    .vicher-icon-action.clickable-icon.vicher-reply-rate:active {
      transform: none;
    }
  }
</style>
