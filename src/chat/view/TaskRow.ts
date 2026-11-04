import type { AgentId, BackgroundTask } from '@/agents/types';
import { appendAgentIcon } from '@/chat/view/agentIcons';
import { formatElapsed } from '@/chat/view/ToolGroup';
import { createIconButton } from '@/shared/view/iconButtons';
import { setIcon } from '@/shared/view/icon';

/** How long a finished task shows its check before its line goes. */
const DONE_MS = 600;
/** The line's and the card's exit animations (`--vicher-task-duration`). */
const LEAVE_MS = 280;

interface TaskLine {
  description: string;
  el: HTMLElement;
  timeEl: HTMLElement;
  stopEl: HTMLElement;
  /** When the task first showed, for its elapsed time. */
  since: number;
  /** Stop was pressed; the task has not left yet. */
  stopping: boolean;
  /** The task left; its line shows a check, then goes. */
  done: boolean;
}

/**
 * The agent's background tasks while any run: a card above the chat tabs reading "N tasks running · 2m", which opens to
 * one line per task with its time and a stop button. A task that ends shows a check for a moment before its line goes.
 */
export class TaskRow {
  private readonly el: HTMLElement;
  private readonly summaryEl: HTMLElement;
  private readonly agentEl: HTMLElement;
  private readonly firstEl: HTMLElement;
  private readonly moreEl: HTMLElement;
  private readonly countEl: HTMLElement;
  private readonly timeEl: HTMLElement;
  private readonly chevronEl: HTMLElement;
  private readonly listEl: HTMLElement;
  private readonly lines = new Map<string, TaskLine>();
  private readonly timers = new Set<number>();
  private ticker: number | null = null;
  private expanded = false;

  /** `stop` rejects when the task could not be stopped, and its line then offers stop again. */
  constructor(parent: HTMLElement, private readonly agent: () => AgentId, private readonly stop: (id: string) => Promise<void>) {
    this.el = parent.createDiv({ cls: 'vicher-task-row' });
    this.el.hidden = true;
    this.summaryEl = this.el.createDiv({ cls: 'vicher-task-summary', attr: { role: 'button', tabindex: '0', 'aria-expanded': 'false' } });
    this.agentEl = this.summaryEl.createSpan({ cls: 'vicher-task-agent' });
    // Both headings stay in the same place; the card's state crossfades them. Collapsed names the first task, open counts them.
    const heading = this.summaryEl.createSpan({ cls: 'vicher-task-heading' });
    const collapsed = heading.createSpan({ cls: 'vicher-task-heading-collapsed' });
    this.firstEl = collapsed.createSpan({ cls: 'vicher-task-first' });
    this.moreEl = collapsed.createSpan({ cls: 'vicher-task-more' });
    this.countEl = heading.createSpan({ cls: 'vicher-task-heading-expanded vicher-task-count' });
    this.timeEl = this.summaryEl.createSpan({ cls: 'vicher-task-elapsed' });
    this.chevronEl = this.summaryEl.createSpan({ cls: 'vicher-task-chevron' });
    setIcon(this.chevronEl, 'chevron-down');
    // The list's wrapper animates its height between none and all of it.
    this.listEl = this.el.createDiv({ cls: 'vicher-task-drawer' }).createDiv({ cls: 'vicher-task-list' });
    const toggle = (): void => {
      this.expanded = !this.expanded;
      this.render();
    };
    this.summaryEl.addEventListener('click', toggle);
    this.summaryEl.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggle();
    });
  }

  set(tasks: readonly BackgroundTask[]): void {
    const now = Date.now();
    const live = new Set(tasks.map(({ id }) => id));
    for (const [id, line] of this.lines) if (!live.has(id) && !line.done) this.finish(id, line);
    for (const task of tasks) {
      const line = this.lines.get(task.id);
      if (line && !line.done) continue;
      line?.el.remove();
      this.lines.set(task.id, this.line(task, now));
    }
    if (tasks.length) this.open();
    this.render();
  }

  destroy(): void {
    this.stopTicker();
    for (const timer of this.timers) window.clearTimeout(timer);
    this.timers.clear();
  }

  private line(task: BackgroundTask, since: number): TaskLine {
    const el = this.listEl.createDiv({ cls: 'vicher-task' });
    el.createSpan({ cls: 'vicher-task-description', text: task.description, attr: { title: task.description } });
    // The time and the stop button share the line's end; the button takes the time's place on hover or focus.
    const end = el.createSpan({ cls: 'vicher-task-end' });
    const timeEl = end.createSpan({ cls: 'vicher-task-time' });
    const stopEl = createIconButton(end, 'circle-stop', `Stop ${task.description}`, 'vicher-task-stop');
    const line: TaskLine = { description: task.description, el, timeEl, stopEl, since, stopping: false, done: false };
    stopEl.addEventListener('click', () => {
      if (line.stopping || line.done) return;
      line.stopping = true;
      this.render();
      this.stop(task.id).catch(() => {
        line.stopping = false;
        this.render();
      });
    });
    return line;
  }

  /** The task left: a check for a moment, then the line collapses, and the card goes with the last one. */
  private finish(id: string, line: TaskLine): void {
    line.done = true;
    line.el.addClass('is-done');
    line.timeEl.empty();
    setIcon(line.timeEl, 'check');
    this.later(DONE_MS, () => {
      line.el.addClass('is-leaving');
      this.later(LEAVE_MS, () => {
        if (this.lines.get(id) !== line) return;
        line.el.remove();
        this.lines.delete(id);
        if (!this.lines.size) this.close();
        this.render();
      });
    });
  }

  private open(): void {
    this.el.removeClass('is-closing');
    this.el.style.removeProperty('height');
    this.el.hidden = false;
    this.agentEl.empty();
    appendAgentIcon(this.agentEl, this.agent());
    this.ticker ??= window.setInterval(() => this.render(), 1000);
  }

  /** Fades the card and shrinks it, gap included, so the transcript above grows smoothly instead of jumping. */
  private close(): void {
    this.stopTicker();
    // A height transition needs a number to start from.
    this.el.style.height = `${this.el.offsetHeight}px`;
    void this.el.offsetHeight;
    this.el.style.height = '0px';
    this.el.addClass('is-closing');
    this.later(LEAVE_MS, () => {
      if (this.lines.size) return;
      this.el.hidden = true;
      this.el.style.removeProperty('height');
    });
  }

  private render(): void {
    const now = Date.now();
    const running = [...this.lines.values()].filter((line) => !line.done);
    const others = running.length - 1;
    const count = running.length ? `${running.length} ${running.length === 1 ? 'task' : 'tasks'} running` : 'Tasks finished';
    const first = running[0]?.description ?? 'Tasks finished';
    this.firstEl.setText(first);
    this.firstEl.setAttr('title', first);
    this.moreEl.setText(others > 0 ? `+${others} ${others === 1 ? 'other' : 'others'}` : '');
    this.moreEl.setAttr('title', running.slice(1).map((line) => line.description).join('\n'));
    this.countEl.setText(count);
    const oldest = Math.min(...running.map((line) => line.since));
    this.timeEl.setText(running.length ? formatElapsed(Math.floor((now - oldest) / 1000)) : '');
    this.el.toggleClass('is-running', running.length > 0);
    this.el.toggleClass('is-expanded', this.expanded);
    this.summaryEl.setAttr('aria-expanded', String(this.expanded));
    this.listEl.toggleAttribute('inert', !this.expanded);
    for (const line of running) {
      line.stopEl.toggleAttribute('disabled', line.stopping);
      if (!line.stopping) {
        line.el.removeClass('is-stopping');
        line.timeEl.setText(formatElapsed(Math.floor((now - line.since) / 1000)));
      } else if (!line.el.hasClass('is-stopping')) {
        // Built once, so the ticker does not restart the spinner every second.
        line.el.addClass('is-stopping');
        line.timeEl.empty();
        line.timeEl.createSpan({ text: 'Stopping' });
        setIcon(line.timeEl.createSpan({ cls: 'vicher-task-spinner' }), 'loader-circle');
      }
    }
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
