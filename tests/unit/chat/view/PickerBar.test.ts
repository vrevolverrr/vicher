/**
 * @vitest-environment jsdom
 */
import { flushSync, mount, unmount } from 'svelte';
import type { AgentId, ModelOption, PermissionPolicy } from '@/agents/types';
import type { ModelChoice } from '@/chat/ChatDefaults';
import type { PickerHost } from '@/chat/view/PickerHost';
import PickerBar from '@/chat/view/PickerBar.svelte';

vi.mock('obsidian', () => ({ setIcon: vi.fn() }));

const MODELS: Record<AgentId, ModelOption[]> = {
  claude: [
    { id: 'opus', name: 'Opus', efforts: ['low', 'high', 'xhigh'], isDefault: false },
    { id: 'sonnet', name: 'Sonnet', efforts: ['low', 'high'], isDefault: true },
  ],
  codex: [{ id: 'gpt-6.1-sol', name: 'Sol', efforts: ['low', 'ultra'], isDefault: true }],
};

describe('PickerBar', () => {
  let container: HTMLElement;
  let agent: AgentId;
  let choices: Partial<Record<AgentId, ModelChoice>>;
  let policy: PermissionPolicy;
  let chosen: [AgentId, ModelChoice][];
  let host: PickerHost;
  let bar: ReturnType<typeof PickerBar>;

  const settle = async () => {
    await new Promise((resolve) => setTimeout(resolve));
    flushSync();
  };
  const buttons = () => [...container.querySelectorAll<HTMLButtonElement>('.vicher-picker')];
  const menu = () => container.querySelector('.vicher-picker-menu');
  const options = (scope = '') => [...menu()!.querySelectorAll<HTMLElement>(`${scope} .vicher-picker-option`)];
  const texts = (els: Element[]) => els.map((el) => el.textContent);
  const checked = (els: Element[]) => texts(els.filter((el) => el.getAttribute('aria-checked') === 'true'));
  const open = async (index: number) => {
    buttons()[index]!.click();
    await settle();
  };
  const start = () => {
    bar = mount(PickerBar, { target: container, props: { host, container } });
  };

  beforeEach(() => {
    document.body.replaceChildren();
    container = document.body.createDiv();
    agent = 'claude';
    choices = {};
    policy = 'inherit';
    chosen = [];
    host = {
      get agent() { return agent; },
      get permissionPolicy() { return policy; },
      models: async (id) => MODELS[id],
      choice: (id) => choices[id] ?? {},
      choose: async (id, choice) => { chosen.push([id, choice]); },
      choosePermission: async (next) => { policy = next; },
    };
  });

  afterEach(() => unmount(bar));

  it('lists a section per agent, each with Auto naming the default model, then the models', async () => {
    start();

    await open(0);

    expect(texts(options('[aria-label="Claude"]'))).toEqual(['AutoSonnet', 'Opus', 'Sonnet']);
    expect(texts(options('[aria-label="GPT"]'))).toEqual(['AutoSol', 'Sol']);
    expect(checked(options())).toEqual(['AutoSonnet']);
    expect(menu()!.querySelectorAll('.vicher-picker-heading svg[data-agent]')).toHaveLength(2);
    expect(buttons()[0]!.getAttribute('aria-expanded')).toBe('true');
    expect(menu()!.getAttribute('aria-labelledby')).toBe(buttons()[0]!.id);
  });

  it('picks a model of either agent, keeping an effort only if that model takes it, and closes', async () => {
    choices = { claude: { model: 'opus', name: 'Opus', effort: 'xhigh' }, codex: { effort: 'ultra' } };
    start();

    await open(0);
    expect(checked(options())).toEqual(['Opus']);
    options('[aria-label="Claude"]')[2]!.click();
    flushSync();
    expect(chosen).toEqual([['claude', { model: 'sonnet', name: 'Sonnet', effort: undefined }]]);
    expect(menu()).toBeNull();

    await open(0);
    options('[aria-label="GPT"]')[1]!.click();
    expect(chosen[1]).toEqual(['codex', { model: 'gpt-6.1-sol', name: 'Sol', effort: 'ultra' }]);
  });

  it('offers Auto and the chosen model\'s efforts, falling back to the default model\'s, and picks one', async () => {
    start();
    await open(1);
    expect(texts(options())).toEqual(['Auto', 'Low', 'High']);
    expect(checked(options())).toEqual(['Auto']);
    bar.close();

    choices.claude = { model: 'opus', name: 'Opus' };
    bar.update();
    await open(1);
    expect(texts(options())).toEqual(['Auto', 'Low', 'High', 'Extra high']);
    options()[3]!.click();
    flushSync();
    expect(chosen).toEqual([['claude', { model: 'opus', name: 'Opus', effort: 'xhigh' }]]);
    expect(menu()).toBeNull();
  });

  it('finds the model of a saved choice by its family when that version is no longer listed', async () => {
    host = { ...host, models: async () => [
      { id: 'opus', name: 'Opus', efforts: ['low', 'xhigh'], isDefault: true },
      { id: 'sonnet-5-5', name: 'Sonnet', efforts: ['low'], isDefault: false },
    ] };
    choices.claude = { model: 'sonnet-4', name: 'Sonnet' };
    start();

    await open(1);

    expect(texts(options())).toEqual(['Auto', 'Low']);
  });

  it('picks a permission policy and shows it on the button once the host says so', async () => {
    start();
    await open(2);

    options().find((el) => el.textContent === 'Approval')!.click();
    await settle();
    expect(policy).toBe('approval');
    expect(buttons()[2]!.querySelector('.vicher-picker-label')!.textContent).toBe('Inherit');

    bar.update();
    flushSync();
    expect(buttons()[2]!.querySelector('.vicher-picker-label')!.textContent).toBe('Approval');
  });

  it('keeps one menu open at a time', async () => {
    start();
    await open(0);

    await open(2);

    expect(container.querySelectorAll('.vicher-picker-menu')).toHaveLength(1);
    expect(buttons().map((button) => button.getAttribute('aria-expanded'))).toEqual(['false', 'false', 'true']);
  });

  it('closes on a press outside it', async () => {
    start();
    await open(1);

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    flushSync();

    expect(menu()).toBeNull();
    expect(buttons()[1]!.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on Escape and gives the focus back to its button', async () => {
    start();
    await open(1);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    flushSync();

    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(buttons()[1]);
  });

  it('moves the focus through the options with the arrow keys, wrapping at the ends', async () => {
    start();
    await open(2);
    const key = (name: string) => menu()!.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
    options()[0]!.focus();

    key('ArrowUp');
    expect(document.activeElement?.textContent).toBe('Bypass');
    key('ArrowDown');
    expect(document.activeElement?.textContent).toBe('Inherit');
    key('End');
    expect(document.activeElement?.textContent).toBe('Bypass');
  });
});
