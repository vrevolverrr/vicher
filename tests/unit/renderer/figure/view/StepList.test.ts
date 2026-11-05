/** @vitest-environment jsdom */
import { flushSync, mount, unmount } from 'svelte';
import StepList from '@/renderer/figure/view/StepList.svelte';

let list: ReturnType<typeof StepList>;
const pick = vi.fn();
const write = vi.fn((el: HTMLElement, text: string | number) => {
  el.textContent = String(text);
});

const steps = [{ caption: 'one' }, { caption: 'two', heading: 'Second' }, { caption: 'three' }];
const items = () => [...document.body.querySelectorAll<HTMLElement>('.vicher-step')];
const buttons = () => [...document.body.querySelectorAll<HTMLButtonElement>('.vicher-step-button')];
const live = () => document.body.querySelector('[aria-live]')!;

beforeEach(() => {
  document.body.replaceChildren();
  pick.mockClear();
  write.mockClear();
  list = mount(StepList, { target: document.body, props: { steps, write, pick } });
  flushSync();
});

afterEach(() => void unmount(list));

describe('StepList', () => {
  it('writes each heading and caption through the host, in order', () => {
    expect(write.mock.calls.map(([, text]) => text)).toEqual(['one', 'Second', 'two', 'three']);
    expect(items().map((item) => [...item.querySelector('.vicher-step-text')!.children].map((part) => `${part.classList[0]}:${part.textContent}`))).toEqual([
      ['vicher-step-caption:one'],
      ['vicher-step-heading:Second', 'vicher-step-caption:two'],
      ['vicher-step-caption:three'],
    ]);
    expect(items().map((item) => item.querySelector('.vicher-step-dot')!.textContent)).toEqual(['1', '2', '3']);
  });

  it('is a list of listitems, with no step current or done at first', () => {
    expect(document.body.querySelector('.vicher-steps-list')!.getAttribute('role')).toBe('list');
    expect(items().every((item) => item.getAttribute('role') === 'listitem')).toBe(true);
    expect(items().some((item) => item.classList.contains('is-current') || item.hasAttribute('aria-current'))).toBe(false);
  });

  it('marks the current step, the ones before it done, and announces the step', () => {
    list.show(1);
    flushSync();

    expect(items().map((item) => [item.classList.contains('is-done'), item.classList.contains('is-current'), item.getAttribute('aria-current')])).toEqual([
      [true, false, null],
      [false, true, 'step'],
      [false, false, null],
    ]);
    expect(live().textContent).toBe('Second: two');
    expect(live().getAttribute('aria-live')).toBe('polite');

    list.show(2);
    flushSync();
    expect(live().textContent).toBe('three');
    expect(items()[1].hasAttribute('aria-current')).toBe(false);
  });

  it('reports the index of the step clicked', () => {
    buttons()[2].click();

    expect(pick).toHaveBeenCalledWith(2);
  });

  it('shows one caption at a time that Tab skips, and lists them again after', () => {
    expect(buttons().map((button) => button.tabIndex)).toEqual([0, 0, 0]);

    list.single(true);
    flushSync();
    expect(document.body.querySelector('.vicher-steps')!.classList.contains('is-single')).toBe(true);
    expect(buttons().map((button) => button.tabIndex)).toEqual([-1, -1, -1]);

    list.single(false);
    flushSync();
    expect(document.body.querySelector('.vicher-steps')!.classList.contains('is-single')).toBe(false);
    expect(buttons().map((button) => button.tabIndex)).toEqual([0, 0, 0]);
  });
});
