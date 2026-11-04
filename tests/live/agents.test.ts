// Drives the developer's installed CLIs against their own subscriptions: npm run test:live
// Runs under tsx and node:test, outside `npm test`, because it drives the real agent CLIs.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { crc32, deflateSync } from 'node:zlib';

import '../setupWindow';

import { createAgents } from '../../src/agents/providers';
import type { AgentAdapter, AgentEvent, AgentSession, AgentSessionOptions, AgentTool, TurnImage } from '../../src/agents/types';
import { buildTurn } from '../../src/context/buildTurn';
import { readTexts, turnFiles } from '../../src/context/ChatAttachment';
import { findQuote } from '../../src/tour/locateQuote';
import { Chat } from '../../src/chat/Chat';
import { ChatDefaults } from '../../src/chat/ChatDefaults';
import { newChat } from '../../src/chat/ChatRecord';
import { ChatStore } from '../../src/chat/ChatStore';
import { buildSystemPrompt } from '../../src/context/systemPrompt';
import { splitReply } from '../../src/chat/splitReply';
import { validateFigure } from '../../src/renderer/figure/validateFigure';
import { buildFigureWorker } from '../../scripts/buildFigureWorker.js';
import { runFigureWorker } from '../runFigureWorker';

const SYSTEM_PROMPT = 'You are a live tutor. Reply with JSON Lines only: one {"type":"say","text":"..."} object per line, no prose, no code fences.';
const adapters = createAgents(() => ({}));
const AGENTS: Array<{ agent: AgentAdapter; model: string }> = [
  { agent: adapters.claude, model: process.env.VICHER_LIVE_CLAUDE_MODEL ?? 'haiku' },
  { agent: adapters.codex, model: process.env.VICHER_LIVE_CODEX_MODEL ?? 'gpt-6-luna' },
];
const only = process.env.VICHER_LIVE_AGENT;
// Per test: a suite-wide limit grows wrong as tests are added.
const LIMIT = { timeout: 120_000 };

// Vicher supplies no tool today; the contract still carries them, so a stub checks the wiring.
const stubTool: AgentTool = { name: 'load_pack', description: 'Loads a pack by name.', argument: { name: 'name', values: ['plot'] }, run: () => 'ok', title: (name) => `Loaded ${name}` };

let cwd: string;

/** A solid-color PNG, so a model's answer shows whether it saw the image. */
function solidPng(size: number, [r, g, b]: [number, number, number]): Buffer {
  const chunk = (type: string, data: Buffer): Buffer => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const frame = Buffer.alloc(8 + body.length);
    frame.writeUInt32BE(data.length, 0);
    body.copy(frame, 4);
    frame.writeUInt32BE(crc32(body), 4 + body.length);
    return frame;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 2, 0, 0, 0], 8);
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: size }, () => [r, g, b]).flat())]);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.concat(Array(size).fill(row)))), chunk('IEND', Buffer.alloc(0))]);
}

before(() => {
  // Obsidian is never launched from a Claude Code session; drop that session's markers.
  for (const key of Object.keys(process.env)) {
    if (/^CLAUDE(CODE$|_CODE_ENTRYPOINT$|_CODE_SESSION|_CODE_CHILD|_CODE_MESSAGING|_CODE_BRIDGE|_PID$)/.test(key)) delete process.env[key];
  }
  cwd = mkdtempSync(path.join(tmpdir(), 'vicher-live-'));
  writeFileSync(path.join(cwd, 'notes.md'), 'The pin count tracks active users of a page.\n');
  writeFileSync(path.join(cwd, 'optics.md'), '# Optics\n\nSunlight meets air. **Rayleigh scattering** sends short wavelengths in every direction, and blue light is scattered far more than red.\n\n- Sunsets look red because the light crosses more air.\n- Clouds look white because their drops scatter every color alike.\n');
  writeFileSync(path.join(cwd, 'swatch.png'), solidPng(64, [0, 0, 255]));
  for (const dir of ['.claude', '.agents']) {
    mkdirSync(path.join(cwd, dir, 'skills', 'zebra'), { recursive: true });
    writeFileSync(
      path.join(cwd, dir, 'skills', 'zebra', 'SKILL.md'),
      '---\nname: zebra\ndescription: Answer with a fixed word.\n---\nWhen this skill runs, reply with exactly the word PINEAPPLE and nothing else.\n',
    );
  }
});

after(() => rmSync(cwd, { recursive: true, force: true }));

/** Events from now until `stop` holds for one, or the time runs out. */
function until(session: AgentSession, stop: (event: AgentEvent) => boolean, onEvent?: (event: AgentEvent) => void, ms = 90_000): Promise<AgentEvent[]> {
  const out: AgentEvent[] = [];
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { unsubscribe(); reject(new Error(`timed out; events: ${JSON.stringify(out.map((e) => e.type))}`)); }, ms);
    const unsubscribe = session.subscribe((event) => {
      out.push(event);
      onEvent?.(event);
      if (!stop(event)) return;
      clearTimeout(timer);
      unsubscribe();
      resolve(out);
    });
  });
}

/** Sends one message and collects the session's events up to the end of the CLI turn. */
function collect(session: AgentSession, text: string, onEvent?: (event: AgentEvent) => void, images?: TurnImage[]): Promise<AgentEvent[]> {
  const events = until(session, (event) => event.type === 'done', onEvent);
  session.send({ id: randomUUID(), text, images });
  return events;
}

const textOf = (events: AgentEvent[]): string => events.map((e) => (e.type === 'text' ? e.delta : '')).join('');

/** A chat on the installed CLI in `cwd`, kept in memory. */
function liveChat(agent: AgentAdapter, model: string): Chat {
  const disk = new Map<string, string>();
  const store = new ChatStore({
    read: async (name) => disk.get(name) ?? null,
    write: async (name, text) => { disk.set(name, text); },
    list: async () => [...disk.keys()],
    remove: async (name) => { disk.delete(name); },
  });
  const noop = (): void => undefined;
  const chat = new Chat(newChat(randomUUID(), agent.id), {
    defaults: new ChatDefaults({ agent: agent.id, choices: { [agent.id]: { model, effort: 'low' } } }, async () => undefined),
    agents: adapters,
    models: { claude: Promise.resolve([]), codex: Promise.resolve([]) },
    store,
    cwd,
  }, { changed: noop, switched: noop, lost: noop, notice: noop, warn: noop });
  chat.open();
  return chat;
}

for (const { agent, model } of AGENTS.filter(({ agent }) => !only || agent.id === only)) {
  describe(`${agent.id} against the installed CLI`, () => {
    // Functional fixtures retain their former full-access behavior; the permission test overrides it explicitly.
    const options = (): AgentSessionOptions => ({ systemPrompt: SYSTEM_PROMPT, model, effort: 'low', cwd, permissionPolicy: 'bypass' });

    it('is signed in', LIMIT, async () => {
      assert.equal(await agent.authState(), 'logged-in');
    });

    it('relays a native permission prompt and honors decline and approve', LIMIT, async () => {
      const directory = mkdtempSync(path.join(process.cwd(), '.context', 'permission-live-'));
      const permissionCwd = mkdtempSync(path.join(tmpdir(), 'vicher-permission-cwd-'));
      const target = path.join(directory, 'permission.txt');
      mkdirSync(path.join(permissionCwd, '.claude'));
      const settingsPath = path.join(permissionCwd, '.claude', 'settings.local.json');
      // Force a native Claude prompt without changing the developer's own settings.
      writeFileSync(settingsPath, JSON.stringify({ permissions: { ask: ['Bash', 'Write', 'Edit'] } }), { flag: 'wx' });
      writeFileSync(target, '', { flag: 'wx' });
      try {
        for (const approved of [false, true]) {
          let prompts = 0;
          const session = await agent.openSession({
            ...options(), cwd: permissionCwd, permissionPolicy: 'approval',
            systemPrompt: 'You are testing permission handling. Perform only the requested file operation. If permission is denied, stop immediately; do not retry or use another tool. Reply briefly.',
          });
          try {
            const instruction = agent.id === 'codex'
              ? `Run exec_command with sandbox_permissions="require_escalated" and a justification to execute: printf 'approved' >> '${target}'. Request approval explicitly.`
              : `Use Bash to execute exactly: printf 'approved' >> '${target}'.`;
            const events = await collect(session, instruction, (event) => {
              if (event.type === 'approval') { prompts++; event.answer(approved); }
            });
            assert.deepEqual(events.at(-1), { type: 'done', status: 'completed' });
            assert.ok(prompts > 0, 'The CLI did not send a permission request');
            assert.equal(readFileSync(target, 'utf8'), approved ? 'approved' : '');
          } finally { await session.close(); }
        }
      } finally {
        rmSync(permissionCwd, { recursive: true, force: true });
        rmSync(directory, { recursive: true, force: true });
      }
    });

    it('lists its models, one default, and switches to one mid-session', LIMIT, async () => {
      const models = await agent.models();
      assert.equal(models.filter((option) => option.isDefault).length, 1, JSON.stringify(models));
      assert.ok(models.some((option) => option.id === model), JSON.stringify(models));

      const session = await agent.openSession({ ...options(), model: undefined, effort: undefined });
      try {
        await session.setModel(model, 'low');
        const events = await collect(session, 'Student opened the page. Greet them with one say line.');
        assert.deepEqual(events.at(-1), { type: 'done', status: 'completed' });
      } finally {
        await session.close();
      }
    });

    it('streams a completed turn, then a second turn on the same session', LIMIT, async () => {
      const session = await agent.openSession(options());
      try {
        const first = await collect(session, 'Student opened the page. Greet them with one say line.');
        const second = await collect(session, 'Student asked: what is a derivative? One say line.');

        for (const turn of [first, second]) {
          assert.deepEqual(turn.at(-1), { type: 'done', status: 'completed' });
          assert.match(textOf(turn), /"type"/);
        }
      } finally {
        await session.close();
      }
    });

    it('reports a tool call it makes as running, then done', LIMIT, async () => {
      const session = await agent.openSession(options());
      try {
        const events = await collect(session, 'Read the file notes.md in the working directory with a tool, then reply with one say line quoting it.');
        const tools = events.filter((e) => e.type === 'tool');

        assert.deepEqual(events.at(-1), { type: 'done', status: 'completed' });
        assert.ok(tools.some((e) => e.status === 'running'), JSON.stringify(tools));
        assert.ok(tools.some((e) => e.status === 'done' && /notes\.md/.test(e.title)), JSON.stringify(tools));
      } finally {
        await session.close();
      }
    });

    it('sees an image attached to a turn', LIMIT, async () => {
      const session = await agent.openSession(options());
      try {
        const events = await collect(session, 'What single color fills the attached image? Reply with one say line naming it.', undefined, [{ path: path.join(cwd, 'swatch.png'), mediaType: 'image/png' }]);

        assert.deepEqual(events.at(-1), { type: 'done', status: 'completed' });
        assert.match(textOf(events), /blue/i);
      } finally {
        await session.close();
      }
    });

    it('has the text of an attached file with no tool call, however its CLI loads it', LIMIT, async () => {
      const outside = mkdtempSync(path.join(tmpdir(), 'vicher-mention-'));
      const file = path.join(outside, 'My Handout.txt');
      writeFileSync(file, 'The secret word is MARMALADE.\n');
      const files = turnFiles([{ kind: 'file', path: file, name: 'My Handout.txt' }], cwd, agent.fileMention);
      const text = buildTurn({
        message: 'What is the secret word in the attached file? Do not use any tool.',
        skillSyntax: agent.skillSyntax,
        files,
        fileTexts: await readTexts(files.filter(({ mention }) => mention === undefined).map(({ path }) => path)),
      });
      const session = await agent.openSession({ ...options(), systemPrompt: buildSystemPrompt() });
      try {
        const events = await collect(session, text);

        assert.deepEqual(events.at(-1), { type: 'done', status: 'completed' });
        assert.match(textOf(events), /MARMALADE/i);
        assert.deepEqual(events.filter((e) => e.type === 'tool'), []);
      } finally {
        await session.close();
        rmSync(outside, { recursive: true, force: true });
      }
    });

    it('reads a file outside the working folder that a turn names by full path', LIMIT, async () => {
      const outside = mkdtempSync(path.join(tmpdir(), 'vicher-outside-'));
      const file = path.join(outside, 'handout.txt');
      writeFileSync(file, 'The secret word is MARMALADE.\n');
      const session = await agent.openSession({ ...options(), systemPrompt: buildSystemPrompt() });
      try {
        const events = await collect(session, `<attachment path="${file}"/>\n\nWhat is the secret word in the attached file?`);

        assert.deepEqual(events.at(-1), { type: 'done', status: 'completed' });
        assert.match(textOf(events), /MARMALADE/i);
      } finally {
        await session.close();
        rmSync(outside, { recursive: true, force: true });
      }
    });

    it('titles a new chat from its own CLI, or from a @Title line that never reaches the transcript', LIMIT, async () => {
      const chat = liveChat(agent, model);
      try {
        const turns = await chat.send({ message: 'Why is the sky blue?', attachments: [] });

        assert.equal(turns.at(-1)?.status, 'completed');
        assert.doesNotMatch(JSON.stringify(turns), /@Title/);
      } finally {
        await chat.close();
      }
      assert.ok(chat.record.title && chat.record.title !== 'Why is the sky blue?', `title: ${chat.record.title}`);
    });

    it('points at text of the open note with a @Highlight line that the note holds', LIMIT, async () => {
      const content = readFileSync(path.join(cwd, 'optics.md'), 'utf8');
      const chat = liveChat(agent, model);
      try {
        const turns = await chat.send({ message: 'Why is the sky blue? Point at the sentence in my note that explains it.', attachments: [], note: { path: 'optics.md' } });
        const marked = turns.flatMap((turn) => turn.parts).flatMap((part) => (part.type === 'highlight' ? [part.step.quote] : []));

        assert.equal(turns.at(-1)?.status, 'completed');
        assert.doesNotMatch(JSON.stringify(turns), /@Highlight/);
        assert.ok(marked.length > 0, `no highlight; reply: ${JSON.stringify(turns)}`);
        for (const quote of marked) assert.ok(findQuote(content, quote), `not in the note: ${quote}`);
      } finally {
        await chat.close();
      }
    });

    it('runs a Vicher tool the agent calls and reports it done', LIMIT, async () => {
      const session = await agent.openSession({ ...options(), tools: [stubTool] });
      try {
        const events = await collect(session, `Call the ${stubTool.name} tool with the plot pack, then reply with one say line.`);
        const tools = events.filter((e) => e.type === 'tool' && e.name === stubTool.name);

        assert.deepEqual(events.at(-1), { type: 'done', status: 'completed' });
        assert.ok(tools.some((e) => e.type === 'tool' && e.status === 'done'), JSON.stringify(tools));
      } finally {
        await session.close();
      }
    });

    it('writes a figure that runs, and a Quiz whose answer is one of its options', LIMIT, async () => {
      const session = await agent.openSession({ ...options(), systemPrompt: buildSystemPrompt() });
      const worker = buildFigureWorker();
      const figureOf = async (message: string) => {
        const events = await collect(session, message);
        const text = textOf(events);
        const fence = splitReply(text, true).find((segment) => segment.kind === 'figure');
        assert.ok(fence, `no figure fence; reply: ${text}`);
        const result = validateFigure(await runFigureWorker(worker, { kind: 'run', source: fence.text, params: {} }));
        assert.ok(result.ok, `${result.ok ? '' : result.error}\n${fence.text}`);
        return result.figure;
      };
      try {
        const dijkstra = await figureOf('Show Dijkstra\'s algorithm on a weighted graph of five nodes as a figure, step by step.');
        assert.ok(dijkstra.steps.length > 1);
        const quiz = await figureOf('Check my understanding of derivatives with one Quiz figure, and nothing else.');
        assert.ok(JSON.stringify(quiz.steps[0].root).includes('"type":"Quiz"'), JSON.stringify(quiz.steps[0].root));
      } finally {
        await session.close();
      }
    });

    it('lists the skills in the working folder and runs one typed with the agent\'s prefix', LIMIT, async () => {
      const session = await agent.openSession(options());
      try {
        const skills = await session.skills();
        const events = await collect(session, `${agent.skillSyntax.prefix}zebra go`);

        assert.ok(skills.some((skill) => skill.name === 'zebra' && skill.description.startsWith('Answer with a fixed word.')), JSON.stringify(skills));
        assert.match(textOf(events), /PINEAPPLE/);
      } finally {
        await session.close();
      }
    });

    it('remembers the conversation in a later session that resumes it', LIMIT, async () => {
      const first = await agent.openSession(options());
      let id: string;
      try {
        id = first.id;
        await collect(first, 'Remember the secret word MANGO. Reply with one say line.');
      } finally {
        await first.close();
      }

      const second = await agent.openSession({ ...options(), resume: id });
      try {
        assert.equal(second.id, id);
        const events = await collect(second, 'What was the secret word? One say line.');
        assert.deepEqual(events.at(-1), { type: 'done', status: 'completed' });
        assert.match(textOf(events), /MANGO/);
      } finally {
        await second.close();
      }
    });

    it('rejects at open when asked to resume an id it never saw', LIMIT, async () => {
      await assert.rejects(agent.openSession({ ...options(), resume: '00000000-0000-4000-8000-000000000000' }), /no (conversation|rollout) found/i);
    });

    it('interrupts a long turn', LIMIT, async () => {
      const session = await agent.openSession(options());
      try {
        const events = await collect(session, 'Write forty say lines, each a long sentence about calculus.', (event) => {
          if (event.type === 'text') session.interrupt();
        });

        assert.deepEqual(events.at(-1), { type: 'done', status: 'interrupted' });
      } finally {
        await session.close();
      }
    });

    it('takes a message sent during a tool call into the running turn', LIMIT, async () => {
      const session = await agent.openSession(options());
      const steer = randomUUID();
      let sentSteer = false;
      try {
        const events = await collect(session, 'Run the shell command `sleep 8`, then write a 300-word essay on the history of the telescope.', (event) => {
          // Claude folds a message in only at a tool boundary; Codex steers at any point, and may skip the command.
          const moment = agent.id === 'codex' ? event.type === 'text' : event.type === 'tool' && event.status === 'running';
          if (moment && !sentSteer) {
            sentSteer = true;
            session.send({ id: steer, text: 'Drop the essay. Reply only with the word STEERED.' });
          }
        });
        const taken = events.findIndex((event) => event.type === 'user' && event.id === steer);

        assert.ok(taken >= 0, JSON.stringify(events.map((e) => e.type)));
        assert.match(textOf(events.slice(taken)), /STEERED/);
      } finally {
        await session.close();
      }
    });

    it('reports a background subagent while it runs and once it finishes', LIMIT, async () => {
      const session = await agent.openSession(options());
      const instruction = agent.id === 'codex'
        ? 'Use your spawnAgent tool to start one subagent whose task is: "Reply with the number 4 and nothing else." Do NOT wait for it and do not call wait. Right after spawning, end your turn by replying exactly: SPAWNED.'
        : 'Use the Agent tool with run_in_background: true to start one subagent. Its task: reply with the number 4. Do not wait for it. Right after starting it, end your turn by replying exactly: SPAWNED.';
      try {
        const sets: number[] = [];
        const finished = until(session, (event) => event.type === 'notice', (event) => { if (event.type === 'background') sets.push(event.tasks.length); });
        session.send({ id: randomUUID(), text: instruction });
        const events = await finished;
        const notice = events.at(-1);

        assert.ok(sets.some((size) => size > 0), JSON.stringify(sets));
        assert.equal(notice?.type === 'notice' && notice.status, 'completed', JSON.stringify(notice));
      } finally {
        await session.close();
      }
    });
  });
}
