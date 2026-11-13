import type { Options, Query, SDKBackgroundTasksChangedMessage, SDKMessage, SDKResultMessage, SDKTaskNotificationMessage, SDKUserMessage, SpawnedProcess, SpawnOptions } from '@anthropic-ai/claude-agent-sdk';
import type * as ClaudeSDK from '@anthropic-ai/claude-agent-sdk/core';
import { randomUUID, type UUID } from 'crypto';
import { readFile } from 'fs/promises';
import * as os from 'os';

import { AsyncQueue } from '@/agents/shared/AsyncQueue';
import { Listeners } from '@/agents/shared/Listeners';
import { resolveCLI } from '@/agents/process/cliBinaryLocator';
import { cliEnv, getEnhancedPath } from '@/agents/process/env';
import { runProcessProbe } from '@/agents/process/processProbe';
import { type AgentAdapter, type AgentEvent, type AgentMessage, type AgentSession, type AgentSessionOptions, type AuthState, type BackgroundTask, ConversationNotFoundError, type Effort, type ModelOption, type SkillOption, type TurnImage } from '@/agents/types';

import { allowBrowserAbortSignals } from './allowBrowserAbortSignals';
import { findClaudeBinaryPath } from './ClaudeBinaryLocator';
import { ClaudeModelAdapter } from './ClaudeModelAdapter';
import { ClaudePermissionAdapter } from './ClaudePermissionAdapter';
import { ClaudeToolAdapter, type ClaudeToolFactory, type ClaudeTools } from './ClaudeToolAdapter';
import { claudeConfigDir, claudeSessionExists, claudeSessionTitle } from './claudeSessionTitle';
import { spawnClaudeCode } from './spawnClaudeCode';

export type ClaudeQuery = (params: { prompt: AsyncIterable<SDKUserMessage>; options: Options }) => Query;

const STDERR_LIMIT = 8_192;

let sdkModule: Promise<typeof ClaudeSDK> | undefined;

/** The SDK is loaded on first use, so opening Obsidian does not pay for it. */
function loadClaudeAgentSDK(): Promise<typeof ClaudeSDK> {
  allowBrowserAbortSignals();
  sdkModule ??= import('@anthropic-ai/claude-agent-sdk/core');
  return sdkModule;
}

export class ClaudeAgent implements AgentAdapter {
  readonly id = 'claude';
  readonly skillSyntax = { prefix: '/', atStart: true };
  /** Claude Code loads an `@"path"` itself, as a `Read` the session records. It cannot read a quoted path that holds a quote, escaped or not. */
  readonly fileMention = (path: string): string | undefined => (path.includes('"') ? undefined : `@"${path}"`);

  /** `query` and `toolServer` are the SDK boundary; omit them to load the real SDK lazily. */
  constructor(
    private readonly query?: ClaudeQuery,
    private readonly toolServer: ClaudeToolFactory = async (tools, adapter) => ClaudeToolAdapter.createServer(tools, await loadClaudeAgentSDK(), adapter),
    private readonly userEnv: () => Record<string, string> = () => ({}),
  ) {}

  async authState(cliPath?: string): Promise<AuthState> {
    const cli = await resolveCLI(cliPath, findClaudeBinaryPath);
    if (!cli) return 'missing';
    const output = await runProcessProbe({ command: cli, args: ['auth', 'status'], cwd: os.homedir(), env: cliEnv(getEnhancedPath(cli), this.userEnv()) });
    // `claude auth status` exits non-zero when logged out.
    return output === null ? 'logged-out' : 'logged-in';
  }

  async models(cliPath?: string): Promise<ModelOption[]> {
    const cli = await resolveCLI(cliPath, findClaudeBinaryPath);
    if (!cli) return [];
    const query = this.query ?? (await loadClaudeAgentSDK()).query;
    const prompts = new AsyncQueue<SDKUserMessage>();
    const options = buildOptions({ systemPrompt: '', cwd: os.homedir(), cliPath }, cli, randomUUID(), this.userEnv());
    // No setting sources, so listing models starts no MCP servers or hooks; no saved session, so it adds no chat to the CLI's history.
    const listing = query({ prompt: prompts, options: { ...options, settingSources: [], persistSession: false } });
    try {
      return await new ClaudeModelAdapter(listing).listModels();
    } finally {
      prompts.close();
      listing.close();
    }
  }

  async openSession(options: AgentSessionOptions): Promise<AgentSession> {
    const cli = await resolveCLI(options.cliPath, findClaudeBinaryPath);
    if (!cli) throw new Error('Claude Code 2.1.267 or later not found. Install or update Claude Code, or set its path.');
    const query = this.query ?? (await loadClaudeAgentSDK()).query;
    const id = options.resume ?? randomUUID();
    const tools = new ClaudeToolAdapter(options.cwd, options.tools ?? []);
    const registration = options.tools?.length ? await this.toolServer(options.tools, tools) : undefined;
    const userEnv = this.userEnv();
    const configDir = claudeConfigDir(userEnv);
    const session = new ClaudeSession(query, buildOptions(options, cli, id, userEnv, registration), id, tools, configDir);
    if (options.resume) {
      // The CLI reads the saved conversation at startup, so a session it no longer has fails here and not on the first turn.
      const resume = options.resume;
      await session.started().catch(async (error: unknown) => {
        await session.close();
        throw await claudeSessionExists(resume, configDir) ? error : new ConversationNotFoundError(resume, error);
      });
    }
    return session;
  }
}

function buildOptions(options: AgentSessionOptions, cli: string, id: string, userEnv: Record<string, string>, tools?: ClaudeTools): Options {
  const enhancedPath = getEnhancedPath(cli);
  return {
    cwd: options.cwd,
    systemPrompt: { type: 'preset', preset: 'claude_code', append: options.systemPrompt },
    ...ClaudeModelAdapter.initial(options.model, options.effort),
    pathToClaudeCodeExecutable: cli,
    env: cliEnv(enhancedPath, userEnv),
    spawnClaudeCodeProcess: (spawn) => spawnClaudeCode(spawn),
    // Native settings and rules remain in force; only an explicit chat choice overrides the starting mode.
    tools: { type: 'preset', preset: 'claude_code' },
    ...ClaudePermissionAdapter.settings(options.permissionPolicy),
    ...tools,
    includePartialMessages: true,
    // The CLI saves the conversation; a resumed one keeps its id, and a new one is named up front so the chat can store it.
    ...(options.resume ? { resume: id } : { sessionId: id }),
  };
}

const EXITED = 'Claude Code exited';

class ClaudeSession implements AgentSession {
  private readonly prompts = new AsyncQueue<SDKUserMessage>();
  private readonly listeners = new Listeners<AgentEvent>();
  private readonly query: Query;
  private readonly modelAdapter: ClaudeModelAdapter;
  /** Sent messages the CLI has not taken in yet, in send order. */
  private readonly pending = new Set<string>();
  /** Keeps pushes in send order while images are read. */
  private sending: Promise<void> = Promise.resolve();
  /** The running CLI turn: its approvals' cancellation, and whether `interrupt` ended it. */
  private turn: { controller: AbortController; interrupted: boolean } | null = null;
  /** `interrupt` came while a message was on its way and no turn ran. The CLI may ignore it, or end that message's turn with an error. */
  private stopping = false;
  /** Top-level tasks not yet reported by a notice, by id; the notice and the emptied set arrive in either order. */
  private readonly tasks = new Map<string, string>();
  private running: BackgroundTask[] = [];
  private exited = false;
  private closed = false;
  /** The end of the CLI's stderr, to say why it failed. */
  private stderr = '';

  constructor(createQuery: ClaudeQuery, options: Options, readonly id: string, private readonly tools: ClaudeToolAdapter, private readonly configDir: string) {
    // An approval is output of a CLI turn, so one that comes while none runs starts it.
    const canUseTool = new ClaudePermissionAdapter().callback(() => {
      if (this.closed || this.exited) return undefined;
      return { signal: this.begin().controller.signal, push: (event) => this.emit(event) };
    });
    const spawnClaudeCodeProcess = (spawn: SpawnOptions): SpawnedProcess => spawnClaudeCode(spawn, (text) => {
      this.stderr = (this.stderr + text).slice(-STDERR_LIMIT);
    });
    // Bypass never asks, and the SDK warns when it is given a callback it will not call.
    const approvals = options.permissionMode === 'bypassPermissions' ? {} : { canUseTool };
    // The replay echo is how the session learns the CLI took a message in.
    // Without the snapshot flag a resume runs under the prompt recorded when the conversation began, not this one.
    const extraArgs = { ...options.extraArgs, 'replay-user-messages': null, ...(options.resume ? { 'system-prompt-snapshot': 'off' } : {}) };
    this.query = createQuery({ prompt: this.prompts, options: { ...options, ...approvals, extraArgs, spawnClaudeCodeProcess } });
    this.modelAdapter = new ClaudeModelAdapter(this.query);
    void this.read();
  }

  subscribe(listener: (event: AgentEvent) => void): () => void {
    return this.listeners.add(listener);
  }

  send({ id, text, images = [] }: AgentMessage): void {
    if (this.closed) return;
    if (this.exited) { this.emit({ type: 'dropped', ids: [id], error: EXITED }); return; }
    this.pending.add(id);
    // Settled at once, so a failed read is never an unhandled rejection while earlier sends wait.
    const prompt = userMessage(id, text, images).then((message) => ({ message }), (error: unknown) => ({ error }));
    this.sending = this.sending.then(() => prompt).then((read) => {
      if (!this.pending.has(id) || this.closed) return;
      if ('message' in read) this.prompts.push(read.message);
      else {
        this.pending.delete(id);
        this.emit({ type: 'dropped', ids: [id], error: errorText(read.error) });
      }
    });
  }

  interrupt(): void {
    if (this.turn) {
      this.turn.interrupted = true;
      this.turn.controller.abort();
    } else if (this.pending.size) this.stopping = true;
    void this.query.interrupt().catch(() => undefined);
  }

  async stopTask(id: string): Promise<void> {
    if (this.running.some((task) => task.id === id)) await this.query.stopTask(id);
  }

  private async read(): Promise<void> {
    let error = 'Claude Code exited before finishing the turn';
    try {
      for await (const message of this.query) {
        if (this.closed) return;
        await this.handle(message);
      }
    } catch (thrown) {
      error = errorText(thrown);
    }
    if (!this.closed) this.exit(error);
  }

  private async handle(message: SDKMessage): Promise<void> {
    if (message.type === 'user' && 'isReplay' in message && message.parent_tool_use_id === null && this.pending.delete(message.uuid)) {
      this.output({ type: 'user', id: message.uuid });
      return;
    }
    if (message.type === 'system') {
      if (message.subtype === 'background_tasks_changed') this.background(message.tasks);
      else if (message.subtype === 'task_notification') this.notice(message);
      return;
    }
    if (message.type === 'result') return this.end(message);
    const delta = textDelta(message);
    if (delta) this.output({ type: 'text', delta });
    if (startsSilentBlock(message)) this.output({ type: 'thinking' });
    for (const event of this.tools.events(message)) this.output(event);
  }

  private background(tasks: SDKBackgroundTasksChangedMessage['tasks']): void {
    // Ambient tasks are watchers, not work: the SDK says hosts should leave them out of activity.
    const running = tasks.filter((task) => !task.parent_task_id && !task.ambient).map((task) => ({ id: task.task_id, description: task.description }));
    for (const task of running) this.tasks.set(task.id, task.description);
    if (JSON.stringify(running) === JSON.stringify(this.running)) return;
    this.running = running;
    this.emit({ type: 'background', tasks: running });
  }

  private notice({ task_id, status, summary }: SDKTaskNotificationMessage): void {
    const description = this.tasks.get(task_id);
    // A task started by another task was never top-level.
    if (description === undefined) return;
    this.tasks.delete(task_id);
    this.emit({ type: 'notice', task: task_id, description, status, text: summary });
  }

  private async end(result: SDKResultMessage): Promise<void> {
    const stopped = this.stopping && (result.subtype !== 'success' || result.is_error);
    this.stopping = false;
    // Stopped before the CLI checked the prompt: the message never joined the conversation, so no turn ran.
    const [lost] = this.turn ? [] : this.pending;
    if (stopped && lost !== undefined) {
      this.pending.delete(lost);
      this.emit({ type: 'dropped', ids: [lost], error: 'Stopped before the agent took the message in', stopped: true });
      return;
    }
    const turn = this.begin();
    const usage = result.subtype === 'success' && !result.is_error ? await this.contextUsage() : null;
    this.turn = null;
    turn.controller.abort();
    if (usage) this.emit(usage);
    this.emit(finish(result, turn.interrupted || stopped));
  }

  /** The process ended on its own: close out the turn, the messages and the tasks it leaves behind. */
  private exit(error: string): void {
    this.exited = true;
    const turn = this.turn;
    this.turn = null;
    if (turn) {
      turn.controller.abort();
      this.emit(this.failed(error));
    }
    if (this.pending.size) this.emit({ type: 'dropped', ids: [...this.pending], error: EXITED });
    this.pending.clear();
    for (const [task, description] of this.tasks) this.emit({ type: 'notice', task, description, status: 'stopped', text: 'The agent process exited' });
    this.tasks.clear();
    this.running = [];
    this.emit({ type: 'background', tasks: [] });
  }

  private begin(): NonNullable<ClaudeSession['turn']> {
    this.turn ??= { controller: new AbortController(), interrupted: false };
    return this.turn;
  }

  private output(event: AgentEvent): void {
    this.begin();
    this.emit(event);
  }

  private emit(event: AgentEvent): void {
    if (!this.closed) this.listeners.emit(event);
  }

  private async contextUsage(): Promise<AgentEvent | null> {
    try {
      const { totalTokens, rawMaxTokens } = await this.query.getContextUsage({ detail: 'summary' });
      return rawMaxTokens > 0 ? { type: 'usage', used: totalTokens, window: rawMaxTokens } : null;
    } catch {
      // The meter is optional; a failed query must not fail the turn.
      return null;
    }
  }

  async started(): Promise<void> {
    await this.query.initializationResult();
  }

  title(): Promise<string | undefined> {
    return claudeSessionTitle(this.id, this.configDir);
  }

  async skills(): Promise<SkillOption[]> {
    const commands = await this.query.supportedCommands();
    // Claude Code's own commands and bundled skills are left out; the list is the student's own.
    return commands
      .filter((command) => !command.builtin)
      .map(({ name, description, argumentHint }) => ({ name, description, argumentHint: argumentHint || undefined }));
  }

  async setModel(model?: string, effort?: Effort): Promise<void> {
    await this.modelAdapter.setModel(model, effort);
  }

  async close(): Promise<void> {
    this.closed = true;
    this.turn?.controller.abort();
    this.prompts.close();
    this.query.close();
  }

  private failed(error: string): AgentEvent {
    const detail = this.stderr.trim();
    return { type: 'done', status: 'failed', error, ...(detail ? { detail } : {}) };
  }
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function userMessage(id: string, text: string, images: TurnImage[]): Promise<SDKUserMessage> {
  // Images go first, as the API recommends.
  const blocks = await Promise.all(images.map(async ({ path, mediaType }) => ({
    type: 'image' as const,
    source: { type: 'base64' as const, media_type: mediaType, data: (await readFile(path)).toString('base64') },
  })));
  return {
    type: 'user',
    message: { role: 'user', content: blocks.length ? [...blocks, { type: 'text', text }] : text },
    parent_tool_use_id: null,
    session_id: '',
    // The CLI echoes it on the replay; callers pass a UUID, as Claude Code expects.
    uuid: id as UUID,
  };
}

function textDelta(message: SDKMessage): string | null {
  if (message.type !== 'stream_event' || message.parent_tool_use_id !== null) return null;
  const { event } = message;
  return event.type === 'content_block_delta' && event.delta.type === 'text_delta' ? event.delta.text : null;
}

/** A thinking or tool-use block starts streaming; the finished tool call arrives only once its input has streamed. */
function startsSilentBlock(message: SDKMessage): boolean {
  if (message.type !== 'stream_event' || message.parent_tool_use_id !== null) return false;
  return message.event.type === 'content_block_start' && message.event.content_block.type !== 'text';
}

function finish(result: SDKResultMessage, interrupted: boolean): AgentEvent {
  if (interrupted) return { type: 'done', status: 'interrupted' };
  if (result.subtype === 'success' && !result.is_error) return { type: 'done', status: 'completed' };
  const error = result.subtype === 'success' ? result.result : result.errors.join('\n') || result.subtype;
  return { type: 'done', status: 'failed', error };
}
