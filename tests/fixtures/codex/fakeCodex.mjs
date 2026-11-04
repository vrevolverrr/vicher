#!/usr/bin/env node
// Stands in for the `codex` CLI: `login status` and `app-server --listen stdio://`.
// FAKE_CODEX_SCENARIO lists how each turn plays out (the last repeats); FAKE_CODEX_LOG records every message received.
// Notification shapes follow codex-cli 0.162.1, tool items its 0.163.0 schema; the usage-limit turn was captured live.
// Steering, user messages and subagents follow codex-cli 0.166.0: a subagent runs as its own thread, reported to its parent by `subAgentActivity` items.
import { appendFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const args = process.argv.slice(2);
if (args[0] === 'login' && args[1] === 'status') {
  process.stderr.write(process.env.FAKE_CODEX_LOGGED_IN === '1' ? 'Logged in using ChatGPT\n' : 'Not logged in\n');
  process.exit(process.env.FAKE_CODEX_LOGGED_IN === '1' ? 0 : 1);
}

if (process.env.FAKE_CODEX_STARTUP_ERROR) {
  process.stderr.write(`${process.env.FAKE_CODEX_STARTUP_ERROR}\n`);
  process.exit(1);
}

const scenarios = (process.env.FAKE_CODEX_SCENARIO ?? 'stream').split(',');
const log = (entry) => process.env.FAKE_CODEX_LOG && appendFileSync(process.env.FAKE_CODEX_LOG, `${JSON.stringify(entry)}\n`);
const send = (message) => process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', ...message })}\n`);
const notify = (method, params) => send({ method, params });

process.on('SIGTERM', () => {
  log({ event: 'terminated' });
  process.exit(0);
});

const THREAD_ID = 'thread-1';
const DEFAULT_MODEL = process.env.FAKE_CODEX_DEFAULT_MODEL ?? 'gpt-6.1-sol';
// From codex-cli 0.163.0's model/list, trimmed to the fields Vicher reads; served as two pages.
const efforts = (levels) => levels.map((reasoningEffort) => ({ reasoningEffort, description: '' }));
const MODEL_PAGES = [
  [
    { id: 'gpt-6.1-sol', displayName: 'GPT-6.1-Sol', supportedReasoningEfforts: efforts(['low', 'medium', 'high', 'xhigh', 'max', 'ultra']), defaultReasoningEffort: 'low', isDefault: true },
    { id: 'gpt-6-astra', displayName: 'GPT-6-Astra', supportedReasoningEfforts: efforts(['low', 'medium', 'high', 'xhigh', 'max', 'ultra']), defaultReasoningEffort: 'low', isDefault: false },
    { id: 'gpt-6-sol', displayName: 'GPT-6-Sol', supportedReasoningEfforts: efforts(['low', 'medium', 'high', 'xhigh', 'max', 'ultra']), defaultReasoningEffort: 'medium', isDefault: false },
  ],
  [
    { id: 'gpt-6-luna', displayName: 'GPT-6-Luna', supportedReasoningEfforts: efforts(['low', 'medium', 'high', 'xhigh', 'max']), defaultReasoningEffort: 'medium', isDefault: false },
    { id: 'gpt-5.6-luna', displayName: 'GPT-5.6-Luna', supportedReasoningEfforts: efforts(['low', 'medium', 'high', 'xhigh', 'max']), defaultReasoningEffort: 'medium', isDefault: false },
  ],
];
// From codex-cli 0.163.0's skills/list, trimmed to the fields Vicher reads.
const SKILLS = [
  { name: 'zebra', description: 'Answer with a fixed word.', scope: 'repo', enabled: true },
  { name: 'outline', description: 'Outline a note in detail.', interface: { shortDescription: 'Outline a note' }, scope: 'user', enabled: true },
  { name: 'imagegen', description: 'Generate or edit images.', scope: 'system', enabled: true },
  { name: 'off', description: 'Switched off in config.', scope: 'user', enabled: false },
];
let turnCount = 0;
let modelListFailed = false;
let threadCwd = '';

const pendingApprovals = new Map();
/** The running turn of each thread. */
const activeTurns = new Map();
let userMessageCount = 0;

function startTurn(threadId, turnId) {
  activeTurns.set(threadId, turnId);
  notify('turn/started', { threadId, turn: { id: turnId, items: [], status: 'inProgress', error: null } });
}

/** A turn the server has ended whose `turn/completed` is still on its way; it reaches the client before the next reply. */
let lateCompletion = null;

function flushLateCompletion() {
  lateCompletion?.();
  lateCompletion = null;
}

function completeTurn(threadId, turnId, status, error = null) {
  if (activeTurns.get(threadId) !== turnId) return;
  activeTurns.delete(threadId);
  notify('turn/completed', { threadId, turn: { id: turnId, items: [], status, error } });
}

function userMessage(threadId, turnId, content) {
  const item = { type: 'userMessage', id: `user-${++userMessageCount}`, clientId: null, content };
  notify('item/started', { threadId, turnId, item });
  notify('item/completed', { threadId, turnId, item });
}

function say(threadId, turnId, id, text) {
  notify('item/agentMessage/delta', { threadId, turnId, itemId: id, delta: text });
  notify('item/completed', { threadId, turnId, item: { type: 'agentMessage', id, text } });
}

/** Spawns one subagent as the real server does; the child runs `child-<n>`, which spawns a grandchild of its own that the parent never reports. */
function spawnChild(scoped, n, prompt = `Count to ${n}`) {
  const child = `child-${n}`;
  const childTurn = `child-turn-${n}`;
  const spawn = { type: 'collabAgentToolCall', id: `spawn-${n}`, tool: 'spawnAgent', status: 'completed', senderThreadId: THREAD_ID, receiverThreadIds: [child], prompt, model: null, reasoningEffort: null, agentsStates: {} };
  const activity = (kind) => ({ type: 'subAgentActivity', id: `activity-${n}-${kind}`, kind, agentThreadId: child, agentPath: `/root/counter_${n}`, model: null, reasoningEffort: null });
  notify('item/started', { ...scoped, item: spawn });
  startTurn(child, childTurn);
  notify('item/completed', { ...scoped, item: activity('started') });
  notify('item/completed', { ...scoped, item: spawn });
  userMessage(child, childTurn, [{ type: 'text', text: `Count to ${n}`, text_elements: [] }]);
  notify('item/completed', { threadId: child, turnId: childTurn, item: { type: 'subAgentActivity', id: 'grand', kind: 'started', agentThreadId: 'grandchild-1', agentPath: '/root/counter/inner' } });
  startTurn('grandchild-1', 'grandchild-turn-1');
  say('grandchild-1', 'grandchild-turn-1', 'grand-msg', 'inner');
  completeTurn('grandchild-1', 'grandchild-turn-1', 'completed');
  say(child, childTurn, `child-msg-${n}-1`, 'Counting.');
  return () => {
    say(child, childTurn, `child-msg-${n}-2`, String(n));
    completeTurn(child, childTurn, 'completed');
    notify('item/completed', { threadId: THREAD_ID, item: activity('completed') });
  };
}

function playTurn(turnId, scenario, input) {
  const scoped = { threadId: THREAD_ID, turnId };
  startTurn(THREAD_ID, turnId);
  userMessage(THREAD_ID, turnId, input);
  const message = '{"type":"say","text":"Look at the definition first."}';
  switch (scenario) {
    case 'approval-command':
    case 'approval-file':
    case 'approval-permissions':
    case 'approval-resolved':
    case 'approval-stale':
    case 'approval-exit': {
      const isFile = scenario === 'approval-file';
      const isPermissions = scenario === 'approval-permissions';
      const item = isFile
        ? { type: 'fileChange', id: `edit-${turnId}`, changes: [{ path: `${threadCwd}/notes.md`, diff: '-before\n+after' }], status: 'inProgress' }
        : { type: 'commandExecution', id: `cmd-${turnId}`, command: 'echo hello', commandActions: [], status: 'inProgress' };
      notify('item/started', { ...scoped, item });
      const id = `approval-${turnId}`;
      const method = isFile ? 'item/fileChange/requestApproval' : isPermissions ? 'item/permissions/requestApproval' : 'item/commandExecution/requestApproval';
      pendingApprovals.set(id, { turnId, item, isPermissions });
      send({ id, method, params: {
        ...scoped, itemId: item.id,
        ...(scenario === 'approval-stale' ? { threadId: 'another-thread' } : {}),
        reason: 'This action needs permission',
        ...(isPermissions ? { permissions: { network: { enabled: true }, fileSystem: { write: ['/outside'] } } } : isFile ? { grantRoot: threadCwd } : { command: 'echo hello', cwd: threadCwd, availableDecisions: ['accept', 'decline'] }),
      } });
      if (scenario === 'approval-resolved') {
        notify('serverRequest/resolved', { threadId: THREAD_ID, requestId: id });
      }
      if (scenario === 'approval-exit') process.stdout.write('', () => process.exit(3));
      break;
    }
    case 'late-complete':
      // The turn ends on the server before the client hears of it, so a steer sent meanwhile loses the race.
      notify('item/agentMessage/delta', { ...scoped, itemId: 'msg-1', delta: message });
      activeTurns.delete(THREAD_ID);
      lateCompletion = () => notify('turn/completed', { threadId: THREAD_ID, turn: { id: turnId, items: [], status: 'completed', error: null } });
      setTimeout(flushLateCompletion, 50);
      break;
    case 'stream':
      notify('item/agentMessage/delta', { ...scoped, itemId: 'msg-1', delta: message.slice(0, 15) });
      notify('item/agentMessage/delta', { ...scoped, itemId: 'msg-1', delta: message.slice(15) });
      notify('item/completed', { ...scoped, item: { type: 'agentMessage', id: 'msg-1', text: message } });
      completeTurn(THREAD_ID, turnId, 'completed');
      break;
    case 'usage':
      notify('item/agentMessage/delta', { ...scoped, itemId: 'msg-1', delta: message });
      notify('thread/tokenUsage/updated', { ...scoped, tokenUsage: { total: { totalTokens: 90000 }, last: { totalTokens: 31000 }, modelContextWindow: 258400 } });
      notify('thread/tokenUsage/updated', { ...scoped, tokenUsage: { total: { totalTokens: 90000 }, last: { totalTokens: 31000 }, modelContextWindow: null } });
      completeTurn(THREAD_ID, turnId, 'completed');
      break;
    case 'usage-replay':
      notify('item/agentMessage/delta', { ...scoped, itemId: 'msg-1', delta: message });
      completeTurn(THREAD_ID, turnId, 'completed');
      break;
    case 'completion-only':
      notify('item/agentMessage/delta', { ...scoped, itemId: 'msg-1', delta: message.slice(0, 15) });
      notify('item/completed', { ...scoped, item: { type: 'agentMessage', id: 'msg-1', text: message } });
      completeTurn(THREAD_ID, turnId, 'completed');
      break;
    case 'usage-limit': {
      const error = {
        message: 'You’ve hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro), visit https://chatgpt.com/settings/usage to purchase more credits or try again at Oct 18th, 2026 12:46 AM.',
        codexErrorInfo: 'usageLimitExceeded',
        additionalDetails: null,
      };
      notify('error', { ...scoped, error, willRetry: false });
      completeTurn(THREAD_ID, turnId, 'failed', error);
      break;
    }
    case 'tools': {
      const say = (id, text) => {
        notify('item/agentMessage/delta', { ...scoped, itemId: id, delta: text });
        notify('item/completed', { ...scoped, item: { type: 'agentMessage', id, text } });
      };
      const read = { type: 'commandExecution', id: 'cmd-1', command: "/bin/zsh -lc 'cat notes.md'", commandActions: [{ type: 'read', command: 'cat notes.md', name: 'notes.md', path: `${threadCwd}/notes.md` }] };
      const edit = { type: 'fileChange', id: 'patch-1', changes: [{ path: `${threadCwd}/notes.md`, kind: { type: 'update' }, diff: '' }] };
      const reasoning = { type: 'reasoning', id: 'rs-1', summary: [], content: [] };
      say('msg-1', 'Let me check the note.');
      notify('item/started', { ...scoped, item: reasoning });
      notify('item/completed', { ...scoped, item: reasoning });
      notify('item/started', { ...scoped, item: { ...read, status: 'inProgress' } });
      notify('item/completed', { ...scoped, item: { ...read, status: 'completed' } });
      notify('item/started', { ...scoped, item: { ...edit, status: 'inProgress' } });
      notify('item/completed', { ...scoped, item: { ...edit, status: 'failed' } });
      say('msg-2', 'It tracks active users.');
      say('msg-3', 'Want an example?');
      completeTurn(THREAD_ID, turnId, 'completed');
      break;
    }
    case 'long':
      notify('item/agentMessage/delta', { ...scoped, itemId: 'msg-1', delta: message.slice(0, 15) });
      break;
    case 'exit':
      process.stderr.write('thread panicked at core/src/codex.rs\n', () => process.exit(3));
      break;
    case 'subagent':
    case 'subagent-unnamed': {
      // Codex may spawn with no task text; then only the child's path names it.
      const finish = spawnChild(scoped, 4, scenario === 'subagent-unnamed' ? null : undefined);
      say(THREAD_ID, turnId, 'msg-1', 'SPAWNED');
      completeTurn(THREAD_ID, turnId, 'completed');
      finish();
      break;
    }
    case 'subagent-long':
    case 'subagent-exit':
      spawnChild(scoped, 4);
      notify('item/agentMessage/delta', { ...scoped, itemId: 'msg-1', delta: 'Waiting on the counter.' });
      if (scenario === 'subagent-long') completeTurn(THREAD_ID, turnId, 'completed');
      break;
  }
}

const scenarioOf = (turn) => scenarios[Math.min(turn, scenarios.length) - 1];

createInterface({ input: process.stdin }).on('line', (line) => {
  const message = JSON.parse(line);
  log(message);
  if (message.id === undefined) return;
  if (!message.method) {
    const pending = pendingApprovals.get(message.id);
    if (!pending) return;
    pendingApprovals.delete(message.id);
    const accepted = pending.isPermissions ? Boolean(message.result?.permissions?.network?.enabled) : message.result?.decision === 'accept';
    notify('serverRequest/resolved', { threadId: THREAD_ID, requestId: message.id });
    notify('item/completed', { threadId: THREAD_ID, turnId: pending.turnId, item: { ...pending.item, status: accepted ? 'completed' : 'declined' } });
    completeTurn(THREAD_ID, pending.turnId, 'completed');
    return;
  }
  switch (message.method) {
    case 'initialize':
      send({ id: message.id, result: { userAgent: 'fake-codex', platformFamily: 'unix', platformOs: 'macos' } });
      break;
    case 'thread/start': {
      threadCwd = message.params.cwd;
      const result = { thread: { id: THREAD_ID }, model: message.params.model ?? DEFAULT_MODEL, reasoningEffort: process.env.FAKE_CODEX_CONFIG_EFFORT ?? null, approvalPolicy: message.params.approvalPolicy ?? 'on-request', sandbox: { type: message.params.sandbox === 'danger-full-access' ? 'dangerFullAccess' : message.params.sandbox === 'workspace-write' ? 'workspaceWrite' : 'readOnly', networkAccess: false }, approvalsReviewer: scenarios[0] === 'auto-unsupported' ? 'user' : message.params.approvalsReviewer ?? 'user' };
      const missing = message.params.ephemeral && scenarios[0].startsWith('inherit-missing-')
        ? scenarios[0].slice('inherit-missing-'.length) : undefined;
      send({ id: message.id, result: missing ? Object.fromEntries(Object.entries(result).filter(([field]) => field !== missing)) : result });
      break;
    }
    case 'thread/resume':
      if (message.params.threadId !== THREAD_ID) {
        send({ id: message.id, error: { code: -32600, message: `no rollout found for thread id ${message.params.threadId}` } });
        break;
      }
      threadCwd = message.params.cwd;
      send({ id: message.id, result: { thread: { id: THREAD_ID }, model: message.params.model ?? DEFAULT_MODEL, reasoningEffort: null, approvalsReviewer: message.params.approvalsReviewer ?? 'user' } });
      break;
    case 'thread/read':
      if (message.params.threadId === THREAD_ID || scenarios[0] === 'resume-broken') send({ id: message.id, result: { thread: { id: message.params.threadId } } });
      else send({ id: message.id, error: { code: -32600, message: `thread not found: ${message.params.threadId}` } });
      break;
    case 'turn/start': {
      if (scenarioOf(turnCount + 1) === 'start-fails') {
        send({ id: message.id, error: { code: -32603, message: 'thread is shutting down' } });
        break;
      }
      const turnId = `turn-${++turnCount}`;
      // A resumed thread replays its last usage under the earlier turn's id, ahead of the turn/start response.
      if (scenarioOf(turnCount) === 'usage-replay') {
        notify('thread/tokenUsage/updated', { threadId: THREAD_ID, turnId: 'turn-0', tokenUsage: { total: { totalTokens: 90000 }, last: { totalTokens: 19000 }, modelContextWindow: 258400 } });
      }
      send({ id: message.id, result: { turn: { id: turnId, items: [], status: 'inProgress', error: null } } });
      playTurn(turnId, scenarioOf(turnCount), message.params.input);
      break;
    }
    case 'turn/steer': {
      flushLateCompletion();
      const turnId = activeTurns.get(THREAD_ID);
      if (scenarioOf(turnCount) === 'subagent-exit') {
        process.stderr.write('thread panicked at core/src/codex.rs\n', () => process.exit(3));
        break;
      }
      if (!turnId || turnId !== message.params.expectedTurnId) {
        send({ id: message.id, error: { code: -32600, message: 'no active turn to steer' } });
        break;
      }
      send({ id: message.id, result: { turnId } });
      const scoped = { threadId: THREAD_ID, turnId };
      userMessage(THREAD_ID, turnId, message.params.input);
      // The real server never completes the message a steer cut; this one does, late, to show it adds nothing.
      notify('item/completed', { ...scoped, item: { type: 'agentMessage', id: 'msg-1', text: '{"type":"say","text":"Look at the definition first."}' } });
      say(THREAD_ID, turnId, `steered-${userMessageCount}`, `Took in: ${message.params.input.at(-1).text}`);
      break;
    }
    case 'model/list': {
      if (scenarios[0] === 'models-retry' && !modelListFailed) {
        modelListFailed = true;
        send({ id: message.id, error: { code: -32603, message: 'Model listing temporarily unavailable' } });
        break;
      }
      const page = Number(message.params.cursor ?? 0);
      send({ id: message.id, result: { data: MODEL_PAGES[page], nextCursor: page + 1 < MODEL_PAGES.length ? String(page + 1) : null } });
      break;
    }
    case 'skills/list':
      send({ id: message.id, result: { data: [{ cwd: message.params.cwds[0], skills: SKILLS, errors: [] }] } });
      break;
    case 'turn/interrupt':
      for (const [id, pending] of pendingApprovals) if (pending.turnId === message.params.turnId) pendingApprovals.delete(id);
      send({ id: message.id, result: {} });
      completeTurn(message.params.threadId, message.params.turnId, 'interrupted');
      break;
    default:
      send({ id: message.id, error: { code: -32601, message: `fake-codex: unhandled ${message.method}` } });
  }
});
