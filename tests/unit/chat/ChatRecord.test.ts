import type { ChatAttachment } from '@/context/ChatAttachment';
import type { AgentTurn, ChatRecord, UserTurn } from '@/chat/ChatRecord';
import { addPart, chatTitle, rateTurn, recordEvent, summarize, turnTitle, usesStoredFile } from '@/chat/ChatRecord';

const ID = '3f0c1b7e-5a44-4d0e-9c1a-2b6f8e7d9a10';

const user = (message: string, attachments?: ChatAttachment[]): UserTurn => ({ role: 'user', message, ...(attachments ? { attachments } : {}), at: 1 });
const agent = (parts: AgentTurn['parts'] = []): AgentTurn => ({ role: 'agent', parts, status: 'completed', at: 2 });

describe('recordEvent', () => {
  it('joins streamed text into one part', () => {
    const turn = [{ type: 'text', delta: 'Rayleigh ' }, { type: 'text', delta: 'scattering.' }].reduce(
      (turn, event) => recordEvent(turn, event as { type: 'text'; delta: string }), agent());

    expect(turn.parts).toEqual([{ type: 'text', text: 'Rayleigh scattering.' }]);
  });

  it('keeps a tool call where it began, with its last status, between the text around it', () => {
    let turn = recordEvent(agent(), { type: 'text', delta: 'Let me look.' });
    turn = recordEvent(turn, { type: 'tool', id: 't1', name: 'Read', title: 'Read notes.md', status: 'running' });
    turn = recordEvent(turn, { type: 'tool', id: 't2', name: 'Read', title: 'Read other.md', status: 'running' });
    turn = recordEvent(turn, { type: 'tool', id: 't1', name: 'Read', title: 'Read notes.md', status: 'done' });
    turn = recordEvent(turn, { type: 'text', delta: 'Found it.' });

    expect(turn.parts).toEqual([
      { type: 'text', text: 'Let me look.' },
      { type: 'tool', id: 't1', name: 'Read', title: 'Read notes.md', status: 'done' },
      { type: 'tool', id: 't2', name: 'Read', title: 'Read other.md', status: 'running' },
      { type: 'text', text: 'Found it.' },
    ]);
  });

  it('starts new text after another part, and does not change the turn it was given', () => {
    const before = agent();
    const noticed = addPart(recordEvent(before, { type: 'text', delta: 'a' }), { type: 'notice', description: 'Review', status: 'completed', text: 'ok' });
    expect(recordEvent(noticed, { type: 'text', delta: 'b' }).parts.map((part) => part.type)).toEqual(['text', 'notice', 'text']);
    expect(before.parts).toEqual([]);
  });
});

describe('chatTitle', () => {
  it('takes the first line and cuts a long one with an ellipsis', () => {
    expect(chatTitle('  What is a limit?\nPlease be brief.')).toBe('What is a limit?');
    expect(chatTitle('a'.repeat(80))).toBe(`${'a'.repeat(47)}…`);
  });
});

describe('turnTitle', () => {
  const image = { kind: 'image' as const, path: 'p/a.png', mediaType: 'image/png' as const, name: 'shot.png' };
  const file = { kind: 'file' as const, path: '/Users/me/week1.pdf', name: 'week1.pdf' };

  it('takes the message, else the name of the first thing attached', () => {
    expect(turnTitle(user('Why?', [image, file]))).toBe('Why?');
    expect(turnTitle(user('  ', [image, file]))).toBe('shot.png');
    expect(turnTitle(user('', [file, image]))).toBe('week1.pdf');
  });
});

describe('summarize', () => {
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

  it('flattens the messages and reply text to one line and leaves out tool calls', () => {
    expect(summarize(chat)).toEqual({ id: ID, agent: 'codex', title: 'Sky', updatedAt: 5, text: 'Why is the sky blue? Rayleigh scattering.' });
  });

  it('keeps only the start of a long conversation', () => {
    const long = { ...chat, turns: [user('x'.repeat(10_000))] };
    expect(summarize(long).text).toHaveLength(4000);
  });
});

describe('usesStoredFile', () => {
  const turns = [user('a'), user('b', [
    { kind: 'file', path: 'x/1.png', name: 'a file by that path is not an image' },
    { kind: 'image', path: 'x/1.png', mediaType: 'image/png', name: 'one' },
  ])];

  it('counts an image, not a file at the same path', () => {
    expect(usesStoredFile([user('c', [{ kind: 'file', path: 'x/9.png', name: 'a file' }])], 'x/9.png')).toBe(false);
  });

  it('finds an image any message shows, and no other', () => {
    expect(usesStoredFile(turns, 'x/1.png')).toBe(true);
    expect(usesStoredFile(turns, 'x/2.png')).toBe(false);
  });
});

describe('rateTurn', () => {
  const chat: ChatRecord = { id: ID, agent: 'claude', title: 't', updatedAt: 1, turns: [user('one'), agent(), user('two'), agent()] };
  const ratings = (next: ChatRecord) => next.turns.map((turn) => (turn.role === 'agent' ? turn.rating : 'user'));

  it('rates one agent turn and leaves the others and the chat it was given alone', () => {
    expect(ratings(rateTurn(chat, 3, 'up'))).toEqual(['user', undefined, 'user', 'up']);
    expect(ratings(chat)).toEqual(['user', undefined, 'user', undefined]);
  });

  it('replaces a thumb, and takes it off without leaving the key behind', () => {
    const down = rateTurn(rateTurn(chat, 1, 'up'), 1, 'down');
    const none = rateTurn(down, 1, undefined);

    expect(ratings(down)[1]).toBe('down');
    expect('rating' in none.turns[1]!).toBe(false);
  });

  it('leaves the chat as it was for a message or a turn that is not there', () => {
    expect(rateTurn(chat, 0, 'up')).toBe(chat);
    expect(rateTurn(chat, 9, 'up')).toBe(chat);
  });
});
