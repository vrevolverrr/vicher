/**
 * @vitest-environment jsdom
 */
import { mount, unmount } from 'svelte';
import { setIcon } from 'obsidian';
import SendButton from '@/chat/view/SendButton.svelte';
import { installFakeAnimate } from '../../../fakeAnimate';

vi.mock('obsidian', () => ({
  setIcon: vi.fn((el: HTMLElement, name: string) => el.createSpan({ cls: 'svg-icon', attr: { 'data-icon': name } })),
}));

let button: ReturnType<typeof SendButton>;
let el: HTMLButtonElement;
const onSend = vi.fn();
const onStop = vi.fn();

beforeEach(() => {
  document.body.replaceChildren();
  vi.mocked(setIcon).mockClear();
  onSend.mockClear();
  onStop.mockClear();
  button = mount(SendButton, { target: document.body, props: { onSend, onStop } });
  el = document.body.querySelector('button')!;
});

afterEach(() => unmount(button));

const iconName = () => [...el.querySelectorAll('.svg-icon')].map((icon) => icon.getAttribute('data-icon'));

describe('SendButton', () => {
  it('starts as a disabled Send with an arrow', () => {
    expect(el.getAttribute('aria-label')).toBe('Send');
    expect(el.disabled).toBe(true);
    expect(el.classList.contains('is-streaming')).toBe(false);
    expect(iconName()).toEqual(['arrow-up']);
  });

  it('enables Send and sends on a click', () => {
    button.set(false, false);

    expect(el.disabled).toBe(false);
    el.click();
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onStop).not.toHaveBeenCalled();
  });

  it('turns into an enabled Stop with a square, and stops on a click', () => {
    button.set(true, false);

    expect(el.getAttribute('aria-label')).toBe('Stop');
    expect(el.classList.contains('is-streaming')).toBe(true);
    expect(iconName()).toEqual(['square']);
    el.click();
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onSend).not.toHaveBeenCalled();
  });

  it('swaps the icon without keeping the old one, and draws it only when it changes', () => {
    button.set(true, false);
    button.set(false, true);
    button.set(false, false);

    expect(iconName()).toEqual(['arrow-up']);
    expect(setIcon).toHaveBeenCalledTimes(3);
  });

  it('applies a change before set returns', () => {
    button.set(true, false);

    expect(el.getAttribute('aria-label')).toBe('Stop');
  });

  it('does not send while disabled', () => {
    el.click();

    expect(onSend).not.toHaveBeenCalled();
    expect(onStop).not.toHaveBeenCalled();
  });

  it('keeps the old icon beside the new one while they cross-fade, then only the new one', () => {
    vi.useFakeTimers();
    const removeAnimate = installFakeAnimate();

    button.set(true, false);

    expect(iconName()).toEqual(['arrow-up', 'square']);
    vi.advanceTimersByTime(200);
    expect(iconName()).toEqual(['square']);
    removeAnimate();
    vi.useRealTimers();
  });
});
