import type { App } from 'obsidian';
import { Component, finishRenderMath, Notice, renderMath, setIcon } from 'obsidian';
import { mount, unmount } from 'svelte';

import type { AgentSession } from '@/agents/types';
import { PROVIDERS } from '@/agents/providers';
import { Composer } from '@/chat/obsidian/Composer';
import { openQuote } from '@/chat/obsidian/openQuote';
import ReplyView from '@/chat/view/ReplyView.svelte';
import type { ReplyFeedback } from '@/chat/view/ReplyFeedback';
import type { MarkdownTarget } from '@/chat/view/TextBlock';
import { appendMessageText } from '@/chat/view/appendMessageText';
import type { ChatContext } from '@/context/ChatContext';
import { type NoteQuote, quoteOf } from '@/context/NoteContext';
import type { Chat, ChatEvents, ChatView } from '@/chat/Chat';
import type { AgentTurn, Rating, UserTurn } from '@/chat/ChatRecord';
import { usesStoredFile } from '@/chat/ChatRecord';
import TaskRow from '@/chat/view/TaskRow.svelte';
import ToolGroup from '@/chat/view/ToolGroup.svelte';
import { type ChatAttachment, isMention, mentionPaths, type StoredAttachment } from '@/context/ChatAttachment';
import type { VaultAttachments } from '@/attachments/obsidian/VaultAttachments';
import type { VaultFileIndex } from '@/attachments/obsidian/VaultFileIndex';
import Approvals from '@/chat/view/Approvals.svelte';
import { type AfterRender, MarkdownContentRenderer } from '@/renderer/markdown/obsidian/MarkdownContentRenderer';
import { renderMermaidDiagrams } from '@/renderer/mermaid/obsidian/mermaidDiagrams';
import type { HighlightTour, TourEvent } from '@/tour/HighlightTour';
import type { WalkthroughHost } from '@/tour/view/WalkthroughHost';
import { messageOf } from '@/shared/messageOf';
import { copyRefused } from '@/shared/obsidian/copyRefused';

const PIN_MS = 1500;
// The quote clamps to a few lines, so a long selection needs no more text in the page than this.
const QUOTE_PREVIEW_LENGTH = 400;
const MENTION_LIMIT = 8;

export interface ChatHost {
  readonly files: VaultFileIndex;
  readonly images: VaultAttachments;
  /** Walks the student through the agent's highlights; a new message ends the walk and takes its marks away. */
  readonly tour: HighlightTour;
  active(): boolean;
  changed(): void;
}

/** One chat in one tab. Its id is the tab's state, so Obsidian restores each tab to its own chat. */
export class ChatPane extends Component {
  private messagesEl!: HTMLElement;
  private composer!: Composer;
  private approvals!: ReturnType<typeof Approvals>;
  private tasks!: ReturnType<typeof TaskRow>;
  /** Bubbles of messages sent and not yet taken in, by message id. Only one that waits behind other work says "Queued". */
  private readonly queued = new Map<string, { turnEl: HTMLElement; labelEl?: HTMLElement; message: string }>();
  /**
   * A working line at the end of the chat while the agent has work and no reply is open, such as between a send and
   * the agent taking the message in, which Claude reports only as it starts writing.
   */
  private waiting: { el: HTMLElement; group: ReturnType<typeof ToolGroup> } | null = null;
  /** The element of the message the agent took in last; its replies go in it. */
  private turnEl: HTMLElement | null = null;
  /** The reply being written. */
  private reply: { el: HTMLElement; view: ReturnType<typeof ReplyView> } | null = null;
  /** The reply that ended and is not settled yet: a figure repair may still change it. */
  private ending: ReturnType<typeof ReplyView> | null = null;
  private detach: (() => void) | null = null;
  private markdown!: MarkdownContentRenderer;
  /** What replies draw through: Markdown, plus Mermaid diagrams where a reply asks for them. */
  private replyMarkdown!: MarkdownTarget;
  private closed = false;
  private closing: Promise<void> | null = null;
  private displayed = false;
  unread = false;
  private unpin: (() => void) | null = null;
  private sourcePath = '';
  /** The walkthroughs in the pane, told which stop is on screen; emptied when the pane's turns are. */
  private readonly walkers = new Set<(event: TourEvent) => void>();
  private readonly replies = new Map<HTMLElement, ReturnType<typeof ReplyView>>();
  private stopTour: (() => void) | null = null;
  readonly chat: Chat;
  private readonly walkthrough: WalkthroughHost = {
    pick: (steps, index) => this.host.tour.playFrom(steps, index),
    watch: (listener) => void this.walkers.add(listener),
  };
  constructor(
    readonly app: App,
    readonly contentEl: HTMLElement,
    private readonly host: ChatHost,
    createChat: (events: ChatEvents) => Chat,
  ) {
    super();
    this.chat = createChat({
      changed: () => {
        if (this.closed) return;
        this.composer.updateLabels();
        this.composer.setStreaming(this.chat.running);
        this.syncWaiting();
        this.refreshTab();
      },
      switched: () => {
        if (this.closed) return;
        this.composer.closeMenus();
        if (this.chat.turns.length) this.addNotice(`Switched to ${PROVIDERS[this.chat.agent].name}. It does not see the earlier messages.`);
        this.composer.meter.clear();
        this.composer.refresh();
      },
      lost: () => this.addNotice('The agent no longer has this conversation, so it starts without the earlier messages.'),
      notice: (text) => this.addNotice(text),
      warn: (text) => new Notice(text),
    });
  }

  onload(): void {
    const root = this.contentEl;
    root.empty();
    this.stopTour = this.host.tour.subscribe((event) => {
      if (this.host.active()) this.walkers.forEach((listener) => listener(event));
    });
    this.messagesEl = root.createDiv({ cls: 'vicher-messages' });
    const markdown = new MarkdownContentRenderer(this.app, this, () => this.sourcePath);
    const diagrams: AfterRender = (el, isCurrent, scope) => renderMermaidDiagrams(this.app, el, isCurrent, scope);
    this.markdown = markdown;
    this.replyMarkdown = {
      render: (el, text, options) => markdown.render(el, text, options?.diagrams ? diagrams : undefined),
      release: (container) => markdown.release(container),
      renderMath,
      finishRenderMath,
    };
    this.registerDomEvent(this.messagesEl, 'click', (event) => this.openInternalLink(event));
    this.tasks = mount(TaskRow, {
      target: root,
      props: {
        agent: () => this.chat.agent,
        stop: (id: string) => this.chat.stopTask(id).catch((error: unknown) => {
          new Notice(`Could not stop this task: ${messageOf(error)}`);
          throw error;
        }),
      },
    });
    this.approvals = mount(Approvals, { target: root, props: { changed: () => this.refreshTab() } });
    const composerArea = root.createDiv({ cls: 'vicher-chat-composer-area' });
    this.composer = new Composer(this, composerArea, {
      mentions: (query) => this.host.files.find(query, MENTION_LIMIT),
      send: () => this.send(),
      stop: () => this.chat.stop(),
      saveImage: (file) => this.host.images.save(this.chat.record.id, file, file.name || 'image'),
      imageUrl: (image) => this.host.images.url(image),
      savePaste: (text) => this.host.images.savePaste(this.chat.record.id, text),
      discardStored: (attachment) => this.discardStored(attachment),
    }, this.chat);
    for (const [index, turn] of this.chat.turns.entries()) {
      if (turn.role === 'user') this.addUser(turn);
      else this.replayReply(turn, index);
    }
    this.detach = this.chat.attach(this.chatView());
    this.chat.open();
  }

  get waitingForApproval(): boolean { return this.approvals.size() > 0; }

  activate(active: boolean): void {
    this.contentEl.hidden = !active;
    this.composer.close();
    if (active) {
      this.unread = false;
      this.composer.document.activate();
      if (!this.displayed) { this.displayed = true; this.pinToEnd(); }
    } else this.unpin?.();
  }

  focus(): void {
    this.composer.focus();
  }

  /**
   * Keeps the transcript at its end while a restored chat finishes drawing (Markdown and diagrams grow it after the
   * replay), until the student scrolls or a moment passes.
   */
  private pinToEnd(): void {
    this.unpin?.();
    const observer = new (this.messagesEl.ownerDocument.defaultView!.ResizeObserver)(() => (this.messagesEl.scrollTop = this.messagesEl.scrollHeight));
    for (const turn of Array.from(this.messagesEl.children)) observer.observe(turn);
    const timer = window.setTimeout(() => this.unpin?.(), PIN_MS);
    const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
    const stop = (): void => {
      observer.disconnect();
      window.clearTimeout(timer);
      for (const name of events) this.messagesEl.removeEventListener(name, stop);
      this.unpin = null;
    };
    for (const name of events) this.messagesEl.addEventListener(name, stop, { passive: true });
    this.unpin = stop;
  }

  private refreshTab(): void {
    if (!this.closed) this.host.changed();
  }

  private addNotice(text: string): void {
    this.messagesEl.createDiv({ cls: 'vicher-reply-status vicher-notice', text });
  }

  close(): Promise<void> {
    return this.closing ??= this.dispose();
  }

  private async dispose(): Promise<void> {
    this.closed = true;
    this.detach?.();
    const closing = this.chat.close();
    this.stopTour?.();
    this.walkers.clear();
    this.unpin?.();
    this.composer.dispose();
    void unmount(this.tasks);
    void unmount(this.approvals);
    await closing;
    for (const reply of this.replies.values()) void unmount(reply);
    this.replies.clear();
    if (this.waiting) void unmount(this.waiting.group);
    this.waiting = null;
    this.markdown.dispose();
  }

  /** Sends `message` as the student's next message, for a visual that writes one (a quiz answer). False once the chat is closed. */
  private ask(message: string): boolean {
    if (this.closed) return false;
    const { note } = this.composer.document.read();
    this.run({ message, attachments: [], ...(note ? { note } : {}) });
    return true;
  }

  private send(): void {
    if ((!this.composer.message && !this.composer.hasAttachments) || this.closed) return;
    const message = this.composer.message;
    this.run({ message, attachments: this.composer.take(), ...this.composer.document.read() });
  }

  /** Sends one message; the chat draws it through the view as the agent takes it in and answers. */
  private run(context: ChatContext): void {
    const { document } = this.composer;
    this.sourcePath = document.path;
    if (context.selection) document.sent(context.selection);
    // A dropped message is drawn as not sent; nothing else waits on it.
    this.chat.send(context).catch(() => undefined);
  }

  /** What the chat draws on: bubbles, the reply being written, the tour, the context meter, the task row. */
  private chatView(): ChatView {
    const reply = (): ReturnType<typeof ReplyView> => {
      if (!this.reply) this.openReply();
      return this.reply!.view;
    };
    return {
      pending: (id, context, queued) => {
        const turnEl = this.drawUser(context.message, quoteOf(context.selection), context.attachments);
        // It rises in once; a CSS animation would play again each time the tab is shown.
        turnEl.addClass('is-sent');
        turnEl.addEventListener('animationend', () => turnEl.removeClass('is-sent'), { once: true });
        const labelEl = queued ? turnEl.createDiv({ cls: 'vicher-user-label', text: 'Queued' }) : undefined;
        this.queued.set(id, { turnEl, labelEl, message: context.message });
        this.syncWaiting();
        this.messagesEl.scrollTo({ top: turnEl.offsetTop, behavior: 'smooth' });
        if (this.host.active()) this.host.tour.reset();
      },
      user: (id) => {
        const queued = this.queued.get(id);
        this.queued.delete(id);
        if (!queued) return;
        queued.labelEl?.remove();
        // Bubbles still queued stay below the one taken in, so they keep their send order.
        const next = this.firstQueued();
        if (next && next.compareDocumentPosition(queued.turnEl) & Node.DOCUMENT_POSITION_FOLLOWING) this.messagesEl.insertBefore(queued.turnEl, next);
        this.turnEl = queued.turnEl;
        this.syncWaiting();
      },
      dropped: (id, error, stopped) => {
        const queued = this.queued.get(id);
        this.queued.delete(id);
        if (!queued) return;
        if (stopped) {
          new Notice(error);
          queued.turnEl.remove();
        } else {
          const labelEl = queued.labelEl ?? queued.turnEl.createDiv({ cls: 'vicher-user-label' });
          labelEl.setText(`Not sent: ${error}`);
          labelEl.addClass('is-error');
        }
        this.composer.restore(queued.message);
        this.syncWaiting();
      },
      agentStart: () => this.openReply(),
      appendText: (delta) => reply().appendText(delta),
      tool: (part) => (this.reply?.view ?? this.ending ?? reply()).tool(part),
      thinking: () => reply().thinking(),
      notice: (event) => this.tasks.notice(event),
      usage: (used, window) => this.composer.meter.set(used, window),
      approve: (request, signal) => this.approvals.ask(request, signal),
      ask: (questions, signal) => this.approvals.askQuestions(questions, signal),
      act: (step) => {
        reply().highlight(step);
        if (this.host.active()) this.host.tour.add(step);
      },
      agentEnd: (turn, index, repairing) => {
        if (!this.reply) this.openReply();
        const { el, view } = this.reply!;
        this.reply = null;
        view.finish(turn.at, this.feedback(index), this.runText(el));
        if (repairing) this.ending = view;
        else view.settle();
        this.syncWaiting();
        this.showStatus(el, turn);
        this.unread = !this.host.active();
        this.refreshTab();
      },
      failures: () => this.ending!.failures(),
      repair: (fixes) => this.ending!.repair(fixes),
      settle: () => {
        this.ending?.settle();
        this.ending = null;
        this.syncWaiting();
      },
      background: (tasks) => this.tasks.set(tasks),
    };
  }

  private firstQueued(): HTMLElement | undefined {
    return [...this.queued.values()].map(({ turnEl }) => turnEl).find((el) => el.isConnected);
  }

  /** Starts a reply below the message it follows, above any message still queued. */
  private openReply(): HTMLElement {
    let turnEl = this.turnEl;
    if (!turnEl) {
      turnEl = this.turnEl = this.messagesEl.createDiv({ cls: 'vicher-turn' });
      this.messagesEl.insertBefore(turnEl, this.firstQueued() ?? null);
    }
    // The reply's own working line takes over from the one at the end of the chat in place, without easing in again.
    const { replyEl, reply } = this.addReply(turnEl, true, this.waiting !== null);
    this.reply = { el: replyEl, view: reply };
    this.syncWaiting();
    return replyEl;
  }

  /** Shows the working line at the end of the chat while the agent has work and no reply is open or settling. */
  private syncWaiting(): void {
    const show = this.chat.running && !this.reply && !this.ending;
    if (show && !this.waiting) {
      const el = this.messagesEl.createDiv({ cls: 'vicher-turn is-waiting' });
      const target = el.createDiv({ cls: 'vicher-reply markdown-rendered' });
      this.waiting = { el, group: mount(ToolGroup, { target, props: { rows: [], entering: true, startedAt: Date.now() } }) };
    } else if (!show && this.waiting) {
      void unmount(this.waiting.group);
      this.waiting.el.remove();
      this.waiting = null;
    }
    if (this.waiting) this.messagesEl.appendChild(this.waiting.el);
  }

  /**
   * Plays `session` as if the student had sent `message` with `notePath` open, and saves it. A way to show what a
   * reply looks like without an agent.
   */
  async playTurn(message: string, session: AgentSession, notePath: string): Promise<void> {
    if (this.closed) return;
    this.sourcePath = notePath;
    // A dropped message is drawn as not sent; nothing else waits on it.
    await this.chat.play({ message, attachments: [], note: { path: notePath } }, session).catch(() => undefined);
  }

  /** Deletes the file of an image taken off a message, unless an earlier message of the chat shows it too. */
  private discardStored(stored: StoredAttachment): void {
    if (usesStoredFile(this.chat.turns, stored.path)) return;
    void this.host.images.remove(stored.path).catch((error: unknown) => {
      new Notice(`Could not remove this attachment: ${messageOf(error)}`);
    });
  }

  /** Draws a message as its own turn at the end of the chat. */
  private drawUser(message: string, quote?: NoteQuote, attachments: readonly ChatAttachment[] = []): HTMLElement {
    const turnEl = this.messagesEl.createDiv({ cls: 'vicher-turn' });
    const chipped = attachments.filter((attachment) => !isMention(attachment));
    if (chipped.length) {
      const attachedEl = turnEl.createDiv({ cls: 'vicher-user-attachments' });
      for (const attachment of chipped) {
        if (attachment.kind === 'image') {
          attachedEl.createEl('img', { attr: { src: this.host.images.url(attachment), alt: attachment.name } });
          continue;
        }
        const fileEl = attachedEl.createDiv({ cls: 'vicher-context-chip', ...(attachment.kind === 'file' ? { attr: { title: attachment.path } } : {}) });
        setIcon(fileEl.createSpan({ cls: 'vicher-context-icon' }), 'file-text');
        fileEl.createSpan({ cls: 'vicher-context-label', text: attachment.name });
      }
    }
    if (quote) {
      const quoteEl = turnEl.createDiv({ cls: 'vicher-user-quote', text: quote.text.slice(0, QUOTE_PREVIEW_LENGTH), attr: { 'aria-label': quote.source === 'chat' ? 'Quoted chat text' : `Open ${quote.path}` } });
      if (quote.source !== 'chat') quoteEl.addEventListener('click', () => {
        openQuote(this.app, quote).catch((error: unknown) => new Notice(`Could not open ${quote.path}: ${messageOf(error)}`));
      });
    }
    if (message) {
      const bubble = turnEl.createDiv({ cls: 'vicher-user-message' });
      appendMessageText(bubble, message, { skill: this.chat.skillSyntax, mentions: mentionPaths(attachments), math: (source) => renderMath(source, false) });
      // Lets Obsidian finish the maths styles.
      if (bubble.querySelector('.math, mjx-container')) finishRenderMath().catch(() => undefined);
    }
    return turnEl;
  }

  /** Draws a stored message. */
  private addUser(turn: UserTurn): void {
    this.turnEl = this.drawUser(turn.message, turn.quote, turn.attachments);
  }

  /**
   * Adds a reply last under a message. An agent turn right after another, as Claude writes when a background task ends,
   * continues the same reply: only the last one keeps its time, copy and thumbs. `live` is true for a reply being
   * written, false for a saved one drawn again; `handover` is true when its working line replaces one already on screen.
   */
  private addReply(turnEl: HTMLElement, live: boolean, handover = false): { replyEl: HTMLElement; reply: ReturnType<typeof ReplyView> } {
    for (const earlier of turnEl.querySelectorAll(':scope > .vicher-reply')) earlier.addClass('is-continued');
    const replyEl = turnEl.createDiv({ cls: 'vicher-reply markdown-rendered' });
    const reply = mount(ReplyView, {
      target: replyEl,
      props: { markdown: this.replyMarkdown, walkthrough: this.walkthrough, ask: (message: string) => this.ask(message), copyRefused, live, handover },
    });
    this.replies.set(replyEl, reply);
    return { replyEl, reply };
  }

  /** What the copy button of the reply ending a run copies: the text of every reply under the same message. */
  private runText(replyEl: HTMLElement): () => string {
    return () => [...(replyEl.parentElement?.querySelectorAll<HTMLElement>(':scope > .vicher-reply') ?? [])]
      .map((el) => this.replies.get(el)?.text() ?? '').filter(Boolean).join('\n\n');
  }

  /** Draws a stored reply as it was drawn live. */
  private replayReply(turn: AgentTurn, index: number): void {
    if (!this.turnEl) this.turnEl = this.messagesEl.createDiv({ cls: 'vicher-turn' });
    const { replyEl, reply } = this.addReply(this.turnEl, false);
    for (const part of turn.parts) {
      if (part.type === 'text') reply.appendText(part.text);
      else if (part.type === 'highlight') reply.highlight(part.step);
      else reply.tool(part);
    }
    reply.finish(turn.at, this.feedback(index, turn.rating), this.runText(replyEl));
    reply.settle();
    this.showStatus(replyEl, turn);
  }

  /** The thumb pair for turn `index` of this chat: it starts at `rating` and saves each change to the chat's file. */
  private feedback(index: number, rating?: Rating): ReplyFeedback {
    return { rating, rate: (next) => void this.chat.rate(index, next) };
  }

  private showStatus(replyEl: HTMLElement, turn: AgentTurn): void {
    if (turn.status === 'interrupted') replyEl.createDiv({ cls: 'vicher-reply-status', text: 'Stopped.' });
    if (turn.status === 'failed') replyEl.createDiv({ cls: 'vicher-reply-error', text: turn.error ?? 'The agent failed.' });
  }

  private openInternalLink(event: MouseEvent): void {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a.internal-link');
    if (!link) return;
    event.preventDefault();
    void this.app.workspace.openLinkText(link.dataset.href ?? link.getAttribute('href') ?? '', this.sourcePath);
  }
}

