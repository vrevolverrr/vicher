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
  interrupt: jest.Mock;
  stopTask: jest.Mock;
  setModel: jest.Mock;
  close: jest.Mock;
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
    interrupt: jest.fn(), stopTask: jest.fn(async () => undefined), started: async () => undefined,
    ...(title ? { title: async () => title } : {}),
    skills: async () => [], setModel: jest.fn(async () => undefined), close: jest.fn(async () => undefined),
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
  const events: { [K in keyof ChatEvents]: jest.Mock } = { changed: jest.fn(), switched: jest.fn(), lost: jest.fn(), notice: jest.fn(), warn: jest.fn() };
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
    agentEnd: (turn, index) => calls.push(`end:${turn.status}:${index}`),
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
    expect(view.calls).toEqual(['pending:Why is the sky blue?', 'start', 'text:Done in the background.', 'end:completed:0']);
    session().emit({ type: 'user', id: session().sent[0]!.id }, { type: 'done', status: 'completed' });
    expect(await sending).toEqual([]);
  });

  it('adds a notice to the reply being written, or records it as a turn of its own before the reply it starts', async () => {
    const { chat, session } = setup();
    chat.open(); await settle();
    const notice = { type: 'notice', task: 't1', description: 'Review ch6', status: 'completed', text: 'Two typos.' } as const;
    void chat.send(context);
    await settle();
    session().emit({ type: 'user', id: session().sent[0]!.id }, { type: 'text', delta: 'Waiting.' }, notice, { type: 'done', status: 'completed' });
    session().emit(notice, { type: 'text', delta: 'The review is back.' }, { type: 'done', status: 'completed' });
    const agents = chat.turns.filter((turn) => turn.role === 'agent');
    expect(agents.map((turn) => turn.parts.map((part) => part.type))).toEqual([['text', 'notice'], ['notice'], ['text']]);
    expect(agents.map((turn) => turn.status)).toEqual(['completed', 'completed', 'completed']);
  });

  it('shows a failure with no output as an empty failed turn, logs its detail without saving it, and ignores a bare completed end', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
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
    const save = jest.spyOn(store, 'save');
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
    const save = jest.spyOn(store, 'save');
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
    const save = jest.spyOn(empty.store, 'save');
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
