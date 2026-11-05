<script lang="ts">
  import { cubicOut, sineOut } from 'svelte/easing';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';
  import type { AgentId, BackgroundTask, NoticeEvent } from '@/agents/types';
  import { appendAgentIcon } from '@/chat/view/agentIcons';
  import Card from '@/chat/view/Card.svelte';
  import { ms } from '@/shared/view/motion';
  import { formatElapsed } from '@/chat/view/formatElapsed';
  import { icon, setIcon } from '@/shared/view/icon';

  /**
   * The agent's background tasks, as a card above the chat tabs. Every state uses the same one-line rows: a mark, the
   * task's name, its time right after the name, and a pill for a task that was stopped. Collapsed, the card
   * shows the first task still running above the results waiting to be read; opening it only reveals the other rows
   * below. A result goes on its own after a few seconds; a task that ends without one shows a check for a moment before
   * its row goes.
   */
  interface Props {
    agent: () => AgentId;
    /** Rejects when the task could not be stopped, and its row then offers stop again. */
    stop: (id: string) => Promise<void>;
  }

  const { agent, stop }: Props = $props();

  /** How long a task that ended with no result shows its check before its row goes. */
  const DONE_MS = 600;
  /** How long a result stays, counted only while the pointer is off the card. */
  const RESULT_MS = 4000;
  /** How long "Could not stop" shows before stop is offered again. */
  const STOP_ERROR_MS = 3000;

  interface Line {
    /** Its row's identity, which outlives a task id that runs again. */
    key: number;
    description: string;
    /** When the task first showed, for its elapsed time. */
    since: number;
    /** Seconds it ran, fixed when it ended; unknown for a result whose task never showed. */
    took?: number;
    /** Stop was pressed; the task has not left yet. */
    stopping: boolean;
    /** The last stop failed, shown for a moment. */
    stopFailed: boolean;
    /** How long a result has left before it goes. */
    left: number;
    /** A result's countdown while the pointer is off the card, and when it started. */
    countdown?: { timer: number; from: number };
    /** The task left. */
    done: boolean;
    /** The mark's icon once the task ended; the agent's logo until then. */
    icon?: string;
    /**
     * How the task ended. What it reported is not shown: the agent relays it in the chat, and a long report would
     * break the card.
     */
    result?: Pick<NoticeEvent, 'status'>;
    /** Opens at once, under the row it replaces, which fades over it. */
    instant: boolean;
    /** How its row goes: folding away, fading over the row that takes its place, or at once. */
    exit: 'leave' | 'replaced' | 'instant';
  }

  const lines = new SvelteMap<string, Line>();
  const timers = new SvelteSet<number>();
  let keys = 0;
  let visible = $state(false);
  let expanded = $state(false);
  let hovered = false;
  let now = $state(Date.now());

  /** Running rows above the results, each group in the order its rows came. */
  const rows = $derived([...lines.values()].sort((a, b) => Number(!!a.result) - Number(!!b.result) || a.key - b.key));
  /** The running slot: the first task still running, or one just ended. */
  const top = $derived(rows.find((line) => !line.result));
  /** Results waiting to be read, and always the running slot. */
  const shown = $derived(new Set(rows.filter((line) => line.result || line === top)));
  const others = $derived(rows.filter((line) => !shown.has(line)));
  const open = $derived(expanded && others.length > 0);

  // With nothing left to reveal, the card collapses, and the next task that comes does not find it open.
  $effect.pre(() => {
    if (!others.length) expanded = false;
  });

  export function set(tasks: readonly BackgroundTask[]): void {
    now = Date.now();
    const live = new Set(tasks.map(({ id }) => id));
    for (const [id, line] of lines) if (!live.has(id) && !line.done) finish(id, line);
    for (const task of tasks) {
      const line = lines.get(task.id);
      if (line && !line.done) continue;
      lines.delete(task.id);
      // A task that runs again, as a Codex child does, keeps its last result beside the new run.
      if (line?.result) lines.set(`${task.id}\u0000${line.since}`, line);
      else if (line) line.exit = 'instant';
      lines.set(task.id, make(task, now));
    }
    if (tasks.length) visible = true;
  }

  /**
   * A task reported how it ended. It may come before or after `set` drops the task. The result is a new row entering
   * at the bottom, so the rows above shift up, and the running row it ends gives its place to the next task.
   */
  export function notice({ task, description, status }: NoticeEvent): void {
    now = Date.now();
    const before = shown;
    const old = lines.get(task);
    const ran = old && !old.result ? old : undefined;
    if (old?.result) lines.set(`${task}\u0000${old.since}`, old);
    const line = make({ id: task, description }, ran?.since ?? now);
    line.took = ran ? ran.took ?? seconds(ran) : undefined;
    line.done = true;
    line.result = { status };
    line.icon = status === 'completed' ? 'circle-check' : status === 'failed' ? 'circle-alert' : 'circle-stop';
    lines.delete(task);
    lines.set(task, line);
    countDown(line);
    if (ran) replace(ran, before);
    visible = true;
  }

  function make(task: BackgroundTask, since: number): Line {
    keys += 1;
    const line: Line = $state({
      key: keys, description: task.description, since, stopping: false, stopFailed: false,
      left: RESULT_MS, done: false, instant: false, exit: 'leave',
    });
    return line;
  }

  /** The task left: a check for a moment, then its row goes, and the card with the last one. */
  function finish(id: string, line: Line): void {
    line.took = seconds(line);
    line.done = true;
    line.icon = 'circle-check';
    later(DONE_MS, () => {
      if (lines.get(id) !== line) return;
      const before = shown;
      lines.delete(id);
      replace(line, before);
      if (!lines.size) close();
    });
  }

  /**
   * A row whose task ended, already out of `lines`. Collapsed, when it held the running slot, the next running task
   * takes its place at once while it fades over it, so nothing moves; otherwise it folds away.
   */
  function replace(ran: Line, before: Set<Line>): void {
    if (!expanded && top && !before.has(top) && before.has(ran)) {
      top.instant = true;
      ran.exit = 'replaced';
    }
  }

  function leave(id: string): void {
    lines.delete(id);
    // The last row goes with the card in one fade, not folding first and leaving an empty card to fade after.
    if (!lines.size) close();
  }

  function close(): void {
    visible = false;
    expanded = false;
  }

  function stopTask(id: string, line: Line): void {
    if (line.stopping || line.done) return;
    line.stopping = true;
    stop(id).catch(() => {
      line.stopping = false;
      line.stopFailed = true;
      later(STOP_ERROR_MS, () => { line.stopFailed = false; });
    });
  }

  function dismiss(line: Line): void {
    for (const [id, other] of lines) if (other === line && line.result) leave(id);
  }

  function countDown(line: Line): void {
    if (hovered || !line.result || line.countdown) return;
    line.countdown = { timer: later(line.left, () => dismiss(line)), from: Date.now() };
  }

  /** The pointer is on the card: results wait for it to leave, keeping the time they had left. */
  function hover(on: boolean): void {
    hovered = on;
    for (const line of lines.values()) {
      if (!on) countDown(line);
      else if (line.countdown) {
        window.clearTimeout(line.countdown.timer);
        timers.delete(line.countdown.timer);
        line.left -= Date.now() - line.countdown.from;
        line.countdown = undefined;
      }
    }
  }

  function seconds(line: Line): number {
    return Math.floor((now - line.since) / 1000);
  }

  function timeText(line: Line): string {
    if (!line.done) return formatElapsed(seconds(line));
    const took = line.took === undefined ? '' : formatElapsed(line.took);
    return line.result?.status === 'completed' ? (took ? `Done in ${took}` : 'Done') : took;
  }

  function note(line: Line): string {
    if (line.result?.status === 'stopped') return 'Stopped';
    return line.stopFailed && !line.done ? 'Could not stop' : '';
  }

  function later(ms: number, run: () => void): number {
    const timer = window.setTimeout(() => {
      timers.delete(timer);
      run();
    }, ms);
    timers.add(timer);
    return timer;
  }

  $effect(() => {
    if (!visible) return;
    const ticker = window.setInterval(() => (now = Date.now()), 1000);
    return () => window.clearInterval(ticker);
  });

  $effect(() => () => {
    for (const timer of timers) window.clearTimeout(timer);
  });

  /** The agent's logo while the task runs; then its end, a check drawing itself in once. */
  const mark = (line: Line) => (el: HTMLElement) => {
    el.empty();
    if (!line.icon) return appendAgentIcon(el, agent());
    setIcon(el, line.icon);
    // Each stroke's length is 1, so the CSS can draw any of them with one dash.
    if (line.icon === 'circle-check') for (const shape of el.querySelectorAll('svg > *')) shape.setAttribute('pathLength', '1');
  };

  /** A row's slot opens, or closes after its row has faded; a row hidden by the fold comes and goes at once. */
  function slot(node: HTMLElement, line: Line, { direction }: { direction: 'in' | 'out' | 'both' }) {
    if (node.classList.contains('is-folded') || (direction === 'out' && line.exit === 'instant')) return { duration: 0 };
    if (direction === 'out' && line.exit === 'replaced') {
      node.classList.add('is-replaced');
      node.style.setProperty('top', `${node.offsetTop}px`);
      return { duration: ms(160), easing: sineOut, css: (t: number) => `opacity: ${t}` };
    }
    return { delay: direction === 'out' ? ms(140) : 0, duration: ms(220), easing: cubicOut, css: (t: number) => `grid-template-rows: ${t}fr` };
  }

  /**
   * Coming in, a row fades and drops into place as its slot opens, so the slot's edge does not wipe its text in; a
   * result rises from below, so the rows above shift up. Going, it shrinks and fades in place before its slot closes.
   */
  function content(node: HTMLElement, line: Line, { direction }: { direction: 'in' | 'out' | 'both' }) {
    const row = node.parentElement!;
    if (row.classList.contains('is-folded') || (direction === 'out' && line.exit !== 'leave')) return { duration: 0 };
    if (direction === 'out') {
      return { duration: ms(220), easing: cubicOut, css: (t: number) => `opacity: ${t}; transform: scale(${0.94 + 0.06 * t})` };
    }
    const rise = line.result ? 6 : -6;
    return { delay: ms(40), duration: ms(220), easing: cubicOut, css: (t: number, u: number) => `opacity: ${t}; transform: translateY(${rise * u}px)` };
  }

  function clickCard(event: MouseEvent): void {
    // The collapsed card opens from anywhere on it, not only its chevron.
    if (!open && others.length && !(event.target as HTMLElement).closest('button')) expanded = true;
  }
</script>

<!-- The chevron is the keyboard control; a click anywhere else on the collapsed card is a shortcut. -->
<Card
  open={visible}
  class={['vicher-task-row', { 'is-expanded': open, 'is-more': others.length > 0 }]}
  onpointerenter={() => hover(true)}
  onpointerleave={() => hover(false)}
  onclick={clickCard}
>
    <div class="vicher-task-list">
      {#each rows as line (line.key)}
        {@const folded = !open && !shown.has(line)}
        <div
          class={['vicher-task', {
            'is-folded': folded,
            'is-top': line === top,
            'is-result': line.result,
            'is-instant': line.instant,
            'is-running': !line.done,
            'is-done': line.done,
            'is-stopping': line.stopping && !line.done,
          }]}
          data-status={line.result?.status}
          inert={folded}
          in:slot={line}
          out:slot={line}
          onoutroend={() => { if (top) top.instant = false; }}
        >
          <div class="vicher-task-inner" in:content={line} out:content={line}>
            <span class={['vicher-task-mark', { 'is-drawing': line.icon === 'circle-check' }]} {@attach mark(line)}></span>
            <div class="vicher-task-main">
              <div class="vicher-task-head">
                <span class="vicher-task-description" title={line.description}>{line.description}</span>
                <span class="vicher-task-time">
                  {#if line.stopping && !line.done}
                    <span>Stopping</span><span class="vicher-task-spinner" {@attach icon('loader-circle')}></span>
                  {:else}
                    {timeText(line)}
                  {/if}
                </span>
                {#if note(line)}
                  <span class={['vicher-task-note', { 'is-pill': line.result }]}>{note(line)}</span>
                {/if}
              </div>
            </div>
            <button
              class="vicher-icon-action clickable-icon vicher-task-stop"
              aria-label={`Stop ${line.description}`}
              disabled={line.stopping}
              onclick={() => {
                for (const [id, other] of lines) if (other === line) stopTask(id, line);
              }}
              {@attach icon('circle-stop')}
            ></button>
            <button
              class="vicher-icon-action clickable-icon vicher-task-dismiss"
              aria-label={`Dismiss ${line.description}`}
              onclick={() => dismiss(line)}
              {@attach icon('x')}
            ></button>
          </div>
        </div>
      {/each}
    </div>
    <div class="vicher-task-controls">
      <span class="vicher-task-more" title={others.map((line) => line.description).join('\n')}>
        {!open && others.length ? `+\u2009${others.length} ${others.length === 1 ? 'other' : 'others'}` : ''}
      </span>
      <button
        class="vicher-icon-action clickable-icon vicher-task-toggle"
        aria-label={open ? 'Show fewer tasks' : 'Show all tasks'}
        aria-expanded={open}
        hidden={!others.length}
        onclick={() => (expanded = !open)}
        {@attach icon('chevron-down')}
      ></button>
    </div>
</Card>

<style>
  :global(.vicher-task-row) {
    position: relative;
    grid-row: 2;
    /* Clears the floating chat tabs, as the approval card does; with the card below it, the card clears them. */
    margin-bottom: 38px;
    color: var(--text-muted);
    /* One curve for the card's motion: quick to start, long soft landing, no overshoot. */
    --vicher-task-ease: cubic-bezier(0.32, 0.72, 0, 1);
    --vicher-task-duration: 280ms;
    /* Every row keeps this much free at its end, under the card's controls, so no row moves when they change. */
    --vicher-task-controls: 100px;
    --vicher-task-line: 32px;
    --vicher-task-pad: 4px;
  }

  :global(.vicher-task-row:has(+ .vicher-approval-card)) {
    margin-bottom: 6px;
  }

  :global(.vicher-task-row.is-more:not(.is-expanded)) {
    cursor: pointer;
  }

  .vicher-task-list {
    position: relative;
    padding: var(--vicher-task-pad) 0;
    /* Eight rows show; the rest scroll. */
    max-height: calc(8 * var(--vicher-task-line) + 2 * var(--vicher-task-pad));
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb-bg) transparent;
  }

  /* A row folds by its slot's height, so collapsing, opening, adding and leaving all move the same way. Its curve is
     shorter than the card's: over a row's 32px the card's long landing creeps a pixel a frame. */
  .vicher-task {
    display: grid;
    grid-template-rows: 1fr;
    transition: grid-template-rows 220ms var(--vicher-ease-emphasized);
  }

  .vicher-task.is-folded {
    grid-template-rows: 0fr;
  }

  /* Unfolding, the row fades and drops into place once its slot is mostly open, so the slot's edge does not wipe its
     text in. */
  .vicher-task-inner {
    position: relative;
    display: flex;
    gap: var(--size-2-3);
    min-height: 0;
    padding: 0 var(--size-4-4) 0 var(--size-4-3);
    overflow: hidden;
    transition:
      opacity 160ms ease-out 70ms,
      transform 220ms var(--vicher-ease-emphasized) 40ms;
  }

  .vicher-task.is-folded .vicher-task-inner {
    opacity: 0;
    transform: translateY(-6px);
    transition:
      opacity 100ms ease-out,
      transform 220ms var(--vicher-ease-emphasized);
  }

  /* The running slot changes task in place: the next row opens at once under the one going, which fades over it. */
  .vicher-task.is-instant {
    transition: none;
  }

  /* Crossfading, the incoming text starts at once and does not drop in, so the slot never reads as empty. */
  .vicher-task.is-instant .vicher-task-inner {
    transform: none;
    transition: opacity 160ms ease-out;
  }

  .vicher-task:global(.is-replaced) {
    position: absolute;
    right: 0;
    left: 0;
    pointer-events: none;
  }

  .vicher-task-mark {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: var(--vicher-task-line);
  }

  .vicher-task-mark :global(:is(.svg-icon, .vicher-agent-icon)) {
    width: 14px;
    height: 14px;
  }

  .vicher-task.is-done .vicher-task-mark {
    color: var(--color-green);
  }

  .vicher-task[data-status='failed'] .vicher-task-mark {
    color: var(--text-error);
  }

  .vicher-task[data-status='stopped'] .vicher-task-mark {
    color: var(--text-muted);
  }

  .vicher-task-mark.is-drawing :global(svg > *) {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: vicher-task-draw 420ms cubic-bezier(0.65, 0, 0.35, 1) forwards;
  }

  .vicher-task-mark.is-drawing :global(svg > :last-child) {
    animation-duration: 260ms;
    animation-delay: 320ms;
  }

  @keyframes vicher-task-draw {
    to { stroke-dashoffset: 0; }
  }

  .vicher-task-main {
    flex: 1;
    min-width: 0;
  }

  .vicher-task-head {
    display: flex;
    align-items: center;
    gap: var(--size-4-2);
    height: var(--vicher-task-line);
    min-width: 0;
    /* The name never runs under the controls or the stop button. */
    padding-right: calc(var(--vicher-task-controls) + 20px);
  }

  .vicher-task-description {
    min-width: 0;
    overflow: hidden;
    color: var(--text-normal);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vicher-task.is-done:not(.is-result) .vicher-task-description {
    color: var(--text-faint);
    transition: color 200ms ease;
  }

  .vicher-task-time {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--size-2-2);
    color: var(--text-faint);
    font-variant-numeric: tabular-nums;
  }

  .vicher-task-time :global(.svg-icon) {
    width: 12px;
    height: 12px;
  }

  .vicher-task-spinner {
    display: flex;
    animation: vicher-spin 900ms linear infinite;
  }

  .vicher-task-note {
    flex-shrink: 0;
    color: var(--text-error);
  }

  .vicher-task-note.is-pill {
    padding: 1px var(--size-4-2);
    border-radius: 999px;
    background: var(--background-modifier-hover);
    color: var(--text-muted);
    font-size: var(--font-ui-smaller);
  }

  /* The stop button takes the row's end just inside the controls' column, and shows on the row under the pointer. */
  .vicher-task :is(.vicher-task-stop, .vicher-task-dismiss).clickable-icon {
    position: absolute;
    top: calc((var(--vicher-task-line) - 24px) / 2);
    right: var(--size-4-2);
    height: 24px;
    padding: 0 var(--size-2-1);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--text-muted);
    opacity: 0;
    /* All three listed: a transition list replaces Obsidian's own for clickable icons. */
    transition:
      opacity 180ms ease-out,
      color 150ms ease,
      background-color 150ms ease;
  }

  .vicher-task :is(.vicher-task-stop, .vicher-task-dismiss).clickable-icon:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .vicher-task-inner:is(:hover, :focus-within) :is(.vicher-task-stop, .vicher-task-dismiss) {
    opacity: 1;
  }

  .vicher-task:is(.is-stopping, .is-done) .vicher-task-stop,
  .vicher-task:not(.is-result) .vicher-task-dismiss {
    display: none;
  }

  /* A row's buttons take the chevron's column, except on the top row while the card's controls sit there. */
  :global(.vicher-task-row.is-more) .vicher-task.is-top .vicher-task-stop.clickable-icon {
    right: calc(var(--size-4-2) + var(--vicher-task-controls));
  }

  /* Open, the controls are only the chevron, so the button sits right beside it. */
  :global(.vicher-task-row.is-expanded) .vicher-task.is-top .vicher-task-stop.clickable-icon {
    right: calc(var(--size-4-2) + 28px);
  }

  :global(.vicher-task-row.is-expanded) .vicher-task-inner:hover {
    background: var(--background-modifier-hover);
  }

  .vicher-task-controls {
    position: absolute;
    top: var(--vicher-task-pad);
    right: var(--size-4-2);
    display: flex;
    align-items: center;
    gap: 2px;
    height: var(--vicher-task-line);
  }

  .vicher-task-more {
    padding-right: var(--size-2-1);
    color: var(--text-faint);
    font-variant-numeric: tabular-nums;
  }

  .vicher-task-controls .clickable-icon {
    padding: var(--size-2-1);
    color: var(--text-faint);
    transition:
      color 150ms ease,
      background-color 150ms ease;
  }

  .vicher-task-controls .clickable-icon:hover {
    color: var(--text-normal);
  }

  .vicher-task-controls .clickable-icon[hidden] {
    display: none;
  }

  .vicher-task-toggle :global(.svg-icon) {
    transition: transform var(--vicher-task-duration) var(--vicher-task-ease);
  }

  :global(.vicher-task-row.is-expanded) .vicher-task-toggle :global(.svg-icon) {
    transform: rotate(180deg);
  }

  .vicher-task.is-running:not(.is-folded) .vicher-task-description {
    background: linear-gradient(90deg, var(--text-muted) 40%, color-mix(in srgb, var(--text-muted) 45%, white) 50%, var(--text-muted) 60%) 0 0 / 250% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: vicher-shimmer 1.6s linear infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .vicher-task-spinner,
    .vicher-task-mark.is-drawing :global(svg > *) {
      animation-duration: 1ms;
      animation-delay: 0ms;
    }

    .vicher-task,
    .vicher-task-toggle :global(.svg-icon) {
      transition: none;
    }
  }
</style>
