import { randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import type { ApiProvider } from 'promptfoo';

import { createAgents } from '@/agents/providers';
import type { AgentId } from '@/agents/types';
import { Chat } from '@/chat/Chat';
import { ChatDefaults } from '@/chat/ChatDefaults';
import { type AgentTurn, newChat } from '@/chat/ChatRecord';
import { ChatStore } from '@/chat/ChatStore';
import { messageOf } from '@/shared/messageOf';

/** A test's `chat` var (an object, since promptfoo expands an array var into one test per item): one student turn of a conversation. */
export interface TurnVars {
  conversation: string;
  /** The vault's notes, by path; the same for every turn of a conversation. */
  notes: Record<string, string>;
  /** The note open in the editor. */
  note?: string;
  /** Every message of the conversation, the same for each of its tests, so the chat closes after the last one. */
  messages: string[];
  /** Which message this test grades, from 1. */
  turn: number;
}

const noop = (): void => undefined;

/** The reply as the student reads it: text and highlight lines in order, without the tool calls. */
export function replyText(turns: readonly AgentTurn[]): string {
  return turns.flatMap((turn) => turn.parts).map((part) => {
    if (part.type === 'text') return part.text;
    if (part.type === 'highlight') return `\n@Highlight(${JSON.stringify(part.step.quote)}, ${JSON.stringify(part.step.comment ?? '')})\n`;
    return '';
  }).join('');
}

/**
 * Runs each test as a turn of a real Vicher chat, the way the chat pane sends one. Tests of one conversation share a chat
 * per repeat, and each earlier turn is sent once however many later tests need it.
 */
export function vicherProvider(agent: AgentId, model?: string): ApiProvider {
  const agents = createAgents(() => ({}));
  const chats = new Map<string, Promise<{ chat: Chat; vault: string; notices: string[] }>>();
  const turns = new Map<string, Promise<AgentTurn[]>>();

  const open = (key: string, vars: TurnVars) => {
    let opened = chats.get(key);
    if (!opened) {
      opened = (async () => {
        const vault = await mkdtemp(path.join(tmpdir(), 'vicher-eval-'));
        try {
          for (const [name, text] of Object.entries(vars.notes)) {
            await mkdir(path.dirname(path.join(vault, name)), { recursive: true });
            await writeFile(path.join(vault, name), text);
          }
        } catch (error) {
          await rm(vault, { recursive: true, force: true });
          throw error;
        }
        const disk = new Map<string, string>();
        const store = new ChatStore({
          read: async (name) => disk.get(name) ?? null,
          write: async (name, text) => { disk.set(name, text); },
          list: async () => [...disk.keys()],
          remove: async (name) => { disk.delete(name); },
        });
        const notices: string[] = [];
        const chat = new Chat(newChat(randomUUID(), agent), {
          defaults: new ChatDefaults({ agent, choices: { [agent]: model ? { model } : {} } }, async () => undefined),
          agents,
          models: { claude: Promise.resolve([]), codex: Promise.resolve([]) },
          store,
          cwd: vault,
        }, { changed: noop, switched: noop, lost: noop, notice: (text) => notices.push(text), warn: (text) => notices.push(text) });
        chat.open();
        return { chat, vault, notices };
      })();
      chats.set(key, opened);
    }
    return opened;
  };

  const shut = async (key: string): Promise<void> => {
    const opened = chats.get(key);
    chats.delete(key);
    const { chat, vault } = await opened?.catch(() => undefined) ?? {};
    await chat?.close();
    if (vault) await rm(vault, { recursive: true, force: true });
  };

  const turn = (vars: TurnVars, repeat: number, count: number): Promise<AgentTurn[]> => {
    const chatKey = `${repeat}|${vars.conversation}`;
    const key = `${chatKey}|${count}`;
    let sent = turns.get(key);
    if (!sent) {
      sent = (async () => {
        if (count > 1) await turn(vars, repeat, count - 1);
        const { chat, notices } = await open(chatKey, vars);
        const reply = await chat.send({ message: vars.messages[count - 1], attachments: [], note: vars.note ? { path: vars.note } : undefined }).catch((error: unknown) => {
          notices.push(messageOf(error));
          return [];
        });
        const last = reply.at(-1);
        const done = last?.status === 'completed';
        // A later turn needs the chat; the last one, or a failed one, leaves it nothing to do.
        if (!done || count === vars.messages.length) await shut(chatKey);
        if (!done) throw new Error(`Turn ${count} of ${vars.conversation} did not complete: ${last?.error || notices.join('; ') || last?.status || 'not sent'}`);
        return reply;
      })();
      turns.set(key, sent);
    }
    return sent;
  };

  return {
    id: () => `vicher:${agent}${model ? `:${model}` : ''}`,
    async callApi(_prompt, context) {
      const vars = context?.vars.chat as TurnVars | undefined;
      if (!Array.isArray(vars?.messages) || !Number.isInteger(vars.turn) || vars.turn < 1 || vars.turn > vars.messages.length) {
        return { error: 'The test needs a `chat.messages` array and a `chat.turn` within it.' };
      }
      try {
        const reply = await turn(vars, context?.repeatIndex ?? 0, vars.turn);
        const highlights = reply.flatMap((turn) => turn.parts).flatMap((part) => (part.type === 'highlight' ? [part.step] : []));
        return { output: replyText(reply), metadata: { prompt: reply.at(-1)?.prompt, highlights } };
      } catch (error) {
        return { error: messageOf(error) };
      }
    },
    async cleanup() {
      await Promise.all([...chats.keys()].map(shut));
    },
  };
}
