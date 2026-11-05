/**
 * @vitest-environment jsdom
 */
import { flushSync, mount, unmount } from 'svelte';
import type { Mocked } from 'vitest';
import ContextChips from '@/chat/view/ContextChips.svelte';
import type { OpenDocumentState } from '@/context/NoteContext';
import { installFakeAnimate } from '../../../fakeAnimate';

vi.mock('obsidian', () => ({ setIcon: vi.fn() }));

const NOTE = { path: 'Physics/Waves.md', icon: 'file-text', label: 'Waves', excluded: false };

describe('ContextChips', () => {
  let host: Mocked<{ toggleNote(): void; removeSelection(): void }>;
  let chips: ReturnType<typeof ContextChips>;
  let removeAnimate: () => void;
  let animated: HTMLElement[];
  let keyframes: Keyframe[][];

  const tray = () => document.querySelector<HTMLElement>('.vicher-context-tray')!;
  const chipEls = () => [...document.querySelectorAll<HTMLElement>('.vicher-context-chip')];
  const labels = () => chipEls().map((chip) => chip.querySelector('.vicher-context-label')?.textContent);
  const show = (state: OpenDocumentState, exit?: 'dropped' | 'sent', animate?: boolean) => {
    chips.set(state, exit, animate);
    flushSync();
  };
  const wait = (ms: number) => vi.advanceTimersByTimeAsync(ms);

  beforeEach(() => {
    vi.useFakeTimers();
    removeAnimate = installFakeAnimate();
    const fakeAnimate = Element.prototype.animate as (...args: unknown[]) => unknown;
    animated = [];
    keyframes = [];
    Object.defineProperty(Element.prototype, 'animate', {
      configurable: true,
      value: vi.fn(function (this: HTMLElement, ...args: unknown[]) {
        animated.push(this);
        keyframes.push(args[0] as Keyframe[]);
        return fakeAnimate.apply(this, args);
      }),
    });
    document.body.replaceChildren();
    host = { toggleNote: vi.fn(), removeSelection: vi.fn() };
    chips = mount(ContextChips, { target: document.body, props: { host } });
    flushSync();
  });

  afterEach(() => {
    void unmount(chips);
    removeAnimate();
    vi.useRealTimers();
  });

  it('shows the note and the selection with a line count', () => {
    show({ note: NOTE, selection: { lines: 3 } });
    expect(labels()).toEqual(['Waves', '3 lines selected']);
    show({ note: NOTE, selection: { lines: 1 } });
    expect(labels()).toEqual(['Waves', '1 line selected']);
  });

  it('says whether the selection came from the chat', () => {
    show({ selection: { lines: 2, source: 'chat' } });
    expect(chipEls()[0]!.title).toBe('Selected chat text, sent with your next message');
    show({ selection: { lines: 2 } });
    expect(chipEls()[0]!.title).toBe('Selected text, sent with your next message');
  });

  it('updates a chip in place so it does not arrive again', async () => {
    show({ note: NOTE });
    await wait(500);
    const [before] = chipEls();
    expect(before!.title).toBe('Physics/Waves.md (click to leave out)');
    expect(before!.getAttribute('aria-pressed')).toBe('true');

    show({ note: { ...NOTE, label: 'Optics', excluded: true } });

    expect(chipEls()).toHaveLength(1);
    expect(chipEls()[0]).toBe(before);
    expect(labels()).toEqual(['Optics']);
    expect(before!.classList.contains('is-excluded')).toBe(true);
    expect(before!.getAttribute('aria-pressed')).toBe('false');
    expect(before!.title).toBe('Physics/Waves.md (left out; click to include)');
  });

  it('removes a chip when its subject goes away, and hides the empty tray', async () => {
    expect(tray().matches(':empty')).toBe(true);
    show({ note: NOTE, selection: { lines: 2 } });
    expect(tray().matches(':empty')).toBe(false);

    show({ note: NOTE });
    await wait(500);
    expect(labels()).toEqual(['Waves']);

    show({});
    await wait(500);
    expect(chipEls()).toEqual([]);
    expect(tray().matches(':empty')).toBe(true);
  });

  it('toggles the note on click, and on Enter or Space from the chip itself', () => {
    show({ note: NOTE });
    const [chip] = chipEls();
    /** Whether the page keeps its own handling of the key, such as scrolling for Space. */
    const press = (key: string, target: HTMLElement = chip!) => target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

    chip!.click();
    expect(press('Enter')).toBe(false);
    expect(press(' ')).toBe(false);
    expect(host.toggleNote).toHaveBeenCalledTimes(3);

    press('a');
    press('Enter', chip!.querySelector<HTMLElement>('.vicher-context-label')!);
    expect(host.toggleNote).toHaveBeenCalledTimes(3);
  });

  it('removes the selection without toggling the note', () => {
    show({ note: NOTE, selection: { lines: 2 } });

    document.querySelector<HTMLElement>('.vicher-context-remove')!.click();

    expect(host.removeSelection).toHaveBeenCalledTimes(1);
    expect(host.toggleNote).not.toHaveBeenCalled();
  });

  it('leaves the chips of whoever else shares the tray alone', async () => {
    const other = tray().createDiv({ cls: 'vicher-context-chip' });
    show({ note: NOTE });
    show({});
    await wait(500);
    expect(chipEls()).toEqual([other]);
  });

  describe('motion', () => {
    it('animates a chip in, and not again when it only changes', async () => {
      show({ note: NOTE });
      await wait(500);
      const [chip] = chipEls();
      const before = animated.filter((el) => el === chip).length;
      expect(before).toBeGreaterThan(0);
      expect(animated.every((el) => el === chip)).toBe(true);

      show({ note: { ...NOTE, excluded: true } });
      await wait(500);

      expect(animated.filter((el) => el === chip)).toHaveLength(before);
    });

    it('animates only the label when it changes', async () => {
      show({ note: NOTE });
      await wait(500);
      animated = [];

      show({ note: { ...NOTE, label: 'Optics' } });

      expect(animated.map((el) => el.className)).toEqual(['vicher-context-label']);
    });

    it('does not animate chips that appear without animation', () => {
      show({ note: NOTE, selection: { lines: 2 } }, 'dropped', false);
      expect(labels()).toEqual(['Waves', '2 lines selected']);
      expect(animated).toEqual([]);
    });

    it('does not animate a label that changes without animation', async () => {
      show({ note: NOTE }, 'dropped', false);
      animated = [];

      show({ note: { ...NOTE, label: 'Optics' } }, 'dropped', false);
      await wait(500);

      expect(animated).toEqual([]);
    });

    it('closes the gap beside a chip as the chip shrinks', async () => {
      tray().style.columnGap = '6px';
      show({ note: NOTE });
      await wait(500);

      expect(keyframes[0]![0]!.marginRight).toBe('-6px');
    });

    it('keeps a leaving chip, inert, until its animation ends', async () => {
      show({ note: NOTE, selection: { lines: 2 } });
      await wait(500);

      show({ note: NOTE }, 'sent');

      const leaving = document.querySelector<HTMLElement>('.vicher-context-chip.is-leaving')!;
      expect(leaving.textContent).toContain('2 lines selected');
      expect(leaving.getAttribute('aria-hidden')).toBe('true');
      await wait(100);
      expect(leaving.isConnected).toBe(true);
      await wait(100);
      expect(leaving.isConnected).toBe(false);
    });

    it.each([
      ['sent', 'translateY(-8px) scale(1)'],
      ['dropped', 'translateY(0px) scale(0.9)'],
    ] as const)('lets a chip go %s by ending its animation at %s', async (exit, end) => {
      show({ selection: { lines: 2 } });
      await wait(500);
      keyframes = [];

      show({}, exit);
      await wait(500);

      expect(keyframes.at(-1)?.at(-1)?.transform).toBe(end);
    });

    it('shows a returning subject as a new chip while the old one leaves', async () => {
      show({ note: NOTE });
      await wait(500);
      show({});
      show({ note: NOTE });

      expect(chipEls().filter((chip) => !chip.classList.contains('is-leaving'))).toHaveLength(1);
      expect(chipEls()).toHaveLength(2);
    });
  });
});
