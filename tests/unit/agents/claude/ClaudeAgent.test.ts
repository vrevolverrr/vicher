import type { ModelInfo, Options, Query, SDKMessage, SDKUserMessage, SlashCommand } from '@anthropic-ai/claude-agent-sdk';

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import { ClaudeAgent, type ClaudeQuery } from '@/agents/claude/ClaudeAgent';
import { AsyncQueue } from '@/agents/shared/AsyncQueue';
import { type AgentEvent, type AgentSession, type AgentSessionOptions, type AgentTool, ConversationNotFoundError } from '@/agents/types';

import completedTurn from '../../../fixtures/claude/completed-turn.json';
import interruptedTurn from '../../../fixtures/claude/interrupted-turn.json';
import loggedOutTurn from '../../../fixtures/claude/logged-out-turn.json';
import supportedCommands from '../../../fixtures/claude/supported-commands.json';
import supportedModels from '../../../fixtures/claude/supported-models.json';
import toolTurn from '../../../fixtures/claude/tool-turn.json';

const SESSION: AgentSessionOptions = {
  systemPrompt: 'Reply with JSON Lines only.',
  model: 'haiku',
  effort: 'low',
  cwd: '/tmp/vicher-test',
  cliPath: process.execPath,
};

const completed = completedTurn as SDKMessage[];
const RESULT = completed.find((message) => message.type === 'result')!;
const INTERRUPTED = (interruptedTurn as SDKMessage[]).find((message) => message.type === 'result')!;

const text = (delta: string): SDKMessage => ({
  type: 'stream_event', event: { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: delta } }, parent_tool_use_id: null, uuid: 'frame', session_id: '',
}) as unknown as SDKMessage;

interface FakeTask { task_id: string; description: string; parent_task_id?: string; ambient?: boolean }
const tasksChanged = (tasks: FakeTask[]): SDKMessage => ({
  type: 'system', subtype: 'background_tasks_changed', tasks: tasks.map((task) => ({ task_type: 'local_agent', ...task })), uuid: 'frame', session_id: '',
}) as unknown as SDKMessage;
const taskNotification = (task_id: string, status: 'completed' | 'failed' | 'stopped', summary: string): SDKMessage => ({
  type: 'system', subtype: 'task_notification', task_id, status, summary, output_file: '', uuid: 'frame', session_id: '',
}) as unknown as SDKMessage;

/** What the CLI prints, with `--replay-user-messages`, when it takes a message in. */
const replay = (message: SDKUserMessage): SDKMessage => ({ ...message, isReplay: true }) as unknown as SDKMessage;

/** Stands in for the SDK boundary. By default it takes each message in at once and plays the next scripted turn; a test can drive it by hand instead. */
class FakeClaude {
  readonly sent: SDKUserMessage[] = [];
  options: Options | undefined;
  interrupts = 0;
  readonly stopped: string[] = [];
  queries = 0;
  closed = false;
  readonly controls: object[] = [];
  /** Set to make the CLI refuse to start, as it does for a session it no longer has. */
  startError: Error | null = null;
  usage: { totalTokens: number; rawMaxTokens: number } | Error = { totalTokens: 84_000, rawMaxTokens: 200_000 };
  onPrompt: (message: SDKUserMessage) => void = (message) => {
    this.emit(replay(message), ...(this.turns.shift() ?? []));
  };
  private out = new AsyncQueue<SDKMessage>();
  private failure: Error | null = null;

  constructor(private readonly turns: SDKMessage[][] = []) {}

  emit(...messages: SDKMessage[]): void {
    for (const message of messages) this.out.push(message);
  }

  /** The process ends, cleanly or with `error`. */
  exit(error?: Error): void {
    this.failure = error ?? null;
    this.out.close();
  }

  readonly query: ClaudeQuery = ({ prompt, options }) => {
    this.queries++;
    this.options = options;
    void (async () => {
      for await (const message of prompt) {
        this.sent.push(message);
        this.onPrompt(message);
      }
    })();
    const self = this;
    async function* stream(): AsyncGenerator<SDKMessage, void> {
      for await (const message of self.out) yield message;
      if (self.failure) throw self.failure;
    }
    return Object.assign(stream(), {
      interrupt: async () => { this.interrupts++; return undefined; },
      stopTask: async (id: string) => { this.stopped.push(id); },
      close: () => { this.closed = true; this.out.close(); },
      initializationResult: async () => { if (this.startError) throw this.startError; return {}; },
      getContextUsage: async () => { if (this.usage instanceof Error) throw this.usage; return this.usage; },
      supportedModels: async () => supportedModels as ModelInfo[],
      supportedCommands: async () => supportedCommands as SlashCommand[],
      setModel: async (model?: string) => { this.controls.push({ setModel: model }); },
      applyFlagSettings: async (settings: object) => { this.controls.push({ applyFlagSettings: settings }); },
    }) as unknown as Query;
  };

  /** Hold every message until the test takes it in. */
  manual(): this {
    this.onPrompt = () => {};
    return this;
  }
}

function streamedText(turn: SDKMessage[]): string {
  return turn
    .filter((m) => m.type === 'stream_event' && m.event.type === 'content_block_delta' && m.event.delta.type === 'text_delta')
    .map((m) => (m as { event: { delta: { text: string } } }).event.delta.text)
    .join('');
}

const textOf = (events: AgentEvent[]): string =>
  events.map((e) => (e.type === 'text' ? e.delta : '')).join('');

async function open(cli: FakeClaude, options: Partial<AgentSessionOptions> = {}): Promise<{ session: AgentSession; events: AgentEvent[] }> {
  const session = await new ClaudeAgent(cli.query).openSession({ ...SESSION, ...options });
  const events: AgentEvent[] = [];
  session.subscribe((event) => events.push(event));
  return { session, events };
}

/** Waits on time, not turns of the event loop: a send that reads an image file waits on real I/O, slower under load. */
async function until(check: () => boolean, ms = 2000): Promise<void> {
  const end = Date.now() + ms;
  while (!check() && Date.now() < end) await new Promise((resolve) => setImmediate(resolve));
  if (!check()) throw new Error('Timed out');
}

const doneCount = (events: AgentEvent[]): number => events.filter((e) => e.type === 'done').length;

/** One line per event, with runs of text, thinking and tool events folded into one. */
function lines(events: AgentEvent[]): string[] {
  const out: string[] = [];
  for (const e of events) {
    const line = e.type === 'user' ? `user ${e.id}`
      : e.type === 'done' ? `done ${e.status}`
      : e.type === 'dropped' ? `dropped ${e.ids.join(',')}`
      : e.type === 'background' ? `background [${e.tasks.map((task) => task.id).join(',')}]`
      : e.type === 'notice' ? `notice ${e.task} ${e.status}`
      : e.type;
    if (line !== out.at(-1) || e.type === 'notice' || e.type === 'background') out.push(line);
  }
  return out;
}

describe('ClaudeAgent session', () => {
  it('reports a plain reply: taken in, text, usage, done', async () => {
    const cli = new FakeClaude([completed]);
    const { session, events } = await open(cli);
    await until(() => true);
    expect(events).toEqual([]);

    session.send({ id: 'A', text: 'Greet the student.' });
    await until(() => doneCount(events) === 1);

    expect(lines(events)).toEqual(['user A', 'text', 'usage', 'done completed']);
    expect(textOf(events)).toBe(streamedText(completed));
    expect(events.slice(-2)).toEqual([{ type: 'usage', used: 84_000, window: 200_000 }, { type: 'done', status: 'completed' }]);
    expect(cli.sent[0]).toMatchObject({ uuid: 'A', message: { content: 'Greet the student.' } });
    expect(cli.sent[0]).not.toHaveProperty('priority');
  });

  it('runs a message sent during a reply after that reply, as its own CLI turn', async () => {
    const cli = new FakeClaude().manual();
    const { session, events } = await open(cli);
    session.send({ id: 'A', text: 'Write an essay.' });
    await until(() => cli.sent.length === 1);
    cli.emit(replay(cli.sent[0]!), text('Telescopes'));
    await until(() => events.some((e) => e.type === 'text'));

    session.send({ id: 'B', text: 'And then?' });
    await until(() => cli.sent.length === 2);
    cli.emit(RESULT, replay(cli.sent[1]!), text('B-OK'), RESULT);
    await until(() => doneCount(events) === 2);

    expect(lines(events)).toEqual(['user A', 'text', 'usage', 'done completed', 'user B', 'text', 'usage', 'done completed']);
    expect(cli.queries).toBe(1);
  });

  it('folds a message the CLI takes in at a tool boundary into the running turn, with one done', async () => {
    const turn = toolTurn as SDKMessage[];
    const toolResult = turn.findIndex((m) => m.type === 'user');
    const cli = new FakeClaude().manual();
    const { session, events } = await open(cli, { cwd: '/private/tmp/vicher-capture' });
    session.send({ id: 'A', text: 'What does the pin count track?' });
    await until(() => cli.sent.length === 1);
    cli.emit(replay(cli.sent[0]!), ...turn.slice(0, toolResult));
    session.send({ id: 'B', text: 'Keep it short.' });
    await until(() => cli.sent.length === 2);
    cli.emit(turn[toolResult]!, replay(cli.sent[1]!), ...turn.slice(toolResult + 1));
    await until(() => doneCount(events) === 1);

    expect(lines(events)).toEqual(['user A', 'thinking', 'tool', 'user B', 'thinking', 'text', 'usage', 'done completed']);
    const id = 'toolu_01RHHNWxmCuxJs3J3jH9Lm2X';
    expect(events.filter((e) => e.type === 'tool')).toEqual([
      { type: 'tool', id, name: 'Read', title: 'Read notes.md', status: 'running' },
      { type: 'tool', id, name: 'Read', title: 'Read notes.md', status: 'done' },
    ]);
    expect(textOf(events)).toBe(streamedText(turn));
  });

  it('reports a background task, its notice, then the turn the CLI starts on its own', async () => {
    const cli = new FakeClaude().manual();
    const { session, events } = await open(cli);
    session.send({ id: 'A', text: 'Start a subagent.' });
    await until(() => cli.sent.length === 1);
    cli.emit(replay(cli.sent[0]!), tasksChanged([{ task_id: 't1', description: 'Count to four' }]), text('SPAWNED'), RESULT);
    await until(() => doneCount(events) === 1);
    cli.emit(taskNotification('t1', 'completed', 'It is 4.'), tasksChanged([]), text('The subagent finished'), RESULT);
    await until(() => doneCount(events) === 2);

    expect(lines(events)).toEqual(['user A', 'background [t1]', 'text', 'usage', 'done completed', 'notice t1 completed', 'background []', 'text', 'usage', 'done completed']);
    expect(events.find((e) => e.type === 'background')).toEqual({ type: 'background', tasks: [{ id: 't1', description: 'Count to four' }] });
    expect(events.find((e) => e.type === 'notice')).toEqual({ type: 'notice', task: 't1', description: 'Count to four', status: 'completed', text: 'It is 4.' });
  });

  it('reports a notice whose notification arrives after the emptied set', async () => {
    const cli = new FakeClaude().manual();
    const { session, events } = await open(cli);
    session.send({ id: 'A', text: 'Start a subagent.' });
    cli.emit(tasksChanged([{ task_id: 't1', description: 'Count' }]), tasksChanged([]), taskNotification('t1', 'failed', 'Gave up.'));
    await until(() => events.some((e) => e.type === 'notice'));

    expect(lines(events)).toEqual(['background [t1]', 'background []', 'notice t1 failed']);
  });

  it('leaves out tasks started by another task, and ambient ones', async () => {
    const cli = new FakeClaude().manual();
    const { session, events } = await open(cli);
    session.send({ id: 'A', text: 'Start a subagent.' });
    cli.emit(
      tasksChanged([{ task_id: 't1', description: 'Review' }, { task_id: 'shell', description: 'sleep', parent_task_id: 't1' }, { task_id: 'watch', description: 'Watcher', ambient: true }]),
      taskNotification('shell', 'completed', 'slept'),
      taskNotification('watch', 'completed', 'watched'),
      tasksChanged([{ task_id: 't1', description: 'Review' }]),
      taskNotification('t1', 'completed', 'Reviewed.'),
    );
    await until(() => events.some((e) => e.type === 'notice'));
    await until(() => true);

    expect(lines(events)).toEqual(['background [t1]', 'notice t1 completed']);
  });

  it('stops a running top-level task, and ignores a finished or unknown one', async () => {
    const cli = new FakeClaude().manual();
    const { session, events } = await open(cli);
    session.send({ id: 'A', text: 'Start two subagents.' });
    cli.emit(tasksChanged([{ task_id: 't1', description: 'One' }, { task_id: 't2', description: 'Two' }]), tasksChanged([{ task_id: 't1', description: 'One' }]));
    await until(() => events.filter((e) => e.type === 'background').length === 2);

    await session.stopTask('t1');
    await session.stopTask('t2');
    await session.stopTask('nope');

    expect(cli.stopped).toEqual(['t1']);
  });

  it('ends the running turn as interrupted on interrupt, and keeps a message not yet taken in', async () => {
    const cli = new FakeClaude().manual();
    const { session, events } = await open(cli);
    session.send({ id: 'A', text: 'Write ten lines.' });
    await until(() => cli.sent.length === 1);
    cli.emit(replay(cli.sent[0]!), text('One'));
    session.send({ id: 'B', text: 'Then this.' });
    await until(() => events.some((e) => e.type === 'text'));

    session.interrupt();
    cli.emit(INTERRUPTED);
    await until(() => doneCount(events) === 1);
    await until(() => cli.sent.length === 2);
    cli.emit(replay(cli.sent[1]!), text('B'), RESULT);
    await until(() => doneCount(events) === 2);

    expect(cli.interrupts).toBe(1);
    expect(lines(events)).toEqual(['user A', 'text', 'done interrupted', 'user B', 'text', 'usage', 'done completed']);
  });

  it('closes out the turn, the pending messages and the running tasks when the process exits, in that order', async () => {
    const cli = new FakeClaude().manual();
    const { session, events } = await open(cli);
    session.send({ id: 'A', text: 'Start a subagent.' });
    await until(() => cli.sent.length === 1);
    cli.emit(replay(cli.sent[0]!), tasksChanged([{ task_id: 't1', description: 'Count' }]), text('Working'));
    session.send({ id: 'B', text: 'b' });
    session.send({ id: 'C', text: 'c' });
    await until(() => cli.sent.length === 3);

    cli.exit();
    await until(() => events.at(-1)?.type === 'background' && lines(events).length > 3);
    session.send({ id: 'D', text: 'd' });

    expect(lines(events)).toEqual(['user A', 'background [t1]', 'text', 'done failed', 'dropped B,C', 'notice t1 stopped', 'background []', 'dropped D']);
    expect(events.find((e) => e.type === 'done')).toEqual({ type: 'done', status: 'failed', error: 'Claude Code exited before finishing the turn' });
    expect(events.find((e) => e.type === 'dropped')).toEqual({ type: 'dropped', ids: ['B', 'C'], error: 'Claude Code exited' });
    expect(events.find((e) => e.type === 'notice')).toEqual({ type: 'notice', task: 't1', description: 'Count', status: 'stopped', text: 'The agent process exited' });
  });

  it('fails the running turn with the error the stream ended on', async () => {
    const cli = new FakeClaude().manual();
    const { session, events } = await open(cli);
    session.send({ id: 'A', text: 'hello' });
    await until(() => cli.sent.length === 1);
    cli.emit(replay(cli.sent[0]!));
    cli.exit(new Error('Claude Code process exited with code 1'));
    await until(() => events.at(-1)?.type === 'background');

    expect(events).toEqual([
      { type: 'user', id: 'A' },
      { type: 'done', status: 'failed', error: 'Claude Code process exited with code 1' },
      { type: 'background', tasks: [] },
    ]);
  });

  it('emits nothing after close, and closes the CLI process', async () => {
    const cli = new FakeClaude().manual();
    const { session, events } = await open(cli);
    session.send({ id: 'A', text: 'hello' });
    await until(() => cli.sent.length === 1);

    await session.close();
    session.send({ id: 'B', text: 'again' });
    await until(() => true);

    expect(cli.closed).toBe(true);
    expect(events).toEqual([]);
  });

  it("reports the title Claude Code wrote for the session's conversation", async () => {
    const configDir = mkdtempSync(path.join(tmpdir(), 'vicher-claude-config-'));
    const previous = process.env.CLAUDE_CONFIG_DIR;
    process.env.CLAUDE_CONFIG_DIR = configDir;
    try {
      const session = await new ClaudeAgent(new FakeClaude().query).openSession(SESSION);
      expect(await session.title?.()).toBeUndefined();

      mkdirSync(path.join(configDir, 'projects', '-vault'), { recursive: true });
      writeFileSync(path.join(configDir, 'projects', '-vault', `${session.id}.jsonl`), JSON.stringify({ type: 'ai-title', aiTitle: 'Greeting the student' }));

      expect(await session.title?.()).toBe('Greeting the student');
    } finally {
      if (previous === undefined) delete process.env.CLAUDE_CONFIG_DIR;
      else process.env.CLAUDE_CONFIG_DIR = previous;
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  it('sends an attached image as a base64 block ahead of the text', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'vicher-claude-'));
    const file = path.join(dir, 'figure.png');
    writeFileSync(file, Buffer.from('not really a png'));
    const cli = new FakeClaude([completed, completed]);
    const { session, events } = await open(cli);

    try {
      session.send({ id: 'A', text: 'What is this?', images: [{ path: file, mediaType: 'image/png' }] });
      session.send({ id: 'B', text: 'And now?' });
      await until(() => doneCount(events) === 2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }

    expect(cli.sent.map((m) => m.message.content)).toEqual([
      [
        { type: 'image', source: { type: 'base64', media_type: 'image/png', data: Buffer.from('not really a png').toString('base64') } },
        { type: 'text', text: 'What is this?' },
      ],
      'And now?',
    ]);
  });

  it('drops a message whose image cannot be read, and sends the next one', async () => {
    const cli = new FakeClaude([completed]);
    const { session, events } = await open(cli);

    session.send({ id: 'A', text: 'What is this?', images: [{ path: '/no/such/figure.png', mediaType: 'image/png' }] });
    session.send({ id: 'B', text: 'Try again.' });
    await until(() => doneCount(events) === 1);

    expect(events[0]).toEqual({ type: 'dropped', ids: ['A'], error: expect.stringContaining('ENOENT') });
    expect(lines(events)).toEqual(['dropped A', 'user B', 'text', 'usage', 'done completed']);
    expect(cli.sent.map((m) => m.uuid)).toEqual(['B']);
  });

  it('completes the turn without usage when the CLI cannot report it', async () => {
    const cli = new FakeClaude([completed]);
    cli.usage = new Error('unavailable');
    const { session, events } = await open(cli);

    session.send({ id: 'A', text: 'Greet the student.' });
    await until(() => doneCount(events) === 1);

    expect(events.some((e) => e.type === 'usage')).toBe(false);
    expect(events.at(-1)).toEqual({ type: 'done', status: 'completed' });
  });

  it('reports thinking when a tool-use or thinking block starts, and each tool call as running, then done', async () => {
    const cli = new FakeClaude([toolTurn as SDKMessage[]]);
    const { session, events } = await open(cli, { cwd: '/private/tmp/vicher-capture' });

    session.send({ id: 'A', text: 'What does the pin count track?' });
    await until(() => doneCount(events) === 1);

    const kinds = events.map((e) => (e.type === 'tool' ? `tool ${e.status}` : e.type));
    expect(kinds.filter((kind, i) => kind !== kinds[i - 1])).toEqual([
      'user', 'thinking', 'tool running', 'tool done', 'thinking', 'text', 'usage', 'done',
    ]);
  });

  describe('with a tool of its own', () => {
    const loadPack: AgentTool = {
      name: 'load_pack',
      description: 'Get a pack.',
      argument: { name: 'name', values: ['plot'] },
      run: () => 'the pack',
      title: (name) => `Loaded the ${name} visuals`,
    };

    it('hands the CLI the tool and lets it run without asking', async () => {
      const cli = new FakeClaude();
      const server = { type: 'sdk', name: 'vicher' };
      const offered: AgentTool[][] = [];
      const agent = new ClaudeAgent(cli.query, async (tools) => {
        offered.push(tools);
        return { mcpServers: { vicher: server as never }, allowedTools: ['mcp__vicher__load_pack'] };
      });

      await agent.openSession({ ...SESSION, tools: [loadPack] });

      expect(offered).toEqual([[loadPack]]);
      expect(cli.options?.mcpServers).toEqual({ vicher: server });
      expect(cli.options?.allowedTools).toEqual(['mcp__vicher__load_pack']);
    });

    it('starts no tool server for a session with no tools', async () => {
      const cli = new FakeClaude();
      const agent = new ClaudeAgent(cli.query, async () => { throw new Error('no server wanted'); });

      await agent.openSession(SESSION);

      expect(cli.options?.mcpServers).toBeUndefined();
      expect(cli.options?.allowedTools).toBeUndefined();
    });

    it("titles a call to it with the tool's own line", async () => {
      const messages = (toolTurn as SDKMessage[]).map((message) => {
        if (message.type !== 'assistant') return message;
        const content = (message.message.content as { type: string }[]).map((block) => (block.type === 'tool_use' ? { ...block, name: 'mcp__vicher__load_pack', input: { name: 'plot' } } : block));
        return { ...message, message: { ...message.message, content } };
      }) as SDKMessage[];
      const cli = new FakeClaude([messages]);
      const session = await new ClaudeAgent(cli.query, async () => ({})).openSession({ ...SESSION, tools: [loadPack] });
      const events: AgentEvent[] = [];
      session.subscribe((event) => events.push(event));

      session.send({ id: 'A', text: 'Plot sin x.' });
      await until(() => doneCount(events) === 1);

      expect(events.filter((e) => e.type === 'tool').map((e) => e.type === 'tool' && [e.name, e.title, e.status])).toEqual([
        ['load_pack', 'Loaded the plot visuals', 'running'],
        ['load_pack', 'Loaded the plot visuals', 'done'],
      ]);
    });
  });

  it('inherits Claude Code settings and permissions, asks for replays and installs the approval relay', async () => {
    const cli = new FakeClaude();

    await new ClaudeAgent(cli.query).openSession(SESSION);

    const options = cli.options!;
    expect(options.settingSources).toBeUndefined();
    expect(options.strictMcpConfig).toBeUndefined();
    expect(options.extraArgs).toEqual({ 'replay-user-messages': null });
    expect(options.tools).toEqual({ type: 'preset', preset: 'claude_code' });
    expect(options.permissionMode).toBeUndefined();
    expect(options.allowDangerouslySkipPermissions).toBeUndefined();
    expect(options.canUseTool).toEqual(expect.any(Function));
    expect(options.persistSession).toBeUndefined();
    expect(options.systemPrompt).toEqual({ type: 'preset', preset: 'claude_code', append: SESSION.systemPrompt });
    expect(options.model).toBe('haiku');
    expect(options.effort).toBe('low');
    expect(options.cwd).toBe(SESSION.cwd);
    expect(options.pathToClaudeCodeExecutable).toBe(process.execPath);
  });

  it('adds the student\'s environment variables to the CLI process, over inherited ones and under PATH', async () => {
    const cli = new FakeClaude();
    let userEnv: Record<string, string> = { ANTHROPIC_API_KEY: 'sk-ant-test', HOME: '/custom-home', PATH: '/ignored' };
    const agent = new ClaudeAgent(cli.query, undefined, () => userEnv);

    await agent.openSession(SESSION);

    const env = cli.options!.env!;
    expect(env.ANTHROPIC_API_KEY).toBe('sk-ant-test');
    expect(env.HOME).toBe('/custom-home');
    expect(env.PATH).not.toBe('/ignored');

    userEnv = { ANTHROPIC_API_KEY: 'changed' };
    await agent.openSession(SESSION);
    expect(cli.options!.env!.ANTHROPIC_API_KEY).toBe('changed');
  });

  it('passes a permission override to the CLI as its native mode', async () => {
    const cli = new FakeClaude();
    await new ClaudeAgent(cli.query).openSession({ ...SESSION, permissionPolicy: 'bypass' });
    expect(cli.options!.permissionMode).toBe('bypassPermissions');
    expect(cli.options!.allowDangerouslySkipPermissions).toBe(true);
    expect(cli.options!.canUseTool).toBeUndefined();

    await new ClaudeAgent(cli.query).openSession({ ...SESSION, permissionPolicy: 'auto' });
    expect(cli.options!.extraArgs).toEqual({ 'enable-auto-mode': null, 'replay-user-messages': null });
  });

  describe('approvals', () => {
    const ask = (cli: FakeClaude) => cli.options!.canUseTool!('Edit', { file_path: '/vault/note.md', old_string: 'before', new_string: 'after' }, {
      toolUseID: 'edit', requestId: 'request', signal: new AbortController().signal,
    });
    const approvalOf = (events: AgentEvent[]) => events.find((e): e is Extract<AgentEvent, { type: 'approval' }> => e.type === 'approval')!;

    async function running(): Promise<{ cli: FakeClaude; session: AgentSession; events: AgentEvent[] }> {
      const cli = new FakeClaude().manual();
      const { session, events } = await open(cli);
      session.send({ id: 'A', text: 'Edit the note' });
      await until(() => cli.sent.length === 1);
      cli.emit(replay(cli.sent[0]!));
      await until(() => events.length === 1);
      return { cli, session, events };
    }

    it('asks the student and passes the answer to the CLI', async () => {
      const { cli, events } = await running();
      const pending = ask(cli);
      approvalOf(events).answer(true);
      expect(await pending).toMatchObject({ behavior: 'allow' });
    });

    it('cancels a pending request when the turn is interrupted', async () => {
      const { cli, session, events } = await running();
      const pending = ask(cli);
      session.interrupt();
      expect(approvalOf(events).signal.aborted).toBe(true);
      expect(await pending).toMatchObject({ behavior: 'deny', interrupt: true });
    });

    it('cancels a pending request when the session closes', async () => {
      const { cli, session, events } = await running();
      const pending = ask(cli);
      await session.close();
      expect(approvalOf(events).signal.aborted).toBe(true);
      approvalOf(events).answer(true);
      expect(await pending).toMatchObject({ behavior: 'deny', interrupt: true });
    });

    it('cancels a pending request when its turn ends', async () => {
      const { cli, events } = await running();
      const pending = ask(cli);
      cli.emit(RESULT);
      expect(await pending).toMatchObject({ behavior: 'deny', interrupt: true });
      expect(events.at(-1)).toEqual({ type: 'done', status: 'completed' });
    });

    it('starts a CLI turn for a request that comes while none runs', async () => {
      const cli = new FakeClaude().manual();
      const { events } = await open(cli);
      const pending = ask(cli);
      approvalOf(events).answer(false);
      expect(await pending).toMatchObject({ behavior: 'deny', interrupt: false });
      cli.emit(RESULT);
      await until(() => doneCount(events) === 1);
      expect(lines(events)).toEqual(['approval', 'usage', 'done completed']);
    });

    it('declines a request once the session is closed', async () => {
      const cli = new FakeClaude();
      const { session } = await open(cli);
      await session.close();
      expect(await ask(cli)).toMatchObject({ behavior: 'deny' });
    });

    it('asks the student a question in the running turn', async () => {
      const { cli, events } = await running();
      const pending = cli.options!.canUseTool!('AskUserQuestion', { questions: [{ question: 'Which proof?', header: 'Proof', options: [{ label: 'Induction' }], multiSelect: false }] }, {
        toolUseID: 'ask', requestId: 'request', signal: new AbortController().signal,
      });
      const question = events.find((e) => e.type === 'question');
      expect(question).toBeDefined();
      if (question?.type === 'question') question.answer([['Induction']]);
      expect(await pending).toMatchObject({ behavior: 'allow', updatedInput: { answers: { 'Which proof?': 'Induction' } } });
    });
  });

  it('starts a conversation under a fresh id that a later session can resume', async () => {
    const cli = new FakeClaude();

    const first = await new ClaudeAgent(cli.query).openSession(SESSION);

    expect(first.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(cli.options!.sessionId).toBe(first.id);
    expect(cli.options!.resume).toBeUndefined();

    const resumed = await new ClaudeAgent(cli.query).openSession({ ...SESSION, resume: first.id });

    expect(resumed.id).toBe(first.id);
    expect(cli.options!.resume).toBe(first.id);
    expect(cli.options!.sessionId).toBeUndefined();
  });

  it('rejects, and closes the process, when the CLI no longer has the session to resume', async () => {
    const configDir = mkdtempSync(path.join(tmpdir(), 'vicher-claude-config-'));
    try {
      const cli = new FakeClaude();
      cli.startError = new Error('Claude Code process exited with code 1');

      const opened = new ClaudeAgent(cli.query, undefined, () => ({ CLAUDE_CONFIG_DIR: configDir })).openSession({ ...SESSION, resume: 'gone' });

      await expect(opened).rejects.toBeInstanceOf(ConversationNotFoundError);
      expect(cli.closed).toBe(true);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  it('reports any other resume failure as itself while the conversation is still on disk', async () => {
    const configDir = mkdtempSync(path.join(tmpdir(), 'vicher-claude-config-'));
    try {
      mkdirSync(path.join(configDir, 'projects', '-vault'), { recursive: true });
      writeFileSync(path.join(configDir, 'projects', '-vault', 'kept.jsonl'), '{}');
      const cli = new FakeClaude();
      cli.startError = new Error('No conversation found with session ID: kept');

      const opened = new ClaudeAgent(cli.query, undefined, () => ({ CLAUDE_CONFIG_DIR: configDir })).openSession({ ...SESSION, resume: 'kept' });

      await expect(opened).rejects.toThrow('No conversation found');
      await expect(opened).rejects.not.toBeInstanceOf(ConversationNotFoundError);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  it('leaves model and effort to the CLI when the chat picks Auto', async () => {
    const cli = new FakeClaude();

    await new ClaudeAgent(cli.query).openSession({ ...SESSION, model: undefined, effort: undefined });

    expect(cli.options!.model).toBeUndefined();
    expect(cli.options!.effort).toBeUndefined();
  });

  it('switches model and effort on the open session, and back to the defaults', async () => {
    const cli = new FakeClaude();
    const session = await new ClaudeAgent(cli.query).openSession(SESSION);

    await session.setModel('opus', 'xhigh');
    await session.setModel(undefined, undefined);

    expect(cli.controls).toEqual([
      { setModel: 'opus' }, { applyFlagSettings: { effortLevel: 'xhigh' } },
      { setModel: undefined }, { applyFlagSettings: { effortLevel: null } },
    ]);
    expect(cli.queries).toBe(1);
  });

  it('fails the turn with the CLI\'s message when the user is logged out', async () => {
    const cli = new FakeClaude([loggedOutTurn as SDKMessage[]]);
    const { session, events } = await open(cli);

    session.send({ id: 'A', text: 'hello' });
    await until(() => doneCount(events) === 1);

    expect(events).toEqual([{ type: 'user', id: 'A' }, { type: 'done', status: 'failed', error: 'Not logged in · Please run /login' }]);
  });

  it('says what the CLI wrote to stderr when it exits mid-turn', async () => {
    const cli = new FakeClaude().manual();
    const { session, events } = await open(cli);
    const child = cli.options!.spawnClaudeCodeProcess!({
      command: process.execPath, args: ['-e', 'process.stderr.write("Error: invalid API key")'], cwd: process.cwd(), env: {}, signal: new AbortController().signal,
    }) as unknown as import('child_process').ChildProcess;
    await new Promise((resolve) => child.on('close', resolve));

    session.send({ id: 'A', text: 'Hi' });
    await until(() => cli.sent.length === 1);
    cli.emit(replay(cli.sent[0]!));
    cli.exit();
    await until(() => doneCount(events) === 1);

    expect(events.find((e) => e.type === 'done')).toEqual({ type: 'done', status: 'failed', error: 'Claude Code exited before finishing the turn', detail: 'Error: invalid API key' });
  });
});

describe('ClaudeAgent skills', () => {
  it('lists the student\'s skills from the open session, without Claude Code\'s own, and starts no other process', async () => {
    const cli = new FakeClaude();
    const session = await new ClaudeAgent(cli.query).openSession(SESSION);

    expect(await session.skills()).toEqual([
      { name: 'zebra', description: 'Answer with a fixed word.', argumentHint: undefined },
      { name: 'outline', description: 'Outline a note.', argumentHint: '<note>' },
    ]);
    expect(cli.queries).toBe(1);
  });
});

describe('ClaudeAgent models', () => {
  it('lists each family once, on its latest version, with the default marked', async () => {
    const cli = new FakeClaude();

    const models = await new ClaudeAgent(cli.query).models(process.execPath);

    const efforts = ['low', 'medium', 'high', 'xhigh', 'max'];
    expect(models).toEqual([
      { id: 'opus', name: 'Opus', efforts, isDefault: false },
      { id: 'fable', name: 'Fable', efforts, isDefault: false },
      { id: 'sonnet', name: 'Sonnet', efforts, isDefault: true },
      { id: 'haiku', name: 'Haiku', efforts, isDefault: false },
    ]);
  });

  it('lists models from a process with no setting sources, then closes it', async () => {
    const cli = new FakeClaude();

    await new ClaudeAgent(cli.query).models(process.execPath);

    expect(cli.options!.settingSources).toEqual([]);
    expect(cli.options!.persistSession).toBe(false);
    expect(cli.closed).toBe(true);
  });
});

it('mentions a file by its quoted path, and carries one whose path holds a quote', () => {
  const agent = new ClaudeAgent();
  expect(agent.fileMention('/v/My Notes.md')).toBe('@"/v/My Notes.md"');
  expect(agent.fileMention('/v/say "hi".md')).toBeUndefined();
});
