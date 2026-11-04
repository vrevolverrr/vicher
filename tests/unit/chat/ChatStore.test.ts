import type { ChatFiles } from '@/chat/ChatStore';
import { ChatStore, decodeChat, decodeSummaries } from '@/chat/ChatStore';
import type { AgentTurn, ChatRecord, UserTurn } from '@/chat/ChatRecord';
import { summarize } from '@/chat/ChatRecord';

const A = '3f0c1b7e-5a44-4d0e-9c1a-2b6f8e7d9a10';
const B = '9d2e4c68-1b73-4f25-8a0c-5e6d7f8091a2';
const ID = A;

const user = (message: string, rest: Partial<UserTurn> = {}): UserTurn => ({ role: 'user', message, at: 1, ...rest });
const agent = (parts: AgentTurn['parts'], rest: Partial<AgentTurn> = {}): AgentTurn => ({ role: 'agent', parts, status: 'completed', at: 2, ...rest });

class MemoryFiles implements ChatFiles {
  readonly files = new Map<string, string>();
  async read(path: string) { return this.files.get(path) ?? null; }
  async write(path: string, text: string) { this.files.set(path, text); }
  async list() { return [...this.files.keys()]; }
  async remove(path: string) { this.files.delete(path); }
}

const chat = (id: string, updatedAt: number, message = ''): ChatRecord => ({
  id,
  agent: 'claude',
  sessionId: 's',
  title: id,
  updatedAt,
  turns: message ? [user(message), agent([{ type: 'text', text: `About ${message}` }])] : [],
});
const INDEX = 'index.json';

/** Records the paths read from now on. */
function spyOnReads(files: MemoryFiles): string[] {
  const reads: string[] = [];
  const read = files.read.bind(files);
  files.read = async (path) => (reads.push(path), read(path));
  return reads;
}

describe('ChatStore', () => {
  it('saves a chat and loads it back', async () => {
    const store = new ChatStore(new MemoryFiles());

    await store.save(chat(A, 1));

    expect(await store.load(A)).toEqual(chat(A, 1));
  });

  it('lists chats newest first and skips files it did not write', async () => {
    const files = new MemoryFiles();
    const store = new ChatStore(files);
    await store.save(chat(A, 1));
    await store.save(chat(B, 2));
    files.files.set('notes.json', '{}');
    files.files.set(`${B.replace('9', '8')}.json`, 'not json');

    expect((await store.list()).map((c) => c.id)).toEqual([B, A]);
  });

  it('never turns an id into a path outside its folder', async () => {
    const files = new MemoryFiles();
    files.files.set('data.json', JSON.stringify(chat(A, 1)));
    const store = new ChatStore(files);

    expect(await store.load('../data')).toBeNull();
    await store.remove('../data');
    expect(files.files.has('data.json')).toBe(true);
  });

  it('answers null for a chat that is missing or corrupt', async () => {
    const files = new MemoryFiles();
    files.files.set(`${A}.json`, '{"id":');
    const store = new ChatStore(files);

    expect(await store.load(A)).toBeNull();
    expect(await store.load(B)).toBeNull();
  });

  it('keeps an index of summaries that the next store reads without opening the chats', async () => {
    const files = new MemoryFiles();
    await new ChatStore(files).save(chat(A, 1, 'eigenvalues'));
    const reads = spyOnReads(files);

    const listed = await new ChatStore(files).list();

    expect(listed).toEqual([{ id: A, agent: 'claude', title: A, updatedAt: 1, text: 'eigenvalues About eigenvalues' }]);
    expect(reads).toEqual([INDEX]);
  });

  it('rebuilds a missing or corrupt index from the chat files', async () => {
    const files = new MemoryFiles();
    await new ChatStore(files).save(chat(A, 1));
    await new ChatStore(files).save(chat(B, 2));
    files.files.set(INDEX, '[{"id":');

    expect((await new ChatStore(files).list()).map((c) => c.id)).toEqual([B, A]);
    expect(JSON.parse(files.files.get(INDEX)!)).toHaveLength(2);

    files.files.delete(INDEX);
    expect((await new ChatStore(files).list()).map((c) => c.id)).toEqual([B, A]);
  });

  it('follows chat files added or deleted behind its back', async () => {
    const files = new MemoryFiles();
    const store = new ChatStore(files);
    await store.save(chat(A, 1));
    await store.list();
    files.files.set(`${B}.json`, JSON.stringify(chat(B, 2)));
    expect((await store.list()).map((c) => c.id)).toEqual([B, A]);

    files.files.delete(`${A}.json`);
    expect((await store.list()).map((c) => c.id)).toEqual([B]);
  });

  it('does not reread indexed chats because another file does not decode', async () => {
    const files = new MemoryFiles();
    const store = new ChatStore(files);
    await store.save(chat(A, 1));
    files.files.set(`${B}.json`, 'not json');
    await store.list();
    const reads = spyOnReads(files);

    expect((await store.list()).map((c) => c.id)).toEqual([A]);

    expect(reads).toEqual([`${B}.json`]);
  });

  it('keeps saving a chat whose delete failed', async () => {
    const files = new MemoryFiles();
    const store = new ChatStore(files);
    await store.save(chat(A, 1));
    const remove = files.remove.bind(files);
    files.remove = async () => {
      throw new Error('locked');
    };

    await expect(store.remove(A)).rejects.toThrow('locked');
    files.remove = remove;
    await store.save(chat(A, 2));

    expect((await store.list()).map((c) => c.updatedAt)).toEqual([2]);
  });

  it('drops a removed chat from the index and ignores a save that lands after it', async () => {
    const files = new MemoryFiles();
    const store = new ChatStore(files);
    await store.save(chat(A, 1));
    await store.save(chat(B, 2));

    await store.remove(A);
    await store.save(chat(A, 3));

    expect((await store.list()).map((c) => c.id)).toEqual([B]);
    expect(files.files.has(`${A}.json`)).toBe(false);
  });

  it('keeps every chat when saves overlap', async () => {
    const store = new ChatStore(new MemoryFiles());

    await Promise.all([store.save(chat(A, 1)), store.save(chat(B, 2))]);

    expect((await store.list()).map((c) => c.id)).toEqual([B, A]);
  });
});

describe('decodeChat', () => {
  const chat: ChatRecord = {
    id: ID,
    agent: 'codex',
    sessionId: 'thread-9',
    title: 'Why is the sky blue?',
    updatedAt: 1_700_000_000_000,
    turns: [user('Why is the sky blue?'), agent([{ type: 'text', text: 'Scattering.' }, { type: 'tool', id: 't', name: 'Read', title: 'Read a.md', status: 'failed' }])],
  };

  it('reads back what was stored as JSON', () => {
    expect(decodeChat(JSON.parse(JSON.stringify(chat)))).toEqual(chat);
  });

  it.each(['inherit', 'auto', 'approval', 'bypass'])('keeps the %s permission policy', (permissionPolicy) => {
    expect(decodeChat(JSON.parse(JSON.stringify({ ...chat, permissionPolicy })))?.permissionPolicy).toBe(permissionPolicy);
  });

  it('accepts older chats without a permission policy or a model choice', () => {
    expect(decodeChat(chat)?.permissionPolicy).toBeUndefined();
    expect(decodeChat(chat)?.choice).toBeUndefined();
  });

  it('keeps the stops and task notices a reply holds, in place among its text', () => {
    const step = { path: 'optics.md', quote: 'blue light', comment: 'Why', line: 4 };
    const stored = { ...chat, turns: [user('Walk me through'), agent([
      { type: 'text', text: 'Look:' },
      { type: 'highlight', step },
      { type: 'notice', description: 'Review ch6', status: 'failed', text: 'No such file' },
      { type: 'text', text: 'Then.' },
    ])] };

    expect(decodeChat(JSON.parse(JSON.stringify(stored)))).toEqual(stored);
  });

  it('keeps a thumb, the prompt a turn ran under, and a steered turn', () => {
    const rated = { ...chat, turns: [chat.turns[0]!, agent([], { status: 'steered' }), agent([], { rating: 'down', prompt: '1a2b3c4d' })] };
    const stored = JSON.parse(JSON.stringify(rated));

    expect(decodeChat(stored)?.turns.slice(1)).toMatchObject([{ status: 'steered' }, { rating: 'down', prompt: '1a2b3c4d' }]);
  });

  it.each([
    ['the quote a message was sent with', { ...chat, turns: [user('Explain this', { quote: { text: 'Rayleigh scattering', path: 'optics.md', startLine: 12 } })] }],
    ['the chat a quote came from', { ...chat, turns: [user('Explain this', { quote: { text: 'Earlier reply', path: ID, source: 'chat' } })] }],
    ['the chat model choice', { ...chat, choice: { model: 'model-a', effort: 'medium' } }],
    ['the images, files, pastes and picked-file tokens a message was sent with, in order', { ...chat, turns: [user('compare @week1.md', { attachments: [
      { kind: 'file', path: '/Users/me/week1.pdf', name: 'week1.pdf' },
      { kind: 'image', path: 'attachments/chat/a1.png', mediaType: 'image/png', name: 'image.png' },
      { kind: 'paste', path: 'p/attachments/chat/ab.txt', name: 'Pasted text · 900 lines' },
      { kind: 'file', path: '/v/week1.md', name: 'week1.md', token: 'week1.md' },
    ] })] }],
  ] as [string, ChatRecord][])('keeps %s', (_name, stored) => {
    expect(decodeChat(JSON.parse(JSON.stringify(stored)))).toEqual(stored);
  });

  it.each<[string, unknown]>([
    ['a non-object', 'chat'],
    ...['always', null, 1, {}, []].map((permissionPolicy): [string, unknown] => [`the permission policy ${JSON.stringify(permissionPolicy)}`, { ...chat, permissionPolicy }]),
    ['a thumb that is neither up nor down', { ...chat, turns: [{ ...chat.turns[1], rating: 'sideways' }] }],
    ['a prompt id that is not text', { ...chat, turns: [{ ...chat.turns[1], prompt: 7 }] }],
    ['a quote from an unknown source', { ...chat, turns: [{ role: 'user', message: 'q', quote: { text: 'x', path: ID, source: 'unknown' }, at: 1 }] }],
    ['a model choice that is not an object', { ...chat, choice: 'model-a' }],
    ['an id that is not a uuid', { ...chat, id: '../../data' }],
    ['an unknown agent', { ...chat, agent: 'gemini' }],
    ['a session id that is not text', { ...chat, sessionId: 4 }],
    ['turns that are not a list', { ...chat, turns: {} }],
    ['an end time that is not a number', { ...chat, turns: [{ role: 'agent', parts: [], status: 'completed', at: 'noon' }] }],
    ['a quote that is not an object', { ...chat, turns: [{ role: 'user', message: 'q', quote: 'text', at: 1 }] }],
    ['a quote with no path', { ...chat, turns: [{ role: 'user', message: 'q', quote: { text: 'a' }, at: 1 }] }],
    ['attachments that are not a list', { ...chat, turns: [{ role: 'user', message: 'q', attachments: 'a.pdf', at: 1 }] }],
    ['an attachment of an unknown kind', { ...chat, turns: [{ role: 'user', message: 'q', attachments: [{ kind: 'audio', path: 'a', name: 'a' }], at: 1 }] }],
    ['an attachment with no kind', { ...chat, turns: [{ role: 'user', message: 'q', attachments: [{ path: '/a.pdf', name: 'a.pdf' }], at: 1 }] }],
    ['an image of an unknown type', { ...chat, turns: [{ role: 'user', message: 'q', attachments: [{ kind: 'image', path: 'a', mediaType: 'image/bmp', name: 'a' }], at: 1 }] }],
    ['an image with no name', { ...chat, turns: [{ role: 'user', message: 'q', attachments: [{ kind: 'image', path: 'a', mediaType: 'image/png' }], at: 1 }] }],
    ['a file with no path', { ...chat, turns: [{ role: 'user', message: 'q', attachments: [{ kind: 'file', name: 'a.pdf' }], at: 1 }] }],
    ['a turn with an unknown role', { ...chat, turns: [{ role: 'system', message: 'q', at: 1 }] }],
    ['a turn with no time', { ...chat, turns: [{ role: 'user', message: 'q' }] }],
    ['a notice with an unknown status', { ...chat, turns: [{ role: 'agent', parts: [{ type: 'notice', description: 'd', status: 'running', text: '' }], status: 'completed', at: 1 }] }],
    ['a turn with an unknown status', { ...chat, turns: [{ role: 'agent', parts: [], status: 'weird', at: 1 }] }],
    ['a reply part of an unknown type', { ...chat, turns: [{ role: 'agent', parts: [{ type: 'image' }], status: 'completed', at: 1 }] }],
    ['a highlight with no quote', { ...chat, turns: [{ role: 'agent', parts: [{ type: 'highlight', step: { path: 'a.md' } }], status: 'completed', at: 1 }] }],
    ['a highlight whose comment is not text', { ...chat, turns: [{ role: 'agent', parts: [{ type: 'highlight', step: { path: 'a.md', quote: 'q', comment: 3 } }], status: 'completed', at: 1 }] }],
    ['a tool part with a bad status', { ...chat, turns: [{ role: 'agent', parts: [{ type: 'tool', id: 't', name: 'n', title: 't', status: 'x' }], status: 'completed', at: 1 }] }],
  ])('refuses %s', (_name, value) => {
    expect(decodeChat(value)).toBeNull();
  });
});

describe('decodeSummaries', () => {
  const chat: ChatRecord = {
    id: ID,
    agent: 'codex',
    title: 'Sky',
    updatedAt: 5,
    turns: [
      user('Why is the sky\nblue?'),
      agent([{ type: 'tool', id: 't', name: 'Read', title: 'Read notes.md', status: 'done' }, { type: 'text', text: 'Rayleigh   scattering.' }]),
    ],
  };

  it('reads back what it wrote', () => {
    expect(decodeSummaries([summarize(chat)])).toEqual([summarize(chat)]);
  });

  it.each([
    ['a non-list', {}],
    ['an id that is not a uuid', [{ ...summarize(chat), id: '../x' }]],
    ['an unknown agent', [{ ...summarize(chat), agent: 'gemini' }]],
    ['text that is not text', [{ ...summarize(chat), text: 3 }]],
  ])('refuses %s', (_name, value) => {
    expect(decodeSummaries(value)).toBeNull();
  });
});
