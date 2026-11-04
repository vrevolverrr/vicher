import type { AgentEvent, AgentId, BackgroundTask } from '@/agents/types';
import { appendAgentIcon } from '@/chat/view/agentIcons';
import { formatElapsed } from '@/chat/view/ToolGroup';
import { createIconButton } from '@/shared/view/iconButtons';
import { setIcon } from '@/shared/view/icon';

/** How long a task that ended with no result shows its check before its row goes. */
const DONE_MS = 600;
/** The card's exit animation (`--vicher-task-duration`). */
const LEAVE_MS = 280;
/** A row's exit: it shrinks and fades, then its slot closes (`.vicher-task.is-leaving`). */
const ROW_LEAVE_MS = 400;
/** How long a result that did not fail stays, counted only while the pointer is off the card. */
const RESULT_SECONDS = 10;
/** How long "Could not stop" shows before stop is offered again. */
const STOP_ERROR_MS = 3000;

export type TaskNotice = Extract<AgentEvent, { type: 'notice' }>;

interface TaskLine {
  description: string;
  /** The row's slot, whose height animates as the row folds away or comes back. */
  el: HTMLElement;
  markEl: HTMLElement;
  timeEl: HTMLElement;
  stopEl: HTMLElement;
  /** When the task first showed, for its elapsed time. */
  since: number;
  /** Seconds it ran, fixed when it ended; unknown for a result whose task never showed. */
  took?: number;
  /** Stop was pressed; the task has not left yet. */
  stopping: boolean;
  /** The last stop failed, shown for a moment. */
  stopFailed: boolean;
  /** A "Failed" or "Stopped" pill, or "Could not stop". */
  noteEl: HTMLElement;
  /** Seconds a result that did not fail has left before it goes. */
  fadeIn: number;
  /** The task left. */
  done: boolean;
  /** Its row is going. */
  leaving: boolean;
  /**
   * How the task ended. What it reported is not shown: Claude relays it in the chat, and a long report would break the
   * card. A failure stays until the student sends a message; any other result fades after a while.
   */
  result?: Pick<TaskNotice, 'status'>;
}

/**
 * The agent's background tasks, as a card above the chat tabs. Every state uses the same one-line rows: a mark, the
 * task's name, its time right after the name, and a pill for a task that failed or was stopped. Collapsed, the card
 * shows the first task still running above the results waiting to be read; opening it only reveals the other rows below. A result goes on its own
 * after a while, or, if the task failed, when the student sends a message; a task that ends without one shows a check
 * for a moment before its row goes.
 */
export class TaskRow {
  private readonly el: HTMLElement;
  private readonly listEl: HTMLElement;
  private readonly moreEl: HTMLElement;
  private readonly toggleEl: HTMLElement;
  private readonly lines = new Map<string, TaskLine>();
  private readonly timers = new Set<number>();
  private ticker: number | null = null;
  private expanded = false;
  private hovered = false;

  /** `stop` rejects when the task could not be stopped, and its row then offers stop again. */
  constructor(parent: HTMLElement, private readonly agent: () => AgentId, private readonly stop: (id: string) => Promise<void>) {
    this.el = parent.createDiv({ cls: 'vicher-task-row' });
    this.el.hidden = true;
    this.listEl = this.el.createDiv({ cls: 'vicher-task-list' });
    const controls = this.el.createDiv({ cls: 'vicher-task-controls' });
    this.moreEl = controls.createSpan({ cls: 'vicher-task-more' });
    this.toggleEl = createIconButton(controls, 'chevron-down', 'Show all tasks', 'vicher-task-toggle');
    this.toggleEl.setAttr('aria-expanded', 'false');
    this.el.addEventListener('pointerenter', () => { this.hovered = true; });
    this.el.addEventListener('pointerleave', () => { this.hovered = false; });
    this.toggleEl.addEventListener('click', () => this.toggle());
    // The collapsed card opens from anywhere on it, not only its chevron.
    this.el.addEventListener('click', (event) => {
      if (!this.expanded && !this.toggleEl.hidden && !(event.target as HTMLElement).closest('button')) this.toggle();
    });
  }

  set(tasks: readonly BackgroundTask[]): void {
    const now = Date.now();
    const live = new Set(tasks.map(({ id }) => id));
    for (const [id, line] of this.lines) if (!live.has(id) && !line.done) this.finish(id, line);
    for (const task of tasks) {
      const line = this.lines.get(task.id);
      if (line && !line.done) continue;
      this.lines.delete(task.id);
      // A task that runs again, as a Codex child does, keeps its last result beside the new run.
      if (line?.result) this.lines.set(`${task.id}\u0000${line.since}`, line);
      else line?.el.remove();
      this.lines.set(task.id, this.line(task, now));
    }
    if (tasks.length) this.open();
    this.render();
  }

  /**
   * A task reported how it ended. It may come before or after `set` drops the task. The result is a new row entering at
   * the bottom, so the rows above shift up, and the running row it ends gives its place to the next task.
   */
  notice({ task, description, status }: TaskNotice): void {
    const old = this.lines.get(task);
    const ran = old && !old.result ? old : undefined;
    if (old?.result) this.lines.set(`${task}\u0000${old.since}`, old);
    const line = this.line({ id: task, description }, ran?.since ?? Date.now(), true);
    line.took = ran ? ran.took ?? this.seconds(ran) : undefined;
    line.done = true;
    line.result = { status };
    line.el.dataset.status = status;
    this.mark(line, status === 'completed' ? 'circle-check' : status === 'failed' ? 'circle-alert' : 'circle-stop', status === 'completed');
    this.lines.delete(task);
    this.lines.set(task, line);
    if (ran) this.replace(ran);
    this.open();
    this.render();
  }

  /** The student sent a message: the failures they have seen go. */
  sent(): void {
    for (const [id, line] of this.lines) if (line.result?.status === 'failed') this.leave(id, line);
  }

  destroy(): void {
    this.stopTicker();
    for (const timer of this.timers) window.clearTimeout(timer);
    this.timers.clear();
  }

  /** A result's row goes at the bottom; a running task's above the results. */
  private line(task: BackgroundTask, since: number, result = false): TaskLine {
    // A new row starts folded and unfolds, so the card grows smoothly rather than jumping.
    const el = createDiv({ cls: result ? 'vicher-task is-folded is-result is-done' : 'vicher-task is-folded' });
    this.listEl.insertBefore(el, result ? null : this.listEl.querySelector(':scope > .vicher-task.is-result'));
    void el.offsetHeight;
    const row = el.createDiv({ cls: 'vicher-task-inner' });
    const markEl = row.createSpan({ cls: 'vicher-task-mark' });
    appendAgentIcon(markEl, this.agent());
    const main = row.createDiv({ cls: 'vicher-task-main' });
    const head = main.createDiv({ cls: 'vicher-task-head' });
    head.createSpan({ cls: 'vicher-task-description', text: task.description, attr: { title: task.description } });
    const timeEl = head.createSpan({ cls: 'vicher-task-time' });
    const noteEl = head.createSpan({ cls: 'vicher-task-note' });
    const stopEl = createIconButton(row, 'circle-stop', `Stop ${task.description}`, 'vicher-task-stop');
    createIconButton(row, 'x', `Dismiss ${task.description}`, 'vicher-task-dismiss').addEventListener('click', () => {
      for (const [id, other] of this.lines) if (other === line && line.result) this.leave(id, line);
    });
    const line: TaskLine = {
      description: task.description, el, markEl, timeEl, noteEl, stopEl, since,
      stopping: false, stopFailed: false, fadeIn: RESULT_SECONDS, done: false, leaving: false,
    };
    stopEl.addEventListener('click', () => {
      if (line.stopping || line.done) return;
      line.stopping = true;
      this.render();
      this.stop(task.id).catch(() => {
        line.stopping = false;
        line.stopFailed = true;
        this.render();
        this.later(STOP_ERROR_MS, () => {
          line.stopFailed = false;
          this.render();
        });
      });
    });
    return line;
  }

  /** The task left: a check for a moment, then the row folds away, and the card goes with the last one. */
  private finish(id: string, line: TaskLine): void {
    line.took = this.seconds(line);
    line.done = true;
    this.mark(line, 'circle-check', true);
    this.later(DONE_MS, () => {
      if (this.lines.get(id) !== line) return;
      this.lines.delete(id);
      this.replace(line);
      if (!this.lines.size) this.close();
      this.render();
    });
  }

  /**
   * A row in the running slot whose task ended, already out of `lines`. Collapsed, the next running task takes its place
   * at once while it fades over it, so nothing moves; otherwise it shrinks and fades and its slot closes.
   */
  private replace(ran: TaskLine): void {
    const next = [...this.lines.values()].find((line) => !line.result && !line.leaving);
    if (!this.expanded && next?.el.hasClass('is-folded') && !ran.el.hasClass('is-folded')) {
      this.listEl.insertBefore(next.el, ran.el);
      next.el.addClass('is-instant');
      ran.el.style.setProperty('top', `${ran.el.offsetTop}px`);
      ran.el.addClass('is-replaced');
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => next.el.removeClass('is-instant')));
    } else {
      ran.el.addClass('is-folded', 'is-leaving');
    }
    this.later(ROW_LEAVE_MS, () => ran.el.remove());
  }

  /** Folds the row away, and the card goes with the last one. */
  private leave(id: string, line: TaskLine): void {
    line.leaving = true;
    // The last row goes with the card in one fade, not folding first and leaving an empty card to fade after.
    if ([...this.lines.values()].every((other) => other.leaving)) this.close();
    this.render();
    this.later(ROW_LEAVE_MS, () => {
      if (this.lines.get(id) !== line || !line.leaving) return;
      line.el.remove();
      this.lines.delete(id);
      if (!this.lines.size && !this.el.hasClass('is-closing')) this.close();
      this.render();
    });
  }

  /** Each second off the card counts down the results that did not fail. */
  private tick(): void {
    if (!this.hovered) {
      for (const [id, line] of this.lines) {
        if (!line.result || line.result.status === 'failed' || line.leaving) continue;
        line.fadeIn -= 1;
        if (line.fadeIn <= 0) this.leave(id, line);
      }
    }
    this.render();
  }

  /** A check circle draws itself in, once: the mark keeps its element after. */
  private mark(line: TaskLine, icon: string, draw: boolean): void {
    line.markEl.empty();
    setIcon(line.markEl, icon);
    line.markEl.toggleClass('is-drawing', draw);
    // Each stroke's length is 1, so the CSS can draw any of them with one dash.
    if (draw) for (const shape of line.markEl.querySelectorAll('svg > *')) shape.setAttribute('pathLength', '1');
  }

  private toggle(): void {
    this.expanded = !this.expanded;
    this.render();
  }

  private open(): void {
    this.el.removeClass('is-closing');
    this.el.style.removeProperty('height');
    this.el.hidden = false;
    this.ticker ??= window.setInterval(() => this.tick(), 1000);
  }

  /** Fades the card and shrinks it, gap included, so the transcript above grows smoothly instead of jumping. */
  private close(): void {
    this.stopTicker();
    this.expanded = false;
    // A height transition needs a number to start from.
    this.el.style.height = `${this.el.offsetHeight}px`;
    void this.el.offsetHeight;
    this.el.style.height = '0px';
    this.el.addClass('is-closing');
    this.later(LEAVE_MS, () => {
      if (!this.el.hasClass('is-closing')) return;
      this.el.hidden = true;
      this.el.style.removeProperty('height');
    });
  }

  private render(): void {
    const lines = [...this.lines.values()];
    const staying = lines.filter((line) => !line.leaving);
    // Results waiting to be read, and always the running slot: the first task still running, or one just ended.
    const top = staying.find((line) => !line.result);
    const shown = staying.filter((line) => line.result || line === top);
    if (!shown.length) shown.push(...staying.slice(0, 1));
    const more = staying.length - shown.length;
    if (more <= 0) this.expanded = false;
    this.el.toggleClass('is-expanded', this.expanded);
    this.toggleEl.hidden = more <= 0;
    this.toggleEl.setAttr('aria-expanded', String(this.expanded));
    this.toggleEl.setAttr('aria-label', this.expanded ? 'Show fewer tasks' : 'Show all tasks');
    this.moreEl.setText(!this.expanded && more > 0 ? `+\u2009${more} ${more === 1 ? 'other' : 'others'}` : '');
    this.moreEl.setAttr('title', staying.filter((line) => !shown.includes(line)).map((line) => line.description).join('\n'));
    for (const line of lines) {
      const folded = line.leaving || (!this.expanded && !shown.includes(line));
      line.el.toggleClass('is-folded', folded);
      line.el.toggleClass('is-leaving', line.leaving);
      line.el.toggleAttribute('inert', folded);
      line.el.toggleClass('is-running', !line.done);
      line.el.toggleClass('is-done', line.done);
      line.stopEl.toggleAttribute('disabled', line.stopping);
      const note = line.result?.status === 'failed' ? 'Failed' : line.result?.status === 'stopped' ? 'Stopped' : line.stopFailed && !line.done ? 'Could not stop' : '';
      line.noteEl.setText(note);
      line.noteEl.toggleClass('is-pill', line.result !== undefined);
      if (line.done) {
        const took = line.took === undefined ? '' : formatElapsed(line.took);
        line.timeEl.setText(line.result?.status === 'completed' ? (took ? `Done in ${took}` : 'Done') : took);
      } else if (!line.stopping) {
        line.el.removeClass('is-stopping');
        line.timeEl.setText(formatElapsed(this.seconds(line)));
      } else if (!line.el.hasClass('is-stopping')) {
        // Built once, so the ticker does not restart the spinner every second.
        line.el.addClass('is-stopping');
        line.timeEl.empty();
        line.timeEl.createSpan({ text: 'Stopping' });
        setIcon(line.timeEl.createSpan({ cls: 'vicher-task-spinner' }), 'loader-circle');
      }
    }
  }

  private seconds(line: TaskLine): number {
    return Math.floor((Date.now() - line.since) / 1000);
  }

  private later(ms: number, run: () => void): void {
    const timer = window.setTimeout(() => {
      this.timers.delete(timer);
      run();
    }, ms);
    this.timers.add(timer);
  }

  private stopTicker(): void {
    if (this.ticker !== null) window.clearInterval(this.ticker);
    this.ticker = null;
  }
}
