import * as os from 'os';

import { ManagedStdioProcess } from '@/agents/process/ManagedStdioProcess';
import { Listeners } from '@/agents/shared/Listeners';
import { JSONRPCErrorResponse, JSONRPCTransport } from '@/agents/shared/JSONRPCTransport';
import { resolveCLI } from '@/agents/process/cliBinaryLocator';
import { cliEnv, getEnhancedPath } from '@/agents/process/env';
import { runProcessProbe } from '@/agents/process/processProbe';
import { type AgentAdapter, type AgentEvent, type AgentMessage, type AgentSession, type AgentSessionOptions, type AuthState, type BackgroundTask, ConversationNotFoundError, type Effort, type ModelOption, type SkillOption } from '@/agents/types';
import type { AgentApprovalContext } from '@/agents/adapters';

import { findCodexBinaryPath } from './CodexBinaryLocator';
import { CodexModelAdapter } from './CodexModelAdapter';
import { CodexToolAdapter } from './CodexToolAdapter';
import type {
  AgentMessageDeltaParams,
  DynamicToolCallParams,
  ErrorParams,
  ItemParams,
  ModelListResult,
  SkillsListResult,
  ThreadItem,
  ThreadStartResult,
  TokenUsageParams,
  TurnScopedParams,
  TurnStartResult,
} from './codexProtocol';
import { CODEX_APPROVAL_METHODS, CODEX_QUESTION_METHOD, CodexPermissionAdapter, type CodexApprovalRequest, type CodexPermissionSetup, type CodexQuestionRequest } from './CodexPermissionAdapter';

const APP_SERVER_ARGS = ['app-server', '--listen', 'stdio://'];
const CLIENT_INFO = { name: 'vicher', version: '0.0.1' };
const REQUEST_TIMEOUT_MS = 30_000;
/** How long a closed stdout waits for the process to close, so its last stderr reaches the error. */
const PROCESS_CLOSE_GRACE_MS = 3_000;
const STDERR_LIMIT = 8_192;
/** Only recent turns still send late notifications; older ids are dropped so a long chat does not grow the set. */
const RETIRED_TURN_LIMIT = 16;

export class CodexAgent implements AgentAdapter {
  readonly id = 'codex';
  readonly skillSyntax = { prefix: '$', atStart: false };
  readonly toolsOnResume = false;

  constructor(private readonly userEnv: () => Record<string, string> = () => ({})) {}

  async authState(cliPath?: string): Promise<AuthState> {
    const cli = await resolveCLI(cliPath, findCodexBinaryPath);
    if (!cli) return 'missing';
    // `codex login status` reports on stderr and exits non-zero when logged out.
    const output = await runProcessProbe({ command: cli, args: ['login', 'status'], cwd: os.homedir(), env: buildEnv(cli, this.userEnv()) });
    return output === null ? 'logged-out' : 'logged-in';
  }

  async models(cliPath?: string): Promise<ModelOption[]> {
    const cli = await resolveCLI(cliPath, findCodexBinaryPath);
    if (!cli) return [];
    const { proc, transport } = await startAppServer(cli, os.homedir(), this.userEnv());
    try {
      return await new CodexModelAdapter(
        (cursor) => transport.request<ModelListResult>('model/list', { cursor }),
        // Discovery runs in the home folder, so a vault's .codex/config.toml only changes the label, not the sessions.
        () => transport.request<ThreadStartResult>('thread/start', { cwd: os.homedir(), ephemeral: true }),
      ).listModels();
    } finally {
      transport.dispose();
      await proc.shutdown();
    }
  }

  async openSession(options: AgentSessionOptions): Promise<AgentSession> {
    const cli = await resolveCLI(options.cliPath, findCodexBinaryPath);
    if (!cli) throw new Error('Codex CLI not found. Install Codex or set its path.');
    return CodexSession.open(options, cli, this.userEnv());
  }
}

async function startAppServer(cli: string, cwd: string, userEnv: Record<string, string>): Promise<{ proc: ManagedStdioProcess; transport: JSONRPCTransport }> {
  const proc = new ManagedStdioProcess({ command: cli, args: APP_SERVER_ARGS, cwd, env: buildEnv(cli, userEnv), stderrBufferLimit: STDERR_LIMIT, stdio: ['pipe', 'pipe', 'pipe'] });
  proc.start();
  const transport = new JSONRPCTransport({
    input: proc.stdout,
    output: proc.stdin,
    onClose: (listener) => proc.onClose(() => listener(new Error('Codex exited'))),
  }, REQUEST_TIMEOUT_MS, { streamCloseGraceMs: PROCESS_CLOSE_GRACE_MS });
  try {
    await transport.request('initialize', { clientInfo: CLIENT_INFO, capabilities: { experimentalApi: true } });
    transport.notify('initialized');
    return { proc, transport };
  } catch (error) {
    transport.dispose();
    await proc.shutdown();
    throw openError(error, proc);
  }
}

/** A failed open is shown to the student as a notice, so it carries what Codex wrote to stderr, such as a broken config.toml. */
function openError(error: unknown, proc: ManagedStdioProcess): unknown {
  const stderr = proc.getStderrSnapshot();
  return error instanceof Error && !(error instanceof ConversationNotFoundError) && stderr ? new Error(`${error.message}\n\n${stderr}`, { cause: error }) : error;
}

function failed(error: string, proc: ManagedStdioProcess): AgentEvent {
  const detail = proc.getStderrSnapshot();
  return { type: 'done', status: 'failed', error, ...(detail ? { detail } : {}) };
}

function buildEnv(cli: string, userEnv: Record<string, string>): Record<string, string> {
  return cliEnv(getEnhancedPath(cli), userEnv);
}

interface TaskRun {
  turnId: string;
  /** The text of the run's last agent message. */
  text: string;
}

class CodexSession implements AgentSession {
  private readonly listeners = new Listeners<AgentEvent>();
  private readonly permissions: CodexPermissionAdapter;
  private readonly modelAdapter: CodexModelAdapter;
  private readonly items = new Map<string, ThreadItem>();
  /** Finished turns; their late notifications and approvals must not bind a new turn. */
  private readonly retiredTurnIds = new Set<string>();
  /** Sent and not yet taken in, in send order, which is the order Codex takes them in. */
  private unsent: string[] = [];
  /** Messages the running turn accepted; one still in `unsent` when that turn ends will never be taken in. */
  private readonly accepted = new Set<string>();
  /** Sent while `turn/start` has not returned its turn id, so there is nothing to steer yet. */
  private held: AgentMessage[] = [];
  private starting = false;
  private interruptWhenStarted = false;
  /** The parent thread's running turn. */
  private turnId: string | undefined;
  /** A `user` or output event came since the last `done`. */
  private inTurn = false;
  private cancellation = new AbortController();
  /** Text streamed so far per agent message, so a completed message only adds what never streamed; null once a steer cut it. */
  private readonly streamed = new Map<string, string | null>();
  /** The agent message that streamed last; a new one starts a new paragraph. */
  private lastMessageId: string | null = null;
  private error: string | null = null;
  /** The running turn of every other thread, keyed by thread id; a child's turn can start before its parent reports the child. */
  private readonly runs = new Map<string, TaskRun>();
  /** Top-level children: thread id to `agentPath`. */
  private readonly children = new Map<string, string>();
  /** Spawn prompts by child thread id. */
  private readonly prompts = new Map<string, string>();
  private ended = false;

  /** Sent on every turn; `turn/start` keeps an override for later turns, so returning to the default sends it explicitly. */
  private model: string | undefined;
  private effort: Effort | undefined;

  static async open(options: AgentSessionOptions, cli: string, userEnv: Record<string, string>): Promise<CodexSession> {
    const tools = new CodexToolAdapter(options.cwd, options.tools ?? []);
    const { proc, transport } = await startAppServer(cli, options.cwd, userEnv);
    try {
      let probed: Promise<ThreadStartResult> | undefined;
      const probe = (): Promise<ThreadStartResult> => probed ??= transport.request<ThreadStartResult>('thread/start', { cwd: options.cwd, ephemeral: true })
        .catch((error: unknown) => { probed = undefined; throw error; });
      const permissions = await CodexPermissionAdapter.prepare(options.permissionPolicy, options.resume, probe);
      const settings = {
        model: options.model,
        ...permissions.thread,
        developerInstructions: options.systemPrompt,
        cwd: options.cwd,
      };
      // The thread is saved so a later session can resume it. Its tools are saved with it, since a resume takes none.
      const opened = options.resume
        ? await resumeThread(transport, options.resume, settings)
        : await transport.request<ThreadStartResult>('thread/start', { ...settings, ...tools.registration() });
      CodexPermissionAdapter.confirm(options.permissionPolicy, opened);
      return new CodexSession(proc, transport, opened.thread.id, options, probe, tools, permissions);
    } catch (error) {
      transport.dispose();
      await proc.shutdown();
      throw openError(error, proc);
    }
  }

  private constructor(
    private readonly proc: ManagedStdioProcess,
    private readonly transport: JSONRPCTransport,
    readonly id: string,
    private readonly options: AgentSessionOptions,
    probe: () => Promise<ThreadStartResult>,
    private readonly tools: CodexToolAdapter,
    permissionSetup: CodexPermissionSetup,
  ) {
    this.model = options.model;
    this.effort = options.effort;
    this.modelAdapter = new CodexModelAdapter((cursor) => transport.request<ModelListResult>('model/list', { cursor }), probe);
    this.permissions = new CodexPermissionAdapter(permissionSetup, (id) => this.items.get(id));
    for (const method of CODEX_APPROVAL_METHODS) {
      // A server request always carries an id; only a notification has none.
      transport.onRequest(method, (params, { requestId }) => {
        const id = requestId!;
        const request = params as CodexApprovalRequest;
        return this.permissions.reply(id, method, request, this.approvalContext(request));
      });
    }
    transport.onRequest(CODEX_QUESTION_METHOD, (params, { requestId }) => {
      const request = params as CodexQuestionRequest;
      return this.permissions.answer(requestId!, request, this.approvalContext(request));
    });
    transport.onNotification('serverRequest/resolved', (params) => {
      const { threadId, requestId } = params as { threadId: string; requestId: string | number };
      this.permissions.resolved(threadId, requestId);
    });
    transport.onRequest('item/tool/call', (params) => this.tools.reply(params as DynamicToolCallParams));
    transport.onNotification('item/agentMessage/delta', (params) => this.onDelta(params as AgentMessageDeltaParams));
    transport.onNotification('item/started', (params) => this.onItemStarted(params as ItemParams));
    transport.onNotification('item/completed', (params) => this.onItemCompleted(params as ItemParams));
    transport.onNotification('thread/tokenUsage/updated', (params) => this.onTokenUsage(params as TokenUsageParams));
    transport.onNotification('error', (params) => this.onError(params as ErrorParams));
    transport.onNotification('turn/started', (params) => this.onTurnStarted(params as TurnScopedParams));
    transport.onNotification('turn/completed', (params) => this.onTurnCompleted(params as TurnScopedParams));
    proc.onClose(() => this.onExit());
  }

  subscribe(listener: (event: AgentEvent) => void): () => void {
    return this.listeners.add(listener);
  }

  send(message: AgentMessage): void {
    this.unsent.push(message.id);
    this.deliver(message);
  }

  interrupt(): void {
    if (this.starting && !this.turnId) {
      this.cancellation.abort();
      this.interruptWhenStarted = true;
      return;
    }
    if (!this.turnId) return;
    this.cancellation.abort();
    this.transport.request('turn/interrupt', { threadId: this.id, turnId: this.turnId }).catch(() => undefined);
  }

  async stopTask(id: string): Promise<void> {
    const run = this.children.has(id) ? this.runs.get(id) : undefined;
    if (!run) return;
    try {
      await this.transport.request('turn/interrupt', { threadId: id, turnId: run.turnId });
    } catch (error) {
      // The child ended before the call reached it, which is the no-op an ended task gets.
      if (!(error instanceof JSONRPCErrorResponse)) throw error;
    }
  }

  started(): Promise<void> {
    return Promise.resolve();
  }

  async skills(): Promise<SkillOption[]> {
    const { data } = await this.transport.request<SkillsListResult>('skills/list', { cwds: [this.options.cwd] });
    return (data[0]?.skills ?? [])
      .filter((skill) => skill.enabled && skill.scope !== 'system')
      .map((skill) => ({ name: skill.name, description: skill.interface?.shortDescription ?? skill.shortDescription ?? skill.description }));
  }

  async setModel(model?: string, effort?: Effort): Promise<void> {
    const selected = await this.modelAdapter.setModel(model, effort);
    this.model = selected.model;
    this.effort = selected.effort;
  }

  async close(): Promise<void> {
    this.end();
    this.transport.dispose();
    await this.proc.shutdown();
  }

  private emit(event: AgentEvent): void {
    if (!this.ended) this.listeners.emit(event);
  }

  /** Emits an event that belongs to the running CLI turn, which it starts if none runs. */
  private emitTurn(event: AgentEvent): void {
    this.inTurn = true;
    this.emit(event);
  }

  private end(): void {
    this.ended = true;
    this.cancellation.abort();
  }

  private deliver(message: AgentMessage): void {
    if (this.starting) this.held.push(message);
    else if (this.turnId) void this.steer(message, this.turnId);
    else void this.start(message);
  }

  private async start(message: AgentMessage): Promise<void> {
    this.starting = true;
    this.accepted.add(message.id);
    let turnId: string;
    try {
      ({ turn: { id: turnId } } = await this.transport.request<TurnStartResult>('turn/start', {
        threadId: this.id,
        input: inputOf(message),
        model: this.model,
        effort: this.effort,
        summary: 'none',
        ...this.permissions.turnSettings(),
      }));
    } catch (error) {
      const held = this.held;
      this.held = [];
      this.starting = false;
      this.interruptWhenStarted = false;
      // A closed transport means the process is exiting, and the exit drops every unsent message in its own order.
      if (!this.transport.isClosed) this.drop([message.id, ...held.map(({ id }) => id)], error instanceof Error ? error.message : String(error));
      return;
    }
    this.starting = false;
    if (!this.retiredTurnIds.has(turnId)) this.turnId = turnId;
    if (this.interruptWhenStarted) {
      this.interruptWhenStarted = false;
      this.interrupt();
    }
    const held = this.held;
    this.held = [];
    for (const next of held) this.deliver(next);
  }

  private async steer(message: AgentMessage, turnId: string): Promise<void> {
    try {
      await this.transport.request('turn/steer', { threadId: this.id, expectedTurnId: turnId, input: inputOf(message) });
      this.accepted.add(message.id);
    } catch {
      // The turn ended before the steer reached it ("no active turn to steer"), so the message starts a turn of its own.
      if (this.transport.isClosed) return;
      if (this.starting) this.held.push(message);
      else void this.start(message);
    }
  }

  private drop(ids: string[], error: string, stopped = false): void {
    this.unsent = this.unsent.filter((id) => !ids.includes(id));
    this.emit({ type: 'dropped', ids, error, ...(stopped ? { stopped } : {}) });
  }

  private onExit(): void {
    if (this.ended) return;
    if (this.inTurn) this.emit(failed('Codex exited before finishing the turn', this.proc));
    if (this.unsent.length) this.drop([...this.unsent], 'Codex exited before taking the message in');
    for (const task of this.background()) this.emit({ type: 'notice', task: task.id, description: task.description, status: 'stopped', text: 'The agent process exited' });
    this.emit({ type: 'background', tasks: [] });
    this.end();
  }

  private retire(turnId: string): void {
    this.retiredTurnIds.add(turnId);
    if (this.retiredTurnIds.size > RETIRED_TURN_LIMIT) this.retiredTurnIds.delete(this.retiredTurnIds.values().next().value!);
  }

  /** The running parent turn that owns a server request, or undefined so the request is declined. */
  private approvalContext(request: TurnScopedParams): AgentApprovalContext | undefined {
    return this.isCurrent(request) && request.turnId !== undefined
      ? { signal: this.cancellation.signal, push: (event: AgentEvent) => this.emitTurn(event) }
      : undefined;
  }

  /** Whether a notification belongs to the parent thread's running turn. */
  private isCurrent(params: TurnScopedParams): boolean {
    return params.threadId === this.id && this.turnId !== undefined && (params.turnId ?? params.turn?.id ?? this.turnId) === this.turnId;
  }

  private background(): BackgroundTask[] {
    return [...this.children]
      .filter(([id]) => this.runs.has(id))
      .map(([id, agentPath]) => ({ id, description: this.prompts.get(id) ?? agentPath }));
  }

  private emitBackground(): void {
    this.emit({ type: 'background', tasks: this.background() });
  }

  /** Learns the parent's children from its items, outside any turn too, since a finished child is reported after the parent's turn. */
  private trackChildren(item: ThreadItem): void {
    if (item.type === 'subAgentActivity' && !this.children.has(item.agentThreadId)) {
      this.children.set(item.agentThreadId, agentName(item.agentPath));
      if (this.runs.has(item.agentThreadId)) this.emitBackground();
    }
    if (item.type === 'collabAgentToolCall' && item.prompt) {
      const changed = item.receiverThreadIds.filter((id) => this.prompts.get(id) !== item.prompt);
      for (const id of changed) this.prompts.set(id, item.prompt);
      if (changed.some((id) => this.children.has(id) && this.runs.has(id))) this.emitBackground();
    }
  }

  private onUserMessage(): void {
    const id = this.unsent.shift();
    if (id === undefined) return;
    // A steer cuts the agent message that was streaming; Codex never completes it, and its text stays with the turn before.
    if (this.lastMessageId !== null) this.streamed.set(this.lastMessageId, null);
    this.lastMessageId = null;
    this.emitTurn({ type: 'user', id });
  }

  private onDelta(params: AgentMessageDeltaParams): void {
    if (this.isCurrent(params)) this.pushText(params.itemId, params.delta);
  }

  private onItemStarted(params: ItemParams): void {
    const { item } = params;
    if (params.threadId !== this.id) return;
    this.trackChildren(item);
    if (item.type === 'userMessage') {
      this.onUserMessage();
      return;
    }
    if (!this.isCurrent(params)) return;
    // Kept only to show an approval the item it gates.
    if (item.type === 'commandExecution' || item.type === 'fileChange') this.items.set(item.id, item);
    if (item.type === 'reasoning') {
      this.emitTurn({ type: 'thinking' });
      return;
    }
    for (const event of this.tools.events({ item, phase: 'started' })) this.emitTurn(event);
  }

  private onItemCompleted(params: ItemParams): void {
    const { item } = params;
    if (params.threadId !== this.id) {
      const run = this.runs.get(params.threadId ?? '');
      if (run && item.type === 'agentMessage') run.text = item.text;
      return;
    }
    this.trackChildren(item);
    if (!this.isCurrent(params)) return;
    if (item.type !== 'agentMessage') {
      for (const event of this.tools.events({ item, phase: 'completed' })) this.emitTurn(event);
      return;
    }
    const streamed = this.streamed.get(item.id);
    if (!item.text || streamed === null) return;
    const missing = item.text.startsWith(streamed ?? '') ? item.text.slice((streamed ?? '').length) : '';
    if (missing) this.pushText(item.id, missing);
  }

  private pushText(itemId: string, delta: string): void {
    const streamed = this.streamed.get(itemId);
    if (streamed === null) return;
    const separator = this.lastMessageId !== null && this.lastMessageId !== itemId ? '\n\n' : '';
    this.lastMessageId = itemId;
    this.streamed.set(itemId, (streamed ?? '') + delta);
    this.emitTurn({ type: 'text', delta: separator + delta });
  }

  private onTokenUsage(params: TokenUsageParams): void {
    // A resumed thread replays its last usage when a turn starts, under the earlier turn's id, so this checks the thread only.
    const { last, modelContextWindow } = params.tokenUsage;
    if (params.threadId === this.id && (this.turnId || this.starting) && modelContextWindow) this.emit({ type: 'usage', used: last.totalTokens, window: modelContextWindow });
  }

  private onError(params: ErrorParams): void {
    if (params.threadId === this.id && !params.willRetry) this.error = params.error.message;
  }

  private onTurnStarted(params: TurnScopedParams): void {
    if (!params.turn || !params.threadId) return;
    if (params.threadId === this.id) {
      if (!this.retiredTurnIds.has(params.turn.id)) this.turnId = params.turn.id;
      return;
    }
    this.runs.set(params.threadId, { turnId: params.turn.id, text: '' });
    if (this.children.has(params.threadId)) this.emitBackground();
  }

  private onTurnCompleted(params: TurnScopedParams): void {
    const { turn, threadId } = params;
    if (!turn || !threadId || turn.status === 'inProgress') return;
    if (threadId !== this.id) {
      this.onTaskCompleted(threadId, turn);
      return;
    }
    if (this.retiredTurnIds.has(turn.id)) return;
    this.retire(turn.id);
    if (this.turnId === turn.id) this.turnId = undefined;
    const error = turn.status === 'failed' ? turn.error?.message ?? this.error ?? 'Codex turn failed' : undefined;
    const lost = this.unsent.filter((id) => this.accepted.has(id));
    this.accepted.clear();
    const ran = this.inTurn;
    this.inTurn = false;
    this.cancellation.abort();
    this.cancellation = new AbortController();
    this.streamed.clear();
    this.lastMessageId = null;
    this.error = null;
    this.items.clear();
    // A turn that took nothing in and wrote nothing never ran, so it has no `done`.
    if (ran || !lost.length) this.emit({ type: 'done', status: turn.status, ...(error ? { error } : {}) });
    if (lost.length) this.drop(lost, error ?? 'Stopped before the agent took the message in', turn.status === 'interrupted');
  }

  private onTaskCompleted(threadId: string, turn: NonNullable<TurnScopedParams['turn']>): void {
    const run = this.runs.get(threadId);
    if (run?.turnId !== turn.id) return;
    this.runs.delete(threadId);
    const agentPath = this.children.get(threadId);
    if (agentPath === undefined) return;
    const status = turn.status === 'interrupted' ? 'stopped' : turn.status === 'failed' ? 'failed' : 'completed';
    this.emit({ type: 'notice', task: threadId, description: this.prompts.get(threadId) ?? agentPath, status, text: run.text || (turn.error?.message ?? '') });
    this.emitBackground();
  }
}

function inputOf({ text, images = [] }: AgentMessage): unknown[] {
  return [...images.map(({ path }) => ({ type: 'localImage', path })), { type: 'text', text, text_elements: [] }];
}

/** A failed resume is a lost thread only if Codex cannot read the thread either; its error text is not relied on. */
async function resumeThread(transport: JSONRPCTransport, threadId: string, settings: Record<string, unknown>): Promise<ThreadStartResult> {
  try {
    return await transport.request<ThreadStartResult>('thread/resume', { ...settings, threadId, excludeTurns: true });
  } catch (error) {
    if (!(error instanceof JSONRPCErrorResponse)) throw error;
    const readable = await transport.request('thread/read', { threadId }).then(() => true, (readError: unknown) => !(readError instanceof JSONRPCErrorResponse));
    throw readable ? error : new ConversationNotFoundError(threadId, error);
  }
}

/** A child's name from its `agentPath`, such as "counter 1" from "/root/counter_1", for when Codex sends no task text. */
function agentName(agentPath: string): string {
  return agentPath.split('/').filter(Boolean).at(-1)?.replace(/[_-]+/g, ' ') || agentPath;
}
