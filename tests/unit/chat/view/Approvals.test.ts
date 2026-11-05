/** @vitest-environment jsdom */
import { flushSync, mount, unmount } from 'svelte';

import type { AgentQuestion, QuestionAnswers, ToolApprovalRequest } from '@/agents/types';
import Approvals from '@/chat/view/Approvals.svelte';

vi.mock('obsidian', () => ({ setIcon: vi.fn() }));

const cards: ReturnType<typeof Approvals>[] = [];
afterEach(() => { for (const card of cards.splice(0)) void unmount(card); });

/** Mounts a card whose calls draw at once, as the pane sees them. */
function open(host: HTMLElement, changed: () => void = () => undefined) {
  const card = mount(Approvals, { target: host, props: { changed } });
  cards.push(card);
  const drawn = <T,>(answer: Promise<T>): Promise<T> => {
    flushSync();
    return answer.then((value) => { flushSync(); return value; });
  };
  return {
    ask: (request: ToolApprovalRequest, signal: AbortSignal): Promise<boolean> => drawn(card.ask(request, signal)),
    askQuestions: (questions: AgentQuestion[], signal: AbortSignal): Promise<QuestionAnswers | undefined> => drawn(card.askQuestions(questions, signal)),
    size: (): number => card.size(),
  };
}

const request = (): ToolApprovalRequest => ({
  description: 'these file changes', input: { path: '<img src=x onerror=alert(1)>', old: 'before', new: 'after' },
  fields: [{ kind: 'path', value: '<img src=x onerror=alert(1)>' }], changes: [],
});

it('shows plain-text details and exactly Deny and Allow once buttons', async () => {
  const host = document.body.createDiv();
  const card = open(host);
  const answer = card.ask(request(), new AbortController().signal);
  expect(host.querySelector('img')).toBeNull();
  expect(host.textContent).toContain('<img src=x onerror=alert(1)>');
  const region = host.querySelector('.vicher-approval-card')!;
  expect(region.hasAttribute('aria-label')).toBe(false);
  expect(region.getAttribute('aria-labelledby')).toBe(host.querySelector('.vicher-approval-title')!.id);
  const buttons = host.querySelectorAll('button');
  expect([...buttons].map((button) => button.textContent)).toEqual(['Deny', 'Allow once']);
  expect(host.querySelector('.vicher-approval-actions')?.contains(buttons[0]!)).toBe(true);
  expect(host.querySelector('.vicher-approval-body')?.contains(buttons[0]!)).toBe(false);
  buttons[1]!.click();
  expect(await answer).toBe(true);
  expect(host.querySelector('.vicher-approval-card')).toBeNull();
});

it('renders normalized command fields and keeps the opaque original input available', () => {
  const host = document.body.createDiv();
  const card = open(host);
  const controller = new AbortController();
  const input = { unfamiliar: 'opaque native request', command: 'not the displayed command' };
  void card.ask({
    description: 'this command', input, decisionReason: 'Check connectivity', changes: [],
    fields: [{ kind: 'command', value: 'curl https://example.com' }, { kind: 'cwd', value: '/vault' }],
  }, controller.signal);
  expect(host.querySelector('.vicher-approval-title')?.textContent).toBe('Allow this command?');
  expect(host.querySelector('.vicher-approval-reason')?.textContent).toBe('Check connectivity');
  expect([...host.querySelectorAll('.vicher-approval-value')].map((el) => el.textContent)).toEqual(['curl https://example.com', '/vault']);
  expect(host.querySelector('details')!.open).toBe(false);
  expect(host.querySelector('.vicher-approval-details')?.textContent).toBe(JSON.stringify(input, null, 2));
  controller.abort();
});

it('shows unfamiliar tool inputs expanded and does not interpret markup in any field', () => {
  const host = document.body.createDiv();
  const card = open(host);
  const controller = new AbortController();
  void card.ask({ description: '<img src=x>', decisionReason: '<script>alert(1)</script>', input: { custom: '<svg onload=alert(1)>' }, fields: [], changes: [] }, controller.signal);
  expect(host.querySelector('details')!.open).toBe(true);
  expect(host.querySelector('img, script, svg')).toBeNull();
  expect(host.textContent).toContain('<svg onload=alert(1)>');
  controller.abort();
});

it('shows normalized file changes as inline edits with one decision for the whole request', () => {
  const host = document.body.createDiv();
  const card = open(host);
  const controller = new AbortController();
  const input = { unfamiliar: 'original native request' };
  void card.ask({ description: 'these file changes', input, fields: [], changes: [
    { path: '<img src=x>.md', kind: 'update', blocks: [{ before: 'The dashboard is available.\n', after: 'The dashboard is live.\n' }] },
    { path: 'new.md', kind: 'add', blocks: [{ before: '', after: '<script>alert(1)</script>' }] },
  ] }, controller.signal);
  expect(host.querySelectorAll('.vicher-approval-diff')).toHaveLength(2);
  expect(host.querySelector('del')?.textContent).toBe('available');
  expect(host.querySelector('ins')?.textContent).toBe('live');
  expect(host.querySelector('.vicher-approval-diff-text > span')?.textContent).toBe('The dashboard is ');
  expect(host.querySelector('img, script')).toBeNull();
  expect(host.textContent).toContain('<script>alert(1)</script>');
  expect(host.querySelectorAll('button')).toHaveLength(2);
  expect(host.querySelector('details')!.open).toBe(false);
  expect(host.querySelector('.vicher-approval-details')?.textContent).toBe(JSON.stringify(input, null, 2));
  controller.abort();
});

it('renders proposed contents without inventing old text', () => {
  const host = document.body.createDiv();
  const card = open(host);
  const controller = new AbortController();
  void card.ask({ description: 'writing this file', input: {}, fields: [], changes: [
    { path: 'note.md', kind: 'write', note: 'Proposed contents; previous contents were not supplied.', blocks: [{ text: 'Proposed text' }] },
  ] }, controller.signal);
  expect(host.querySelector('.vicher-approval-diff-note')?.textContent).toContain('previous contents were not supplied');
  expect(host.querySelector('del, ins')).toBeNull();
  expect(host.querySelector('.vicher-approval-diff-text')?.textContent).toBe('Proposed text');
  controller.abort();
});

it('renders a normalized fallback field without attempting to parse its input', () => {
  const host = document.body.createDiv();
  const card = open(host);
  const controller = new AbortController();
  const changes = [{ path: 'a.md', diff: '-before\n+after' }, { path: 'b.md', unsupported: 'keep this visible' }];
  void card.ask({ description: 'these file changes', input: { changes }, changes: [], fields: [{ kind: 'changes', value: JSON.stringify(changes, null, 2) }] }, controller.signal);
  expect(host.querySelector('.vicher-approval-diff')).toBeNull();
  expect(host.querySelector('.vicher-approval-value')?.textContent).toBe(JSON.stringify(changes, null, 2));
  controller.abort();
});

it('queues concurrent requests and prevents old buttons from answering the next request', async () => {
  const host = document.body.createDiv();
  const card = open(host);
  const first = card.ask(request(), new AbortController().signal);
  const stale = host.querySelectorAll('button')[1]!;
  const second = card.ask(request(), new AbortController().signal);
  stale.click();
  expect(await first).toBe(true);
  stale.click();
  expect(card.size()).toBe(1);
  host.querySelector('button')!.click();
  expect(await second).toBe(false);
});

it('drops a request when its signal aborts', async () => {
  const host = document.body.createDiv();
  const changed = vi.fn();
  const card = open(host, changed);
  const controller = new AbortController();
  const first = card.ask(request(), controller.signal);
  controller.abort();
  expect(await first).toBe(false);
  expect(host.querySelector('.vicher-approval-card')).toBeNull();
  expect(card.size()).toBe(0);
  expect(changed).toHaveBeenCalledTimes(2);
  expect(await card.ask(request(), AbortSignal.abort())).toBe(false);
});

describe('questions', () => {
  const question = (overrides: Partial<AgentQuestion> = {}): AgentQuestion => ({
    header: 'Proof', question: 'Which <b>proof</b>?', multiSelect: false, other: true, secret: false,
    options: [{ label: 'Induction', description: 'On n' }, { label: 'Contradiction', description: '' }], ...overrides,
  });
  const card = (questions: AgentQuestion[], signal = new AbortController().signal) => {
    const host = document.body.createDiv();
    const answer = open(host).askQuestions(questions, signal);
    const submit = host.querySelector<HTMLButtonElement>('button[type=submit]')!;
    const type = (input: HTMLInputElement, value: string): void => {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      flushSync();
    };
    const pick = (input: HTMLInputElement): void => {
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      flushSync();
    };
    return { host, answer, submit, type, pick };
  };

  it('shows one question at a time and submits every answer from the last, drawing text as plain text', async () => {
    const { host, answer, submit, pick } = card([question(), question({ header: '', question: 'Which topics?', multiSelect: true })]);
    const title = (): string | null | undefined => host.querySelector('.vicher-approval-title')?.textContent;
    const label = (): string | null | undefined => host.querySelector('.vicher-approval-label')?.textContent;
    expect(host.querySelector('b')).toBeNull();
    expect(title()).toBe('Which <b>proof</b>?');
    expect(label()).toBe('Proof · 1 of 2');
    expect([submit.textContent, submit.disabled]).toEqual(['Next', true]);
    pick(host.querySelector('input')!);
    expect(submit.disabled).toBe(false);
    submit.click();
    flushSync();
    expect([title(), label()]).toEqual(['Which topics?', '2 of 2']);
    expect(document.activeElement).toBe(host.querySelector('input'));
    expect([submit.textContent, submit.disabled]).toEqual(['Submit', true]);
    for (const box of host.querySelectorAll<HTMLInputElement>('input[type=checkbox]')) pick(box);
    submit.click();
    expect(await answer).toEqual([['Induction'], ['Induction', 'Contradiction']]);
    expect(host.querySelector('.vicher-approval-card')).toBeNull();
  });

  it('lets typed text replace a single choice and hides a secret', async () => {
    const { host, answer, submit, type, pick } = card([question({ secret: true })]);
    const radio = host.querySelector<HTMLInputElement>('input[type=radio]')!;
    const other = host.querySelector<HTMLInputElement>('.vicher-question-other')!;
    expect(other.type).toBe('password');
    pick(radio);
    type(other, '  Direct  ');
    expect(radio.checked).toBe(false);
    submit.click();
    expect(await answer).toEqual([['Direct']]);
  });

  it('resolves undefined on Skip and on abort', async () => {
    const skipped = card([question()]);
    skipped.host.querySelector<HTMLButtonElement>('.vicher-approval-deny')!.click();
    expect(await skipped.answer).toBeUndefined();
    const controller = new AbortController();
    const aborted = card([question()], controller.signal);
    controller.abort();
    expect(await aborted.answer).toBeUndefined();
  });

  it('waits behind an earlier approval in the same queue', async () => {
    const host = document.body.createDiv();
    const approvals = open(host);
    const approved = approvals.ask(request(), new AbortController().signal);
    const answered = approvals.askQuestions([question()], new AbortController().signal);
    expect(approvals.size()).toBe(2);
    expect(host.querySelector('.vicher-question-options')).toBeNull();
    host.querySelector<HTMLButtonElement>('.vicher-approval-allow')!.click();
    expect(await approved).toBe(true);
    expect(host.querySelector('.vicher-question-options')).not.toBeNull();
    host.querySelector<HTMLButtonElement>('.vicher-approval-deny')!.click();
    expect(await answered).toBeUndefined();
  });
});
