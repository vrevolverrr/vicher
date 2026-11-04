import type { AgentAdapter, AgentEvent, AgentId, AgentQuestion, AgentSession, BackgroundTask, ModelOption, PermissionPolicy, QuestionAnswers, SkillOption, SkillSyntax, ToolApprovalRequest, TurnStatus } from '@/agents/types';
import { AGENT_IDS } from '@/agents/providers';
import type { ChatContext } from '@/context/ChatContext';
import { turnImages } from '@/context/ChatAttachment';
import { quoteOf } from '@/context/NoteContext';
import { turnText } from '@/context/turnText';
import type { ChatDefaults, ModelChoice } from '@/chat/ChatDefaults';
import { addPart, type AgentTurn, type AgentTurnStatus, type ChatRecord, type ChatTurn, type Rating, rateTurn, recordEvent, type ToolPart, type TourStep, turnTitle, type UserTurn } from '@/chat/ChatRecord';
import { ChatSession } from '@/chat/ChatSession';
import type { ChatStore } from '@/chat/ChatStore';
import { ReplyActions, type ShownPart } from '@/chat/ReplyActions';
import { messageOf } from '@/shared/messageOf';

/** Asked in the turn, not the system prompt: Codex's default model skips it far more often there. */
const TITLE_REQUEST = '<naming>After your answer, add a blank line and a last line @Title("<at most six words>") naming this conversation, for example @Title("Eigenvalues of symmetric matrices"). The app hides that line from the student.</naming>';

/** What the chat tells whoever draws it. */
export interface ChatEvents {
  /** Working, failed, the background tasks, the agent, its model or the permission policy changed. */
  changed(): void;
  /** The chat moved to another agent, whose session starts without the earlier messages. */
  switched(): void;
  /** The CLI no longer has this chat's conversation, so the agent starts without the earlier messages. */
  lost(): void;
  /** Something to show in the transcript. */
  notice(text: string): void;
  /** Something to show for a moment, outside the transcript. */
  warn(text: string): void;
}

/** What draws the chat's turns as they happen. Every call has already been filtered and recorded. */
export interface ChatView {
  /** A message was sent and waits for the agent to take it in. */
  pending(id: string, context: ChatContext): void;
  /** The agent took the message in; its turn is in the record. */
  user(id: string, turn: UserTurn): void;
  /** The message will never reach the agent. */
  dropped(id: string, error: string): void;
  agentStart(): void;
  appendText(delta: string): void;
  /** The agent pointed at text in a note; its line has just ended, and the step is already in the record. */
  act(step: TourStep): void;
  tool(part: ToolPart): void;
  thinking(): void;
  usage(used: number, window: number): void;
  notice(event: Extract<AgentEvent, { type: 'notice' }>): void;
  /** Asks the student; drops the question once `signal` aborts. The turn keeps streaming meanwhile. */
  approve(request: ToolApprovalRequest, signal: AbortSignal): Promise<boolean>;
  /** Like `approve`, for the agent's questions; undefined when the student declines. */
  ask(questions: readonly AgentQuestion[], signal: AbortSignal): Promise<QuestionAnswers | undefined>;
  /** The agent turn ended; `index` is its place in the record. */
  agentEnd(turn: AgentTurn, index: number): void;
  background(tasks: readonly BackgroundTask[]): void;
}

interface ChatDeps {
  /** Where a new chat starts: the app's agent and choices, which follow this chat's picks. */
  defaults: ChatDefaults;
  agents: Record<AgentId, AgentAdapter>;
  /** Each CLI's model list, read once per plugin load. */
  models: Record<AgentId, Promise<ModelOption[]>>;
  store: ChatStore;
  /** The vault folder the agent runs in. */
  cwd: string;
}

interface Outgoing {
  context: ChatContext;
  resolve: (turns: AgentTurn[]) => void;
  reject: (error: Error) => void;
  /** Hands the message to a session. */
  deliver: (id: string) => Promise<void>;
  /** Handed to a session, so the chat is not idle until the agent takes it in or drops it. */
  passed: boolean;
}

/** The agent turn being written. */
interface OpenTurn {
  turn: AgentTurn;
  filter: ReplyActions;
  /** The chat's first agent turn, whose `@Title` line names the chat. */
  first: boolean;
  written?: string;
}

/** One chat: its record, its agent session and its turns, built from the session's events. It is the only writer of the record. */
export class Chat {
  private chat: ChatRecord;
  private choices: Record<AgentId, ModelChoice>;
  private session!: ChatSession;
  /** The agent this chat talks to; the defaults' agent is only where a new chat starts. */
  private current: AgentId;
  /** The session the last message went to: what Stop and a task's stop act on. */
  private target: AgentSession | null = null;
  /** The agent session of the chat's own session, once open. */
  private liveSession: AgentSession | null = null;
  private view: ChatView | null = null;
  /** Sent messages the agent has not taken in yet, in send order. */
  private readonly outgoing = new Map<string, Outgoing>();
  /** Taken in; each resolves at the next idle with the agent turns after its own. */
  private answered: { index: number; resolve: (turns: AgentTurn[]) => void }[] = [];
  /** Messages kept from the session while it is being replaced. */
  private held: string[] = [];
  /** Hands messages to the session one at a time, so they reach it in send order. */
  private outbox: Promise<void> = Promise.resolve();
  private writingTurn: OpenTurn | null = null;
  /** A CLI turn is running. */
  private cliTurn = false;
  /** The message the agent last took in; a highlight that names no note points at its note. */
  private context: ChatContext | undefined;
  private tasks: readonly BackgroundTask[] = [];
  private titleAsked: boolean;
  private idleWaiters: (() => void)[] = [];
  private settleWaiters: (() => void)[] = [];
  private holding = 0;
  /** The last save; the store writes one at a time, so it ends after every earlier one. */
  private saving: Promise<void> = Promise.resolve();
  /** Reading the title of the chat's first reply. */
  private titling: Promise<void> = Promise.resolve();
  private restartAtIdle = false;
  private switching = false;
  private closed = false;
  private hasFailed = false;

  constructor(record: ChatRecord, private readonly deps: ChatDeps, private readonly events: ChatEvents) {
    const { defaults } = deps;
    this.chat = record;
    this.current = record.agent;
    this.titleAsked = record.turns.length > 0;
    this.choices = Object.fromEntries(AGENT_IDS.map((id) => [
      id, id === record.agent ? record.choice ?? defaults.choice(id) : defaults.choice(id),
    ])) as Record<AgentId, ModelChoice>;
  }

  /** The latest record, including turns that ended while no one was looking. */
  get record(): ChatRecord { return this.chat; }
  get turns(): readonly ChatTurn[] { return this.chat.turns; }
  /** Messages sent and not yet taken in, in send order. */
  get pending(): readonly ChatContext[] { return [...this.outgoing.values()].map(({ context }) => context); }
  get background(): readonly BackgroundTask[] { return this.tasks; }
  get agent(): AgentId { return this.current; }
  /** A CLI turn runs, or a message is on its way to the agent. */
  get running(): boolean { return !this.idle; }
  get failed(): boolean { return this.hasFailed; }
  get permissionPolicy(): PermissionPolicy { return this.chat.permissionPolicy ?? 'inherit'; }
  get skillSyntax(): SkillSyntax { return this.deps.agents[this.current].skillSyntax; }

  models(agent: AgentId): Promise<ModelOption[]> { return this.deps.models[agent]; }
  choice(agent: AgentId): ModelChoice { return this.choices[agent]; }
  skills(): Promise<SkillOption[]> { return this.session.skills(); }

  /** Opens the session, resuming the saved conversation, and moves a saved model to its newest version. */
  open(): void {
    void this.replaceSession(this.current, this.chat.sessionId);
    void this.upgradeChoice();
  }

  /** Attaches the one view; attaching another detaches the first. Returns the detach. */
  attach(view: ChatView): () => void {
    this.view = view;
    return () => {
      if (this.view === view) this.view = null;
    };
  }

  /**
   * Sends one message. Resolves when the chat is idle, with the agent turns between this message and the next one.
   * Rejects when the message is dropped or the chat is closed.
   */
  send(context: ChatContext): Promise<AgentTurn[]> {
    return this.enqueue(context, async (id) => {
      const session = await this.session.open();
      const agent = this.deps.agents[this.current];
      const text = await turnText(context, { skillSyntax: agent.skillSyntax, fileMention: agent.fileMention, root: this.deps.cwd });
      const asked = !this.titleAsked && !session.title;
      this.titleAsked = true;
      this.target = session;
      this.chat = { ...this.chat, sessionId: session.id };
      session.send({ id, text: asked ? `${text}\n\n${TITLE_REQUEST}` : text, images: turnImages(context.attachments, this.deps.cwd) });
    });
  }

  /** Sends `context` to a session the caller made, whose events the chat records as it does its own session's. */
  play(context: ChatContext, session: AgentSession): Promise<AgentTurn[]> {
    return this.enqueue(context, async (id) => {
      const unsubscribe = session.subscribe((event) => this.receive(event, undefined));
      void this.whenSettled().then(unsubscribe);
      this.target = session;
      session.send({ id, text: context.message });
    });
  }

  /** Resolves when no CLI turn runs, no message is pending and no background task runs. */
  settled(): Promise<void> {
    return this.whenSettled();
  }

  /** Ends the running CLI turn, with any message already taken into it. Pending messages still run; background tasks keep running. */
  stop(): void { this.target?.interrupt(); }

  async stopTask(id: string): Promise<void> {
    await this.target?.stopTask(id);
  }

  /** Saves the choice. The same agent takes it from its next turn; another agent gets a new session, without the old conversation, once the chat is idle. */
  async choose(agent: AgentId, choice: ModelChoice): Promise<void> {
    if (this.closed || this.switching) return;
    this.choices = { ...this.choices, [agent]: choice };
    await this.changing(async () => {
      await this.deps.defaults.setChoice(agent, choice);
      if (this.closed) return;
      if (agent === this.current) return this.apply(choice);
      await this.whileHolding(async () => {
        await this.deps.defaults.setAgent(agent);
        if (this.closed) return;
        this.current = agent;
        this.chat = { ...this.chat, agent, choice, sessionId: undefined };
        this.events.switched();
        this.events.changed();
        const closed = this.replaceSession(agent);
        await this.saveIfKept();
        void this.upgradeChoice();
        await closed;
      });
    });
  }

  /** Starting a new process restores native settings when returning to Inherit, including Codex's sandbox. */
  async choosePermission(permissionPolicy: PermissionPolicy): Promise<void> {
    if (this.closed || this.switching || permissionPolicy === this.permissionPolicy) return;
    this.chat = { ...this.chat, permissionPolicy };
    this.events.changed();
    try {
      const restarted = this.restart();
      await this.saveIfKept();
      await restarted;
    } catch (error) {
      this.events.warn(`Could not change the permission policy: ${messageOf(error)}`);
    }
  }

  async rate(index: number, rating: Rating | undefined): Promise<void> {
    if (this.chat.turns[index]?.role !== 'agent') return;
    const next = rateTurn(this.chat, index, rating);
    this.chat = next;
    try {
      await this.deps.store.save(next);
    } catch (error) {
      this.events.warn(`Could not save this rating: ${messageOf(error)}`);
    }
  }

  /**
   * Opens a new session, so the agent starts with the settings now in force, and resumes this chat's conversation in it.
   * It waits until the chat is idle, not for background tasks, which end with the old process.
   */
  async restart(): Promise<void> {
    if (this.closed || !this.session) return;
    await this.whileHolding(() => this.replaceSession(this.current, this.chat.sessionId));
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    const error = new Error('The chat is closed');
    for (const { reject } of this.outgoing.values()) reject(error);
    this.outgoing.clear();
    this.held = [];
    // The closed session emits nothing more, so the turn it was running ends here, shown even with no output.
    if (this.writingTurn || this.cliTurn) {
      this.startTurn(this.session?.promptId);
      this.closeTurn('interrupted');
    }
    this.cliTurn = false;
    this.checkIdle();
    await this.outbox;
    await this.titling;
    await this.saving;
    await this.session?.close();
  }

  private enqueue(context: ChatContext, deliver: (id: string) => Promise<void>): Promise<AgentTurn[]> {
    if (this.closed) return Promise.reject(new Error('The chat is closed'));
    const id = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      this.outgoing.set(id, { context, resolve, reject, deliver, passed: false });
      this.hasFailed = false;
      this.view?.pending(id, context);
      this.held.push(id);
      this.flush();
      this.events.changed();
    });
  }

  /** Hands held messages to the session, unless it is being replaced. */
  private flush(): void {
    if (this.holding) return;
    const ids = this.held;
    this.held = [];
    for (const id of ids) {
      const entry = this.outgoing.get(id);
      if (!entry) continue;
      entry.passed = true;
      this.outbox = this.outbox.then(() => entry.deliver(id)).catch((error: unknown) => {
        this.hasFailed = true;
        this.events.notice(`Could not send this message: ${messageOf(error)}`);
        this.receive({ type: 'dropped', ids: [id], error: messageOf(error) }, undefined);
      });
    }
  }

  /** Records one of the session's events; `prompt` names the system prompt the session runs under. */
  private receive(event: AgentEvent, prompt: string | undefined): void {
    if (this.closed) return;
    const before = this.status();
    switch (event.type) {
      case 'user':
        this.taken(event.id);
        break;
      case 'dropped':
        for (const id of event.ids) {
          const entry = this.outgoing.get(id);
          if (!entry) continue;
          this.outgoing.delete(id);
          entry.reject(new Error(event.error));
          this.view?.dropped(id, event.error);
        }
        break;
      case 'text': {
        const open = this.writing(prompt);
        this.show(open, open.filter.push(event.delta));
        break;
      }
      case 'tool': {
        const open = this.writing(prompt);
        open.turn = recordEvent(open.turn, event);
        this.view?.tool(event);
        break;
      }
      case 'thinking':
        this.writing(prompt);
        this.view?.thinking();
        break;
      case 'approval': {
        this.writing(prompt);
        const asked = this.view?.approve(event.request, event.signal) ?? Promise.resolve(false);
        void asked.then(event.answer, () => event.answer(false));
        break;
      }
      case 'question': {
        this.writing(prompt);
        const asked = this.view?.ask(event.questions, event.signal) ?? Promise.resolve(undefined);
        void asked.then(event.answer, () => event.answer(undefined));
        break;
      }
      case 'usage':
        this.view?.usage(event.used, event.window);
        break;
      case 'notice':
        this.view?.notice(event);
        break;
      case 'done':
        this.cliTurn = false;
        // Diagnosis only: kept out of the saved chat and the reply, which show the short error.
        if (event.detail) console.error(`Vicher: ${event.error ?? 'the agent failed'}\n${event.detail}`);
        if (this.writingTurn || event.status !== 'completed') {
          this.startTurn(prompt);
          this.closeTurn(event.status, event.error);
        }
        if (event.status === 'failed') {
          this.hasFailed = true;
          // The CLI may have died with the turn; a new process resumes the conversation, and costs one start if it had not.
          this.restartAtIdle = true;
        }
        break;
      case 'background':
        this.tasks = event.tasks;
        this.view?.background(event.tasks);
        break;
    }
    this.checkIdle();
    if (this.status() !== before) this.events.changed();
  }

  /** What `changed` reports on. */
  private status(): string {
    return `${this.running} ${this.hasFailed} ${this.tasks.map(({ id }) => id).join()}`;
  }

  /** The agent took message `id` in: the turn before it, if any, was steered, and the message joins the record. */
  private taken(id: string): void {
    const entry = this.outgoing.get(id);
    if (!entry) return;
    if (this.writingTurn) this.closeTurn('steered');
    this.outgoing.delete(id);
    const { context } = entry;
    const turn: UserTurn = {
      role: 'user',
      message: context.message,
      ...(quoteOf(context.selection) ? { quote: quoteOf(context.selection) } : {}),
      ...(context.attachments.length ? { attachments: [...context.attachments] } : {}),
      at: Date.now(),
    };
    const first = !this.chat.turns.length;
    this.commit({
      ...this.chat,
      choice: this.choices[this.current],
      title: first ? turnTitle(turn) : this.chat.title,
      turns: [...this.chat.turns, turn],
    });
    this.answered.push({ index: this.chat.turns.length - 1, resolve: entry.resolve });
    this.cliTurn = true;
    this.context = context;
    this.view?.user(id, turn);
  }

  /** The agent turn being written, opened if none is: the agent is writing, so a CLI turn runs. */
  private writing(prompt: string | undefined): OpenTurn {
    this.cliTurn = true;
    return this.startTurn(prompt);
  }

  private startTurn(prompt: string | undefined): OpenTurn {
    if (!this.writingTurn) {
      const first = !this.chat.turns.some((turn) => turn.role === 'agent');
      this.writingTurn = { turn: { role: 'agent', parts: [], status: 'interrupted', at: 0, ...(prompt ? { prompt } : {}) }, filter: new ReplyActions(), first };
      this.view?.agentStart();
    }
    return this.writingTurn;
  }

  private show(open: OpenTurn, parts: ShownPart[]): void {
    for (const part of parts) {
      if ('text' in part) {
        open.turn = recordEvent(open.turn, { type: 'text', delta: part.text });
        this.view?.appendText(part.text);
      } else if (part.action.name === 'Title') {
        if (open.first) open.written ??= part.action.params.text;
      } else {
        const path = part.action.params.path ?? this.context?.note?.path;
        // A highlight with no note to point at has nowhere to go.
        if (!path) continue;
        const step: TourStep = { ...part.action.params, path };
        open.turn = addPart(open.turn, { type: 'highlight', step });
        this.view?.act(step);
      }
    }
  }

  private closeTurn(status: AgentTurnStatus | TurnStatus, error?: string): void {
    const open = this.writingTurn!;
    this.show(open, open.filter.flush());
    this.writingTurn = null;
    const turn: AgentTurn = { ...open.turn, status, ...(error ? { error } : {}), at: Date.now() };
    this.commit({ ...this.chat, turns: [...this.chat.turns, turn] });
    this.view?.agentEnd(turn, this.chat.turns.length - 1);
    if (open.first) this.titling = this.retitle(open.written);
  }

  /** The chat's first reply names it: the agent's own title if its CLI names conversations, else the one it was asked to write. */
  private async retitle(written: string | undefined): Promise<void> {
    const title = (await this.liveSession?.title?.().catch(() => undefined)) ?? written;
    if (!title || title === this.chat.title) return;
    this.commit({ ...this.chat, title });
  }

  /** Replaces the record and saves it, so a restart can show it and the agent can resume it. */
  private commit(next: ChatRecord): void {
    this.chat = { ...next, updatedAt: Date.now() };
    const saved = this.chat;
    this.saving = this.deps.store.save(saved).catch((error: unknown) => this.events.warn(`Could not save this chat: ${messageOf(error)}`));
  }

  /** No CLI turn runs and no message is on its way to the agent; messages held for a new session do not count. */
  private get idle(): boolean {
    return !this.cliTurn && ![...this.outgoing.values()].some(({ passed }) => passed);
  }

  private checkIdle(): void {
    if (!this.idle) return;
    const answered = this.answered;
    this.answered = [];
    for (const { index, resolve } of answered) {
      const after = this.chat.turns.slice(index + 1);
      const next = after.findIndex((turn) => turn.role === 'user');
      resolve((next < 0 ? after : after.slice(0, next)).filter((turn): turn is AgentTurn => turn.role === 'agent'));
    }
    const idle = this.idleWaiters;
    this.idleWaiters = [];
    for (const wake of idle) wake();
    if (this.restartAtIdle && !this.closed) {
      this.restartAtIdle = false;
      void this.restart();
    }
    if (this.tasks.length && !this.closed) return;
    const settled = this.settleWaiters;
    this.settleWaiters = [];
    for (const wake of settled) wake();
  }

  private whenIdle(): Promise<void> {
    return this.idle || this.closed ? Promise.resolve() : new Promise((resolve) => this.idleWaiters.push(resolve));
  }

  private whenSettled(): Promise<void> {
    return (this.idle && !this.tasks.length) || this.closed ? Promise.resolve() : new Promise((resolve) => this.settleWaiters.push(resolve));
  }

  /** Keeps new messages from the session until it is idle and `work` has run, then hands them to the session now in place. */
  private async whileHolding(work: () => Promise<void>): Promise<void> {
    this.holding++;
    try {
      await this.whenIdle();
      await work();
    } finally {
      this.holding--;
      if (!this.holding && !this.closed) this.flush();
    }
  }

  /** Opens a session for `agent`, resuming `resume`, and closes the old one. The returned promise ends when the old one is closed. */
  private replaceSession(agent: AgentId, resume?: string): Promise<void> {
    const previous = this.session as ChatSession | undefined;
    // A restart waiting for idle is moot: the new session starts with the settings now in force.
    this.restartAtIdle = false;
    this.liveSession = null;
    this.target = null;
    const session: ChatSession = new ChatSession(this.deps.agents[agent], () => this.choice(agent), {
      cwd: this.deps.cwd,
      resume,
      permissionPolicy: this.permissionPolicy,
      onLost: () => {
        if (!this.closed && this.session === session) this.events.lost();
      },
      onOpen: (opened) => {
        if (this.session !== session) return;
        this.liveSession = opened;
        opened.subscribe((event) => {
          if (this.session === session) this.receive(event, session.promptId);
        });
      },
    });
    this.session = session;
    if (this.tasks.length) {
      // The old process takes its tasks with it.
      this.tasks = [];
      this.view?.background([]);
    }
    void session.open().catch((error: unknown) => {
      if (!this.closed && this.session === session) {
        this.hasFailed = true;
        this.events.notice(`Could not open the agent: ${messageOf(error)}`);
        this.events.changed();
      }
    });
    return previous?.close() ?? Promise.resolve();
  }
  /** Moves a saved model to the newest version of its family once the CLI's list arrives. */
  private async upgradeChoice(): Promise<void> {
    const agent = this.current;
    const choice = this.choices[agent];
    const latest = (await this.models(agent)).find((option) => option.name === choice.name);
    // A pick made while the list loaded wins over the upgrade.
    if (!latest || latest.id === choice.model || this.choices[agent] !== choice) return;
    if (this.closed || this.switching || agent !== this.current) return;
    const next = { ...choice, model: latest.id };
    await this.changing(async () => {
      // Opening a chat is not a pick: the default moves only when it held the same old model.
      if (this.deps.defaults.choice(agent).model === choice.model) await this.deps.defaults.setChoice(agent, next);
      if (this.closed) return;
      await this.apply(next);
    });
  }

  /** The chat's agent takes `choice` from its next turn. */
  private async apply(choice: ModelChoice): Promise<void> {
    this.choices = { ...this.choices, [this.current]: choice };
    this.chat = { ...this.chat, choice };
    this.events.changed();
    await this.session.setModel(choice);
    if (this.closed) return;
    await this.saveIfKept();
  }

  /** An empty chat is not saved yet; its first turn saves what it holds. */
  private async saveIfKept(): Promise<void> {
    if (this.chat.turns.length) await this.deps.store.save(this.chat);
  }

  /** One change of agent or model at a time; a failure is shown, not thrown. */
  private async changing(work: () => Promise<void>): Promise<void> {
    this.switching = true;
    try {
      await work();
    } catch (error) {
      this.events.warn(`Could not switch the model: ${messageOf(error)}`);
    } finally { this.switching = false; }
  }
}
