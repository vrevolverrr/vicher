/**
 * @vitest-environment jsdom
 */
import { flushSync, mount, unmount } from 'svelte';
import type { Mock } from 'vitest';
import AttachmentChips from '@/attachments/view/AttachmentChips.svelte';
import { installFakeAnimate } from '../../../fakeAnimate';

vi.mock('obsidian', () => ({ setIcon: vi.fn() }));

const IMAGE = { key: 'a.png', name: 'a.png', src: 'app://a' };
const FILE = { key: '/Users/me/week1.pdf', name: 'week1.pdf', title: '/Users/me/week1.pdf' };

describe('AttachmentChips', () => {
  let tray: HTMLElement;
  let onRemove: Mock;
  let chips: ReturnType<typeof AttachmentChips>;
  let removeAnimate: () => void;
  let keyframes: Keyframe[][];
  let animated: HTMLElement[];

  const chipEls = () => [...tray.querySelectorAll<HTMLElement>('.vicher-attachment-chip')];
  const labels = () => [...tray.querySelectorAll('.vicher-context-label')].map((label) => label.textContent);
  const show = (...args: Parameters<typeof chips.set>) => {
    chips.set(...args);
    flushSync();
  };
  const wait = (ms: number) => vi.advanceTimersByTimeAsync(ms);

  beforeEach(() => {
    vi.useFakeTimers();
    removeAnimate = installFakeAnimate();
    const fakeAnimate = Element.prototype.animate as (...args: unknown[]) => unknown;
    keyframes = [];
    animated = [];
    Object.defineProperty(Element.prototype, 'animate', {
      configurable: true,
      value: vi.fn(function (this: HTMLElement, ...args: unknown[]) {
        animated.push(this);
        keyframes.push(args[0] as Keyframe[]);
        return fakeAnimate.apply(this, args);
      }),
    });
    document.body.replaceChildren();
    tray = document.body.appendChild(document.createElement('div'));
    tray.createDiv({ cls: 'vicher-context-chip' }).createSpan({ cls: 'vicher-context-label', text: 'Waves' });
    onRemove = vi.fn();
    chips = mount(AttachmentChips, { target: tray, props: { onRemove } });
    flushSync();
  });

  afterEach(() => {
    void unmount(chips);
    removeAnimate();
    vi.useRealTimers();
  });

  it('adds a thumbnail chip for an image and an icon chip for a file, beside the chips already in the tray', () => {
    show([IMAGE, FILE]);
    expect(labels()).toEqual(['Waves', 'a.png', 'week1.pdf']);
    expect(tray.querySelector('.vicher-image-chip img')?.getAttribute('src')).toBe('app://a');
    expect(chipEls().map((chip) => chip.classList.contains('vicher-image-chip'))).toEqual([true, false]);
    expect(chipEls()[1]!.title).toBe('/Users/me/week1.pdf');
    expect(chipEls()[0]!.title).toBe('a.png');
  });

  it('keeps the chip of an item that stays, and leaves the chips that are not its own', async () => {
    show([IMAGE]);
    const [first] = chipEls();
    show([IMAGE, FILE]);
    expect(chipEls()[0]).toBe(first);
    show([FILE]);
    await wait(500);
    expect(labels()).toEqual(['Waves', 'week1.pdf']);
    show([]);
    await wait(500);
    expect(labels()).toEqual(['Waves']);
  });

  it('reports the key of the chip whose remove button is clicked', () => {
    show([IMAGE, FILE]);
    const buttons = tray.querySelectorAll<HTMLElement>('.vicher-attachment-chip .vicher-context-remove');
    expect(buttons[1]!.getAttribute('aria-label')).toBe('Remove week1.pdf');
    buttons[1]!.click();
    buttons[0]!.click();
    expect(onRemove.mock.calls).toEqual([['/Users/me/week1.pdf'], ['a.png']]);
  });

  it('takes the chips out of the tray when unmounted', () => {
    show([IMAGE]);
    void unmount(chips);
    expect(labels()).toEqual(['Waves']);
    chips = mount(AttachmentChips, { target: tray, props: { onRemove } });
  });

  describe('motion', () => {
    it('animates a chip in once, and not when the list is set again', async () => {
      show([IMAGE]);
      await wait(500);
      const [image] = chipEls();
      const before = animated.length;
      expect(before).toBeGreaterThan(0);
      expect(animated.every((el) => el === image)).toBe(true);

      show([IMAGE]);
      await wait(500);
      expect(animated).toHaveLength(before);

      show([IMAGE, FILE]);
      await wait(500);
      expect(animated.filter((el) => el === chipEls()[1])).not.toHaveLength(0);
      expect(animated.filter((el) => el === image)).toHaveLength(before);
    });

    it('keeps a leaving chip, inert, until its animation ends, and lifts it away when sent', async () => {
      show([IMAGE]);
      await wait(500);
      keyframes = [];
      show([], 'sent');
      const leaving = chipEls()[0]!;
      expect(leaving.classList.contains('is-leaving')).toBe(true);
      expect(leaving.getAttribute('aria-hidden')).toBe('true');
      await wait(100);
      expect(leaving.isConnected).toBe(true);
      await wait(100);
      expect(leaving.isConnected).toBe(false);
      expect(keyframes.at(-1)?.at(-1)?.transform).toBe('translateY(-8px) scale(1)');
    });

    it('shrinks a removed chip away by default', async () => {
      show([IMAGE]);
      await wait(500);
      keyframes = [];
      show([]);
      await wait(500);
      expect(keyframes.at(-1)?.at(-1)?.transform).toBe('translateY(0px) scale(0.9)');
    });

    it('closes the gap beside a chip as the chip shrinks', async () => {
      tray.style.columnGap = '6px';
      show([IMAGE]);
      await wait(500);
      expect(keyframes[0]![0]!.marginRight).toBe('-6px');
    });

    it('shows a returning item as a new chip while the old one leaves', async () => {
      show([IMAGE]);
      await wait(500);
      show([]);
      show([IMAGE]);
      const chips = chipEls();
      expect(chips).toHaveLength(2);
      expect(chips.filter((chip) => !chip.classList.contains('is-leaving'))).toHaveLength(1);
    });
  });
});
