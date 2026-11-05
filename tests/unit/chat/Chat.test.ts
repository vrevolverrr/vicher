import type { Mock } from 'vitest';
import type { AgentAdapter, AgentEvent, AgentMessage, AgentSession, AgentSessionOptions, ModelOption } from '@/agents/types';
import type { ChatContext } from '@/context/ChatContext';
import { ChatDefaults } from '@/chat/ChatDefaults';
import { Chat, type ChatEvents, type ChatView } from '@/chat/Chat';
import type { ChatRecord } from '@/chat/ChatRecord';
import { ChatStore } from '@/chat/ChatStore';

/** Stands in for an agent session: records what it was sent, and emits what the test tells it to. */
interface FakeSession extends AgentSession {
  options: AgentSessionOptions;
  sent: AgentMessage[];
  emit(...events: AgentEvent[]): void;
  interrupt: Mock;
  stopTask: Mock;
  setModel: Mock;
  close: Mock;
}

const ID = '00000000-0000-4000-8000-000000000001';
const option = (id: string, name: string): ModelOption => ({ id, name }) as ModelOption;
const settle = async (): Promise<void> => { for (let i = 0; i < 50; i++) await Promise.resolve(); };

function fakeSession(id: string, options: AgentSessionOptions, title?: string): FakeSession {
  const listeners = new Set<(event: AgentEvent) => void>();
  return {
    id, options, sent: [],
    subscribe: (listener) => { listeners.add(listener); return () => void listeners.delete(listener); },
    emit: (...events) => { for (const event of events) listeners.forEach((listener) => listener(event)); },
    send(message) { this.sent.push(message); },
    interrupt: vi.fn(), stopTask: vi.fn(async () => undefined), started: async () => undefined,
    ...(title ? { title: async () => title } : {}),
    skills: async () => [], setModel: vi.fn(async () => undefined), close: vi.fn(async () => undefined),
  };
}

function setup(record: Partial<ChatRecord> = {}, title?: string, claudeModels: Promise<ModelOption[]> = Promise.resolve([]), savedDefaults: unknown = {}) {
  const sessions: FakeSession[] = [];
  const adapter = (id: 'claude' | 'codex'): AgentAdapter => ({
    id, skillSyntax: { prefix: id === 'claude' ? '/' : '$', atStart: id === 'claude' }, fileMention: (path) => `@"${path}"`, toolsOnResume: true,
    authState: async () => 'logged-in', models: async () => [],
    openSession: async (options) => {
      const session = fakeSession(`${id}-${sessions.length}`, options, title);
      sessions.push(session);
      return session;
    },
  });
  const defaults = new ChatDefaults(savedDefaults, async () => undefined);
  const disk = new Map<string, string>();
  const store = new ChatStore({
    read: async (path) => disk.get(path) ?? null,
    write: async (path, text) => { disk.set(path, text); },
    list: async () => [...disk.keys()],
    remove: async (path) => { disk.delete(path); },
  });
  const events: { [K in keyof ChatEvents]: Mock } = { changed: vi.fn(), switched: vi.fn(), lost: vi.fn(), notice: vi.fn(), warn: vi.fn() };
  const chat = new Chat({ id: ID, agent: 'claude', title: '', updatedAt: 0, turns: [], ...record }, {
    defaults, agents: { claude: adapter('claude'), codex: adapter('codex') }, models: { claude: claudeModels, codex: Promise.resolve([]) }, store, cwd: '/vault',
  }, events);
  const session = (index = -1): FakeSession => sessions.at(index)!;
  /** The session takes in the last message it was sent, answers `text` and ends the turn. */
  const answer = (text = 'Because.', from = session()): void => {
    from.emit({ type: 'user', id: from.sent.at(-1)!.id }, { type: 'text', delta: text }, { type: 'done', status: 'completed' });
  };
  return { chat, defaults, sessions, session, store, events, answer };
}

/** A view that writes down each call it gets. */
function recordingView(): ChatView & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    pending: (_id, context) => calls.push(`pending:${context.message}`),
    user: (_id, turn) => calls.push(`user:${turn.message}`),
    dropped: (_id, error) => calls.push(`dropped:${error}`),
    agentStart: () => calls.push('start'),
    appendText: (delta) => calls.push(`text:${delta}`),
    act: (step) => calls.push(`act:${step.path}:${step.quote}`),
    tool: (part) => calls.push(`tool:${part.id}`),
    thinking: () => calls.push('thinking'),
    usage: (used, window) => calls.push(`usage:${used}/${window}`),
    notice: (part) => calls.push(`notice:${part.description}`),
    approve: async (request) => { calls.push(`approve:${request.description}`); return true; },
    ask: async () => [['Yes']],
    agentEnd: (turn, index, repairing) => {
      calls.push(`end:${turn.status}:${index}`);
      if (!repairing) calls.push('settle');
    },
    failures: async () => [],
    repair: async (fixes) => fixes,
    settle: () => calls.push('settle'),
    background: (tasks) => calls.push(`background:${tasks.length}`),
  };
}

const context: ChatContext = { message: 'Why is the sky blue?', attachments: [] };
const roles = (chat: Chat) => chat.turns.map((turn) => (turn.role === 'user' ? `user:${turn.message}` : `agent:${turn.status}`));

describe('Chat', () => {
  it('sends the context as the message text, records the message once taken in and the reply once done, and titles the chat from the message', async () => {
    const { chat, session, store, answer } = setup();
    chat.open(); await settle();
    const sending = chat.send({ ...context, note: { path: 'optics.md' } });
    await settle();
    expect(session().sent[0]!.text).toContain('<note path="optics.md"/>');
    answer();
    const turns = await sending;
    await settle();
    const saved = await store.load(ID);
    expect(saved?.turns.map((turn) => turn.role)).toEqual(['user', 'agent']);
    expect(turns).toEqual([saved?.turns[1]]);
    expect(turns[0]).toMatchObject({ parts: [{ type: 'text', text: 'Because.' }], status: 'completed', prompt: expect.stringMatching(/^[0-9a-f]{8}$/) });
    expect(saved?.title).toBe('Why is the sky blue?');
    expect(saved?.sessionId).toBe('claude-0');
  });

  it('takes the title the agent gave the conversation', async () => {
    const { chat, store, answer } = setup({}, 'Rayleigh scattering');
    chat.open(); await settle();
    const sending = chat.send(context);
    await settle(); answer(); await sending; await settle();
    expect((await store.load(ID))?.title).toBe('Rayleigh scattering');
  });

  it('asks an agent that cannot name its conversation for a title on the first message only, and takes it from the first reply only', async () => {
    const { chat, session, store, answer } = setup();
    chat.open(); await settle();
    const first = chat.send(context);
    await settle();
    expect(session().sent[0]!.text).toContain('@Title(');
    answer('Scattering.\n@Title("Blue sky")\n'); await first; await settle();
    const second = chat.send({ ...context, message: 'And at sunset?' });
    await settle();
    expect(session().sent[1]!.text).not.toContain('@Title(');
    answer('Longer path.\n@Title("Sunsets")\n'); await second; await settle();
    const saved = await store.load(ID);
    expect(saved?.title).toBe('Blue sky');
    expect(JSON.stringify(saved?.turns)).not.toContain('@Title');
  });

  it('takes a message sent while a turn runs into it: the running reply ends steered and the next continues it', async () => {
    const { chat, session } = setup();
    chat.open(); await settle();
    const first = chat.send(context);
    await settle();
    session().emit({ type: 'user', id: session().sent[0]!.id }, { type: 'text', delta: 'Light scat' });
    const second = chat.send({ ...context, message: 'Shorter please' });
    await settle();
    expect(session().sent).toHaveLength(2);
    session().emit({ type: 'user', id: session().sent[1]!.id }, { type: 'text', delta: 'Scattering.' }, { type: 'done', status: 'completed' });
    expect(roles(chat)).toEqual(['user:Why is the sky blue?', 'agent:steered', 'user:Shorter please', 'agent:completed']);
    expect((await first).map((turn) => turn.status)).toEqual(['steered']);
    expect((await second).map((turn) => turn.status)).toEqual(['completed']);
  });

  it('does not resolve a message between its taking in and the reply, and resolves at idle with only its own turns', async () => {
    const { chat, session } = setup();
    chat.open(); await settle();
    let done = false;
    const first = chat.send(context).then((turns) => { done = true; return turns; });
    const second = chat.send({ ...context, message: 'And at sunset?' });
    await settle();
    const [a, b] = session().sent;
    session().emit({ type: 'user', id: a!.id });
    await settle();
    expect(done).toBe(false);
    session().emit({ type: 'text', delta: 'One.' }, { type: 'done', status: 'completed' });
    await settle();
    expect(done).toBe(false);
    session().emit({ type: 'user', id: b!.id }, { type: 'text', delta: 'Two.' }, { type: 'done', status: 'completed' });
    expect((await first).map((turn) => turn.parts)).toEqual([[{ type: 'text', text: 'One.' }]]);
    expect((await second).map((turn) => turn.parts)).toEqual([[{ type: 'text', text: 'Two.' }]]);
  });

  it('records a reply the agent starts on its own, and ignores a message id it never sent', async () => {
    const { chat, session } = setup();
    const view = recordingView();
    chat.attach(view);
    chat.open(); await settle();
    const sending = chat.send(context);
    await settle();
    session().emit({ type: 'user', id: 'someone-else' }, { type: 'text', delta: 'Done in the background.' }, { type: 'done', status: 'completed' });
    expect(roles(chat)).toEqual(['agent:completed']);
    expect(chat.pending).toHaveLength(1);
    expect(view.calls).toEqual(['pending:Why is the sky blue?', 'start', 'text:Done in the background.', 'end:completed:0', 'settle']);
    session().emit({ type: 'user', id: session().sent[0]!.id }, { type: 'done', status: 'completed' });
    expect(await sending).toEqual([]);
  });

  it('shows a task notice without recording it', async () => {
    const { chat, session } = setup();
    const view = recordingView();
    chat.attach(view);
    chat.open(); await settle();
    void chat.send(context);
    await settle();
    session().emit({ type: 'user', id: session().sent[0]!.id }, { type: 'text', delta: 'Waiting.' },
      { type: 'notice', task: 't1', description: 'Review ch6', status: 'completed', text: 'Two typos.' }, { type: 'done', status: 'completed' });
    expect(view.calls).toContain('notice:Review ch6');
    expect(chat.turns.filter((turn) => turn.role === 'agent').map((turn) => turn.parts.map((part) => part.type))).toEqual([['text']]);
  });

  it('shows a failure with no output as an empty failed turn, logs its detail without saving it, and ignores a bare completed end', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { chat, session } = setup();
    chat.open(); await settle();
    void chat.send(context);
    await settle();
    session().emit({ type: 'user', id: session().sent[0]!.id }, { type: 'done', status: 'completed' });
    expect(roles(chat)).toEqual(['user:Why is the sky blue?']);
    session().emit({ type: 'done', status: 'failed', error: 'Not signed in', detail: 'stderr text' });
    expect(chat.turns.at(-1)).toMatchObject({ role: 'agent', parts: [], status: 'failed', error: 'Not signed in' });
    expect(JSON.stringify(chat.record)).not.toContain('stderr text');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('stderr text'));
    log.mockRestore();
  });

  it('shows usage without opening a reply, and hands approvals to the view, denying them with no view', async () => {
    const { chat, session } = setup();
    chat.open(); await settle();
    void chat.send(context);
    await settle();
    session().emit({ type: 'usage', used: 10, window: 100 });
    expect(chat.turns).toEqual([]);
    const request = { description: 'this command', input: {}, fields: [], changes: [] };
    const answers: boolean[] = [];
    session().emit({ type: 'approval', request, signal: new AbortController().signal, answer: (approved) => answers.push(approved) });
    const view = recordingView();
    chat.attach(view);
    session().emit({ type: 'approval', request, signal: new AbortController().signal, answer: (approved) => answers.push(approved) });
    await settle();
    expect(answers).toEqual([false, true]);
    expect(view.calls).toEqual(['approve:this command']);
  });

  it('rejects a dropped message and tells the view, which saw it pending in send order', async () => {
    const { chat, session } = setup();
    const view = recordingView();
    chat.attach(view);
    chat.open(); await settle();
    const first = chat.send(context);
    const second = chat.send({ ...context, message: 'Second' });
    expect(chat.pending.map(({ message }) => message)).toEqual(['Why is the sky blue?', 'Second']);
    await settle();
    session().emit({ type: 'dropped', ids: session().sent.map(({ id }) => id), error: 'Claude Code exited' });
    await expect(first).rejects.toThrow('Claude Code exited');
    await expect(second).rejects.toThrow('Claude Code exited');
    expect(view.calls).toEqual(['pending:Why is the sky blue?', 'pending:Second', 'dropped:Claude Code exited', 'dropped:Claude Code exited']);
    expect(chat.turns).toEqual([]);
  });

  it('points a highlight at the note it names, else the note of the message taken in last, and drops one with neither', async () => {
    const { chat, session } = setup();
    chat.open(); await settle();
    session().emit({ type: 'text', delta: '@Highlight("blue light scatters", "Why")\n' }, { type: 'done', status: 'completed' });
    void chat.send({ ...context, note: { path: 'optics.md' } });
    await settle();
    session().emit(
      { type: 'user', id: session().sent[0]!.id },
      { type: 'text', delta: 'Look:\n@Highlight("blue light scatters", "Why")\n@Highlight("speed changes", "There", "waves.md")\n' },
      { type: 'done', status: 'completed' },
    );
    const parts = chat.turns.flatMap((turn) => (turn.role === 'agent' ? turn.parts : []));
    expect(parts.filter((part) => part.type === 'highlight')).toEqual([
      { type: 'highlight', step: { path: 'optics.md', quote: 'blue light scatters', comment: 'Why' } },
      { type: 'highlight', step: { path: 'waves.md', quote: 'speed changes', comment: 'There' } },
    ]);
    expect(JSON.stringify(parts)).not.toContain('@Highlight');
  });

  it('saves after each message taken in and each reply ended', async () => {
    const { chat, store, answer } = setup();
    chat.open(); await settle();
    const save = vi.spyOn(store, 'save');
    const sending = chat.send(context);
    await settle(); answer(); await sending; await settle();
    expect(save.mock.calls.map(([saved]) => saved.turns.length)).toEqual([1, 2]);
  });

  it('settles once no turn runs, no message is pending and no background task runs', async () => {
    const { chat, session, answer } = setup();
    chat.open(); await settle();
    let settled = false;
    const sending = chat.send(context);
    await settle();
    void chat.settled().then(() => { settled = true; });
    session().emit({ type: 'background', tasks: [{ id: 't1', description: 'Review ch6' }] });
    answer();
    await sending; await settle();
    expect(settled).toBe(false);
    expect(chat.background).toEqual([{ id: 't1', description: 'Review ch6' }]);
    session().emit({ type: 'background', tasks: [] });
    await settle();
    expect(settled).toBe(true);
  });

  it('reports the tasks a restart ends as stopped, not finished', async () => {
    const { chat, session } = setup();
    const view = recordingView();
    chat.attach(view);
    chat.open(); await settle();
    session().emit({ type: 'background', tasks: [{ id: 't1', description: 'Review ch6' }] });
    view.calls.length = 0;
    await chat.restart(); await settle();
    expect(view.calls).toEqual(['notice:Review ch6', 'background:0']);
  });

  it('stops the running turn through the session and a task by its id, leaving pending messages to run', async () => {
    const { chat, session } = setup();
    chat.open(); await settle();
    void chat.send(context);
    await settle();
    chat.stop();
    await chat.stopTask('t1');
    expect(session().interrupt).toHaveBeenCalledTimes(1);
    expect(session().stopTask).toHaveBeenCalledWith('t1');
    expect(chat.pending).toHaveLength(1);
  });

  it('applies a permission change once idle, holding messages sent meanwhile for the new session', async () => {
    const { chat, sessions, store, answer } = setup();
    chat.open(); await settle();
    const first = chat.send(context);
    await settle();
    const changing = chat.choosePermission('approval');
    await settle();
    const held = chat.send({ ...context, message: 'Held' });
    await settle();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.sent).toHaveLength(1);
    answer('Because.', sessions[0]); await first; await changing; await settle();
    expect(sessions).toHaveLength(2);
    expect(sessions[1]!.options).toMatchObject({ resume: 'claude-0', permissionPolicy: 'approval' });
    expect(sessions[1]!.sent.map(({ text }) => text)).toEqual([expect.stringContaining('Held')]);
    expect((await store.load(ID))?.permissionPolicy).toBe('approval');
    answer('Ok.', sessions[1]);
    expect((await held).map((turn) => turn.status)).toEqual(['completed']);
  });

  it('replaces the session once idle after a failed turn, resuming the same conversation', async () => {
    const { chat, sessions, session } = setup();
    chat.open(); await settle();
    const sending = chat.send(context);
    await settle();
    session().emit({ type: 'user', id: session().sent[0]!.id }, { type: 'done', status: 'failed', error: 'Claude Code exited before finishing the turn' });
    await sending; await settle();
    expect(chat.failed).toBe(true);
    expect(sessions).toHaveLength(2);
    expect(sessions[1]!.options).toMatchObject({ resume: 'claude-0' });
    expect(sessions[0]!.close).toHaveBeenCalledTimes(1);
  });

  it('rejects pending messages on close and keeps the reply being written as stopped', async () => {
    const { chat, session } = setup();
    chat.open(); await settle();
    const first = chat.send(context);
    const second = chat.send({ ...context, message: 'Second' });
    await settle();
    session().emit({ type: 'user', id: session().sent[0]!.id }, { type: 'text', delta: 'Part' });
    await chat.close();
    await expect(second).rejects.toThrow('The chat is closed');
    expect((await first).map((turn) => turn.status)).toEqual(['interrupted']);
    expect(session().close).toHaveBeenCalled();
  });

  it('does not save an empty chat when its policy changes', async () => {
    const { chat, sessions, store } = setup();
    chat.open(); await settle();
    const save = vi.spyOn(store, 'save');
    await chat.choosePermission('bypass');
    expect(save).not.toHaveBeenCalled();
    expect(sessions.at(-1)!.options.permissionPolicy).toBe('bypass');
  });

  it('moves to another agent without the old conversation', async () => {
    const { chat, sessions, events } = setup({ sessionId: 'old' });
    chat.open(); await settle();
    await chat.choose('codex', {});
    expect(chat.agent).toBe('codex');
    expect(chat.record).toMatchObject({ agent: 'codex', sessionId: undefined });
    expect(events.switched).toHaveBeenCalledTimes(1);
    expect(sessions.at(-1)!.options.resume).toBeUndefined();
    expect(sessions[0]!.close).toHaveBeenCalledTimes(1);
  });

  it('switches agents only once the running turn ends', async () => {
    const { chat, sessions, answer } = setup();
    chat.open(); await settle();
    const sending = chat.send(context);
    await settle();
    const switching = chat.choose('codex', {});
    await settle();
    expect(chat.agent).toBe('claude');
    answer('Because.', sessions[0]); await sending; await switching;
    expect(chat.agent).toBe('codex');
  });

  it('saves an agent switch of a chat with turns, and not of an empty one', async () => {
    const turns = [{ role: 'user' as const, message: 'q', at: 1 }];
    const kept = setup({ sessionId: 'old', turns });
    kept.chat.open(); await settle();
    await kept.chat.choose('codex', {});
    expect(await kept.store.load(ID)).toMatchObject({ agent: 'codex', sessionId: undefined, choice: {} });

    const empty = setup();
    empty.chat.open(); await settle();
    const save = vi.spyOn(empty.store, 'save');
    await empty.chat.choose('codex', {});
    expect(save).not.toHaveBeenCalled();
  });

  it('saves a model choice of a chat with turns', async () => {
    const { chat, store } = setup({ turns: [{ role: 'user', message: 'q', at: 1 }] });
    chat.open(); await settle();
    await chat.choose('claude', { model: 'opus' });
    expect((await store.load(ID))?.choice).toEqual({ model: 'opus' });
  });

  it('records a scripted session through the same path, with no prompt id', async () => {
    const { chat, sessions } = setup();
    chat.open(); await settle();
    const scripted = fakeSession('demo', {} as AgentSessionOptions);
    const playing = chat.play(context, scripted);
    await settle();
    expect(scripted.sent[0]!.text).toBe(context.message);
    scripted.emit({ type: 'user', id: scripted.sent[0]!.id }, { type: 'text', delta: 'Scripted.' }, { type: 'done', status: 'completed' });
    const turns = await playing;
    expect(sessions[0]!.sent).toEqual([]);
    expect(turns).toMatchObject([{ parts: [{ type: 'text', text: 'Scripted.' }] }]);
    expect(turns[0]!.prompt).toBeUndefined();
  });

  it('applies a model choice to the open session when the agent stays', async () => {
    const { chat, sessions, events } = setup();
    chat.open(); await settle();
    await chat.choose('claude', { model: 'opus' });
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.setModel).toHaveBeenCalledWith('opus', undefined);
    expect(chat.choice('claude')).toEqual({ model: 'opus' });
    expect(events.switched).not.toHaveBeenCalled();
  });

  it('saves a rating on a reply, and none on a message', async () => {
    const { chat, store, answer } = setup();
    chat.open(); await settle();
    const sending = chat.send(context);
    await settle(); answer(); await sending;
    await chat.rate(1, 'up');
    await chat.rate(0, 'down');
    const saved = await store.load(ID);
    expect(saved?.turns[1]).toMatchObject({ rating: 'up' });
    expect(saved?.turns[0]).not.toHaveProperty('rating');
  });

  describe('model upgrade', () => {
    const models = [option('sonnet-5-5', 'Sonnet')];

    it('moves a saved model to the newest version of its family, and the default with it when the default held the same model', async () => {
      const saved = { choices: { claude: { model: 'sonnet-4', name: 'Sonnet' } } };
      const { chat, defaults, sessions } = setup({}, undefined, Promise.resolve(models), saved);
      chat.open(); await settle();
      expect(chat.choice('claude')).toEqual({ model: 'sonnet-5-5', name: 'Sonnet' });
      expect(defaults.choice('claude')).toEqual({ model: 'sonnet-5-5', name: 'Sonnet' });
      expect(sessions[0]!.setModel).toHaveBeenCalledWith('sonnet-5-5', undefined);
    });

    it('leaves the default alone when it holds another model', async () => {
      const saved = { choices: { claude: { model: 'opus-5', name: 'Opus' } } };
      const { chat, defaults } = setup({ choice: { model: 'sonnet-4', name: 'Sonnet' } }, undefined, Promise.resolve(models), saved);
      chat.open(); await settle();
      expect(chat.choice('claude')).toEqual({ model: 'sonnet-5-5', name: 'Sonnet' });
      expect(defaults.choice('claude')).toEqual({ model: 'opus-5', name: 'Opus' });
    });

    it.each([
      ['is already the newest', { model: 'sonnet-5-5', name: 'Sonnet' }],
      ['has no family the CLI lists', { model: 'x', name: 'Other' }],
      ['was never set', undefined],
    ])('leaves a choice that %s', async (_name, choice) => {
      const { chat, sessions } = setup({ choice }, undefined, Promise.resolve(models));
      chat.open(); await settle();
      expect(chat.choice('claude')).toEqual(choice ?? {});
      expect(sessions[0]!.setModel).not.toHaveBeenCalled();
    });

    it('lets a pick made while the list loaded win', async () => {
      let list!: (options: ModelOption[]) => void;
      const { chat } = setup({ choice: { model: 'sonnet-4', name: 'Sonnet' } }, undefined, new Promise((resolve) => { list = resolve; }));
      chat.open(); await settle();
      await chat.choose('claude', { model: 'sonnet-4', name: 'Sonnet', effort: 'high' });
      list(models); await settle();
      expect(chat.choice('claude')).toEqual({ model: 'sonnet-4', name: 'Sonnet', effort: 'high' });
    });
  });
});

describe('figure repair', () => {
  const BROKEN = 'Look:\n```figure\nbroken\n```\nDone.';
  const FIXED = 'Look:\n```figure\nfixed\n```\nDone.';
  const FIX = '```figure\nfixed\n```';
  const failure = { ordinal: 0, error: 'Step 1: broken' };
  const tool = { type: 'tool', id: 't', name: 'Read', title: 'Read a', status: 'done' } as const;
  const textOf = (chat: Chat): string[] => chat.turns.flatMap((turn) => (turn.role === 'agent' ? turn.parts.flatMap((part) => (part.type === 'text' ? [part.text] : [])) : []));

  /** A chat whose first reply has just ended with `failed` held; `from` is what the view's calls look like from there on. */
  async function replied(failed: { ordinal: number; error: string }[] = [failure], done: AgentEvent = { type: 'done', status: 'completed' }) {
    const harness = setup();
    const { chat, session } = harness;
    const view = recordingView();
    view.failures = async () => failed;
    chat.attach(view);
    chat.open(); await settle();
    const sending = chat.send(context);
    await settle();
    session().emit({ type: 'user', id: session().sent[0]!.id }, { type: 'text', delta: BROKEN }, done);
    const from = view.calls.length;
    await settle();
    /** The id of the repair message. */
    const id = (): string => session().sent[1]!.id;
    const after = (): string[] => view.calls.slice(from);
    return { ...harness, view, sending, id, after };
  }

  it('reads as idle when the view settles, so the view draws no working line', async () => {
    const { chat, session, view, id } = await replied();
    let running: boolean | undefined;
    view.settle = () => { running = chat.running; };
    session().emit({ type: 'user', id: id() }, { type: 'done', status: 'interrupted' });
    await settle();
    expect(running).toBe(false);
  });

  it('sends one hidden message once the reply ends and puts the fix in the saved reply', async () => {
    const { chat, session, store, view, sending, id, after } = await replied();
    expect(session().sent).toHaveLength(2);
    expect(session().sent[1]!.text).toContain('Figure 1 of your last reply failed: Step 1: broken');
    expect(session().sent[1]!.text).not.toContain('<note');
    const drawn = vi.spyOn(view, 'repair');
    let resolved = false;
    void sending.then(() => { resolved = true; });
    session().emit({ type: 'user', id: id() }, { type: 'thinking' }, { type: 'text', delta: FIX });
    await settle();
    expect(chat.running).toBe(true);
    expect(resolved).toBe(false);
    session().emit({ type: 'done', status: 'completed' });
    await settle();
    expect(drawn).toHaveBeenCalledWith(new Map([[0, 'fixed']]));
    expect(after()).toEqual(['settle']);
    expect(roles(chat)).toEqual(['user:Why is the sky blue?', 'agent:completed']);
    expect(textOf(chat)).toEqual([FIXED]);
    expect(chat.running).toBe(false);
    expect((await sending)[0]!.parts).toEqual([{ type: 'text', text: FIXED }]);
    await settle();
    expect(JSON.stringify((await store.load(ID))?.turns)).toContain('fixed');
  });

  it('keeps the failed fence in the record for a fix that did not draw', async () => {
    const { chat, session, view, id } = await replied();
    view.repair = async () => new Map();
    session().emit({ type: 'user', id: id() }, { type: 'text', delta: FIX }, { type: 'done', status: 'completed' });
    await settle();
    expect(textOf(chat)).toEqual([BROKEN]);
  });

  it('applies no fix when the fences do not match the failures', async () => {
    const { chat, session, view, id, after } = await replied([failure, { ordinal: 1, error: 'other' }]);
    const drawn = vi.spyOn(view, 'repair');
    session().emit({ type: 'user', id: id() }, { type: 'text', delta: FIX }, { type: 'done', status: 'completed' });
    await settle();
    expect(drawn).not.toHaveBeenCalled();
    expect(after()).toEqual(['settle']);
    expect(chat.running).toBe(false);
  });

  it('settles a reply with no held failure without calling the model', async () => {
    const { chat, session, sending, after } = await replied([]);
    await sending;
    expect(session().sent).toHaveLength(1);
    expect(after()).toEqual(['settle']);
    expect(chat.running).toBe(false);
  });

  it('holds a message sent during the repair and sends it after', async () => {
    const { chat, session, view, id } = await replied();
    const next = chat.send({ ...context, message: 'Next' });
    await settle();
    expect(session().sent).toHaveLength(2);
    expect(view.calls).toContain('pending:Next');
    session().emit({ type: 'user', id: id() }, { type: 'text', delta: FIX }, { type: 'done', status: 'completed' });
    await settle();
    expect(session().sent).toHaveLength(3);
    expect(session().sent[2]!.text).toContain('Next');
    view.failures = async () => [];
    session().emit({ type: 'user', id: session().sent[2]!.id }, { type: 'text', delta: 'Sure.' }, { type: 'done', status: 'completed' });
    await next;
    expect(roles(chat)).toEqual(['user:Why is the sky blue?', 'agent:completed', 'user:Next', 'agent:completed']);
  });

  describe('runs no repair and settles in the same tick', () => {
    it.each([['interrupted'], ['failed']] as const)('after a reply that ended %s', async (status) => {
      const { session, view } = await replied([failure], { type: 'done', status });
      expect(session(0).sent).toHaveLength(1);
      expect(view.calls).toContain('settle');
    });

    it('with a message with the CLI', async () => {
      const { chat, session } = setup();
      const view = recordingView();
      view.failures = async () => [failure];
      chat.attach(view);
      chat.open(); await settle();
      void chat.send(context);
      await settle();
      session().emit({ type: 'user', id: session().sent[0]!.id }, { type: 'text', delta: BROKEN });
      void chat.send({ ...context, message: 'Next' });
      await settle();
      session().emit({ type: 'done', status: 'completed' });
      expect(view.calls.at(-1)).toBe('settle');
      await settle();
      expect(session().sent).toHaveLength(2);
    });

    it('with a background task running', async () => {
      const { chat, session } = setup();
      const view = recordingView();
      view.failures = async () => [failure];
      chat.attach(view);
      chat.open(); await settle();
      void chat.send(context);
      await settle();
      session().emit({ type: 'user', id: session().sent[0]!.id }, { type: 'background', tasks: [{ id: 'b', description: 'Task' }] as never }, { type: 'text', delta: BROKEN }, { type: 'done', status: 'completed' });
      expect(view.calls.at(-1)).toBe('settle');
      await settle();
      expect(session().sent).toHaveLength(1);
    });

    it('after a reply that continues a steered one', async () => {
      const { chat, session } = setup();
      const view = recordingView();
      view.failures = async () => [failure];
      chat.attach(view);
      chat.open(); await settle();
      void chat.send(context);
      await settle();
      session().emit({ type: 'user', id: session().sent[0]!.id }, { type: 'text', delta: 'Light scat' });
      void chat.send({ ...context, message: 'Next' });
      await settle();
      session().emit({ type: 'user', id: session().sent[1]!.id }, { type: 'text', delta: BROKEN }, { type: 'done', status: 'completed' });
      expect(roles(chat)).toEqual(['user:Why is the sky blue?', 'agent:steered', 'user:Next', 'agent:completed']);
      expect(view.calls.at(-1)).toBe('settle');
      await settle();
      expect(session().sent).toHaveLength(2);
    });

    it('with no view', async () => {
      const { chat, session, answer } = setup();
      chat.open(); await settle();
      const sending = chat.send(context);
      await settle();
      answer(BROKEN);
      await sending;
      expect(session().sent).toHaveLength(1);
    });

    it('on a played session', async () => {
      const { chat, session, sessions } = setup();
      const view = recordingView();
      view.failures = async () => [failure];
      chat.attach(view);
      chat.open(); await settle();
      const played = fakeSession('played', session().options);
      const playing = chat.play(context, played);
      await settle();
      played.emit({ type: 'user', id: played.sent[0]!.id }, { type: 'text', delta: BROKEN }, { type: 'done', status: 'completed' });
      await playing;
      expect(view.calls.at(-1)).toBe('settle');
      expect(played.sent).toHaveLength(1);
      expect(sessions[0]!.sent).toHaveLength(0);
    });
  });

  describe('Stop', () => {
    it('before the message goes out keeps it from being sent', async () => {
      const { chat, session } = setup();
      const view = recordingView();
      let release!: (failed: typeof failure[]) => void;
      view.failures = () => new Promise((resolve) => { release = resolve; });
      chat.attach(view);
      chat.open(); await settle();
      void chat.send(context);
      await settle();
      session().emit({ type: 'user', id: session().sent[0]!.id }, { type: 'text', delta: BROKEN }, { type: 'done', status: 'completed' });
      chat.stop();
      release([failure]);
      await settle();
      expect(session().sent).toHaveLength(1);
      expect(view.calls.at(-1)).toBe('settle');
      expect(chat.running).toBe(false);
    });

    it('after the message goes out interrupts again when it is taken in, and shows nothing until done', async () => {
      const { chat, session, id, after } = await replied();
      chat.stop();
      expect(session().interrupt).toHaveBeenCalledTimes(1);
      session().emit({ type: 'user', id: id() });
      expect(session().interrupt).toHaveBeenCalledTimes(2);
      session().emit({ type: 'text', delta: FIX });
      await settle();
      expect(after()).toEqual([]);
      session().emit({ type: 'done', status: 'interrupted' });
      await settle();
      expect(after()).toEqual(['settle']);
      expect(textOf(chat)).toEqual([BROKEN]);
    });

    it('after the message is taken in ends the hidden turn with no fix', async () => {
      const { chat, session, id, after } = await replied();
      const next = chat.send({ ...context, message: 'Next' });
      await settle();
      session().emit({ type: 'user', id: id() }, { type: 'text', delta: FIX });
      chat.stop();
      expect(session().interrupt).toHaveBeenCalledTimes(1);
      await settle();
      expect(session().sent).toHaveLength(2);
      session().emit({ type: 'done', status: 'interrupted' });
      await settle();
      expect(after()).toContain('settle');
      expect(textOf(chat)).toEqual([BROKEN]);
      expect(session().sent).toHaveLength(3);
      void next;
    });

    it('during the draw leaves a fix that drew to be saved', async () => {
      const { chat, session, view, id } = await replied();
      let release!: (drawn: ReadonlyMap<number, string>) => void;
      view.repair = () => new Promise((resolve) => { release = resolve; });
      session().emit({ type: 'user', id: id() }, { type: 'text', delta: FIX }, { type: 'done', status: 'completed' });
      await settle();
      chat.stop();
      release(new Map([[0, 'fixed']]));
      await settle();
      expect(textOf(chat)).toEqual([FIXED]);
    });
  });

  it('ends with no fix on a failed hidden turn, and restarts before the waiting message goes out', async () => {
    const { chat, session, sessions, id, after } = await replied();
    const next = chat.send({ ...context, message: 'Next' });
    await settle();
    session().emit({ type: 'user', id: id() }, { type: 'text', delta: FIX }, { type: 'done', status: 'failed', error: 'died' });
    await settle();
    expect(after()).toEqual(['pending:Next', 'settle']);
    expect(chat.failed).toBe(false);
    expect(textOf(chat)).toEqual([BROKEN]);
    expect(roles(chat)).toEqual(['user:Why is the sky blue?', 'agent:completed']);
    expect(sessions).toHaveLength(2);
    expect(sessions[0]!.sent).toHaveLength(2);
    expect(session().sent[0]!.text).toContain('Next');
    void next;
  });

  it('ends with no fix when the repair message is dropped', async () => {
    const { chat, session, id, after } = await replied();
    session().emit({ type: 'dropped', ids: [id()], error: 'gone' });
    await settle();
    expect(after()).toEqual(['settle']);
    expect(chat.running).toBe(false);
  });

  it('ends with no fix when the send throws', async () => {
    const { chat, session } = setup();
    const view = recordingView();
    view.failures = async () => [failure];
    chat.attach(view);
    chat.open(); await settle();
    void chat.send(context);
    await settle();
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    session().send = () => { throw new Error('closed'); };
    session().emit({ type: 'user', id: session().sent[0]!.id }, { type: 'text', delta: BROKEN }, { type: 'done', status: 'completed' });
    await settle();
    expect(errors).toHaveBeenCalled();
    errors.mockRestore();
    expect(view.calls.at(-1)).toBe('settle');
    expect(chat.running).toBe(false);
  });

  it('shows and saves a tool call of the hidden turn in the reply', async () => {
    const { chat, session, id, after } = await replied();
    session().emit({ type: 'user', id: id() }, tool, { type: 'text', delta: FIX }, { type: 'done', status: 'completed' });
    await settle();
    expect(after()).toEqual(['tool:t', 'settle']);
    expect(roles(chat)).toHaveLength(2);
    expect(chat.turns[1]).toMatchObject({ parts: [{ type: 'text', text: FIXED }, tool] });
  });

  it('asks for an approval in the hidden turn, carries on when it is refused, and opens no turn', async () => {
    const { chat, session, view, id, after } = await replied();
    view.approve = async (request) => { view.calls.push(`approve:${request.description}`); return false; };
    const answer = vi.fn();
    session().emit({ type: 'user', id: id() }, { type: 'approval', request: { description: 'write' } as never, signal: new AbortController().signal, answer });
    await settle();
    expect(answer).toHaveBeenCalledWith(false);
    expect(after()).toEqual(['approve:write']);
    session().emit({ type: 'text', delta: FIX }, { type: 'done', status: 'completed' });
    await settle();
    expect(textOf(chat)).toEqual([FIXED]);
  });

  it('keeps output from before the repair message is taken in, and ends that turn as steered', async () => {
    const { chat, session, id, after } = await replied();
    session().emit({ type: 'text', delta: 'A task ended.' }, { type: 'user', id: id() });
    expect(roles(chat)).toEqual(['user:Why is the sky blue?', 'agent:completed', 'agent:steered']);
    session().emit({ type: 'text', delta: FIX }, { type: 'done', status: 'completed' });
    await settle();
    // One for the steered turn, one for the reply the repair kept open.
    expect(after()).toEqual(['start', 'text:A task ended.', 'end:steered:2', 'settle', 'settle']);
    expect(textOf(chat)).toEqual([FIXED, 'A task ended.']);
  });

  it('runs one repair when an unprompted turn ends before the repair message is taken in', async () => {
    const { session, id } = await replied();
    session().emit({ type: 'text', delta: 'A task ended.' }, { type: 'done', status: 'completed' });
    await settle();
    expect(session().sent).toHaveLength(2);
    session().emit({ type: 'user', id: id() }, { type: 'text', delta: FIX }, { type: 'done', status: 'completed' });
    await settle();
    expect(session().sent).toHaveLength(2);
  });

  describe('leaving during an await', () => {
    /** A reply whose `failures` waits for the test. */
    async function waiting() {
      const harness = setup();
      const view = recordingView();
      let release!: (failed: typeof failure[]) => void;
      view.failures = () => new Promise((resolve) => { release = resolve; });
      const detach = harness.chat.attach(view);
      harness.chat.open(); await settle();
      void harness.chat.send(context).catch(() => undefined);
      await settle();
      const { session } = harness;
      session().emit({ type: 'user', id: session().sent[0]!.id }, { type: 'text', delta: BROKEN }, { type: 'done', status: 'completed' });
      return { ...harness, view, detach, release: (failed = [failure]) => release(failed) };
    }

    it('stops at the wait for the figures when the chat closes', async () => {
      const { chat, session, view, release } = await waiting();
      await chat.close();
      release();
      await settle();
      expect(session().sent).toHaveLength(1);
      expect(view.calls).not.toContain('settle');
    });

    it('sends nothing when the view goes during the wait for the figures', async () => {
      const { chat, session, detach, release } = await waiting();
      detach();
      release();
      await settle();
      expect(session().sent).toHaveLength(1);
      expect(chat.running).toBe(false);
    });

    it('releases the wait for the hidden turn when the chat closes, and adds no turn', async () => {
      const { chat, session, view, id } = await replied();
      session().emit({ type: 'user', id: id() });
      await chat.close();
      await settle();
      expect(roles(chat)).toEqual(['user:Why is the sky blue?', 'agent:completed']);
      expect(view.calls).not.toContain('settle');
      await chat.settled();
    });

    it('saves a tool call of the hidden turn when the chat closes during it', async () => {
      const { chat, session, store, id } = await replied();
      session().emit({ type: 'user', id: id() }, tool);
      await chat.close();
      const saved = await store.load(ID);
      expect(saved?.turns).toHaveLength(2);
      expect(saved?.turns[1]).toMatchObject({ status: 'completed', parts: [{ type: 'text', text: BROKEN }, tool] });
    });

    it('saves no fix when the view goes during the hidden turn', async () => {
      const { chat, session } = setup();
      const view = recordingView();
      view.failures = async () => [failure];
      const detach = chat.attach(view);
      chat.open(); await settle();
      void chat.send(context);
      await settle();
      session().emit({ type: 'user', id: session().sent[0]!.id }, { type: 'text', delta: BROKEN }, { type: 'done', status: 'completed' });
      await settle();
      session().emit({ type: 'user', id: session().sent[1]!.id }, { type: 'text', delta: FIX });
      detach();
      session().emit({ type: 'done', status: 'completed' });
      await settle();
      expect(textOf(chat)).toEqual([BROKEN]);
      expect(chat.running).toBe(false);
    });

    it('saves no fix when the view goes during the draw', async () => {
      const { chat, session } = setup();
      const view = recordingView();
      view.failures = async () => [failure];
      let release!: (drawn: ReadonlyMap<number, string>) => void;
      view.repair = () => new Promise((resolve) => { release = resolve; });
      const detach = chat.attach(view);
      chat.open(); await settle();
      void chat.send(context);
      await settle();
      session().emit({ type: 'user', id: session().sent[0]!.id }, { type: 'text', delta: BROKEN }, { type: 'done', status: 'completed' });
      await settle();
      session().emit({ type: 'user', id: session().sent[1]!.id }, { type: 'text', delta: FIX }, { type: 'done', status: 'completed' });
      await settle();
      detach();
      release(new Map([[0, 'fixed']]));
      await settle();
      expect(textOf(chat)).toEqual([BROKEN]);
      expect(chat.running).toBe(false);
    });
  });
});
