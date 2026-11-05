/** @vitest-environment jsdom */
import { flushSync, mount, unmount } from 'svelte';
import Playback from '@/renderer/figure/view/Playback.svelte';

let player: ReturnType<typeof Playback>;
const change = vi.fn();

const root = () => document.body.querySelector<HTMLElement>('.vicher-player')!;
const button = (name: string) => root().querySelector<HTMLButtonElement>(`.is-${name}`)!;
const range = () => root().querySelector<HTMLInputElement>('input[type=range]')!;
const count = () => root().querySelector('output')!;
const click = (el: HTMLElement) => {
  el.click();
  flushSync();
};

beforeEach(() => {
  vi.useFakeTimers();
  document.body.replaceChildren();
  change.mockClear();
  player = mount(Playback, { target: document.body, props: { change } });
});

afterEach(() => {
  void unmount(player);
  vi.useRealTimers();
});

describe('Playback', () => {
  it('shows the position as a count, a scrubber and enabled ends', () => {
    player.update(4, 1, { offset: 1 });
    flushSync();

    expect(count().textContent).toBe('2 / 5');
    expect(count().style.minWidth).toBe('5ch');
    expect(range().max).toBe('4');
    expect(range().value).toBe('1');
    expect(range().style.getPropertyValue('--vicher-progress')).toBe('25%');
    expect([button('back').disabled, button('next').disabled, button('play').disabled, range().disabled]).toEqual([false, false, false, false]);
  });

  it('disables Back at the start, Next at the end, and everything with nothing to step', () => {
    player.update(2, 0);
    flushSync();
    expect([button('back').disabled, button('next').disabled]).toEqual([true, false]);

    player.update(2, 2);
    flushSync();
    expect([button('back').disabled, button('next').disabled]).toEqual([false, true]);

    player.update(0, 0);
    flushSync();
    expect([button('play').disabled, range().disabled]).toEqual([true, true]);
  });

  it('steps by the given step, and reports whether the move was forward', () => {
    player.update(10, 4, { step: 2 });
    flushSync();

    click(button('next'));
    click(button('back'));

    expect(change.mock.calls).toEqual([[6, true], [4, false]]);
  });

  it('clamps a move to the ends', () => {
    player.update(3, 2, { step: 5 });
    flushSync();

    click(button('next'));
    expect(change).toHaveBeenLastCalledWith(3, true);
    player.update(3, 1, { step: 5 });
    flushSync();
    click(button('back'));
    expect(change).toHaveBeenLastCalledWith(0, false);
  });

  it('moves to where the scrubber is dragged', () => {
    player.update(5, 0);
    flushSync();

    range().value = '3';
    range().dispatchEvent(new Event('input', { bubbles: true }));

    expect(change).toHaveBeenCalledWith(3, false);
  });

  it('plays one step per interval, shows Pause meanwhile, and stops at the end', () => {
    player.update(2, 0, { ms: 500 });
    flushSync();

    click(button('play'));
    expect(button('play').getAttribute('aria-label')).toBe('Pause');
    expect(button('play').title).toBe('Pause');
    expect(button('play').querySelector('path')!.getAttribute('d')).toBe('M4.5 3.5h2v9h-2zM9.5 3.5h2v9h-2z');

    vi.advanceTimersByTime(499);
    expect(change).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(change).toHaveBeenLastCalledWith(1, true);
    vi.advanceTimersByTime(500);
    expect(change).toHaveBeenLastCalledWith(2, true);
    flushSync();

    expect(button('play').getAttribute('aria-label')).toBe('Play');
    vi.advanceTimersByTime(5000);
    expect(change).toHaveBeenCalledTimes(2);
  });

  it('falls back to 800 ms and one step for a bad interval or step', () => {
    player.update(5, 0, { ms: -1, step: NaN });
    flushSync();

    click(button('play'));
    vi.advanceTimersByTime(799);
    expect(change).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(change).toHaveBeenCalledWith(1, true);
  });

  it('pauses on a second Play, and on any move the student makes', () => {
    player.update(5, 0, { ms: 100 });
    flushSync();

    click(button('play'));
    click(button('play'));
    vi.advanceTimersByTime(1000);
    expect(change).not.toHaveBeenCalled();

    click(button('play'));
    click(button('next'));
    change.mockClear();
    vi.advanceTimersByTime(1000);
    expect(change).not.toHaveBeenCalled();
    expect(button('play').getAttribute('aria-label')).toBe('Play');
  });

  it('starts again from the beginning when Play is pressed at the end', () => {
    player.update(2, 2, { ms: 100 });
    flushSync();

    click(button('play'));

    expect(change).toHaveBeenCalledWith(0, false);
  });

  it('does not play when there is nothing to step', () => {
    player.update(0, 0);
    flushSync();

    button('play').click();
    vi.advanceTimersByTime(2000);

    expect(change).not.toHaveBeenCalled();
  });

  it('stops playing when its range becomes empty', () => {
    player.update(5, 0, { ms: 100 });
    flushSync();
    click(button('play'));

    player.update(0, 0);
    flushSync();
    vi.advanceTimersByTime(1000);

    expect(change).not.toHaveBeenCalled();
    expect(button('play').getAttribute('aria-label')).toBe('Play');
  });

  it('toggles play on Space in the scrubber, and ignores other keys', () => {
    player.update(5, 0, { ms: 100 });
    flushSync();

    range().dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    vi.advanceTimersByTime(300);
    expect(change).not.toHaveBeenCalled();

    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    range().dispatchEvent(space);
    expect(space.defaultPrevented).toBe(true);
    vi.advanceTimersByTime(100);
    expect(change).toHaveBeenCalledWith(1, true);
  });

  it('stops its timer when it is unmounted', () => {
    player.update(5, 0, { ms: 100 });
    flushSync();
    click(button('play'));

    void unmount(player);
    vi.advanceTimersByTime(1000);

    expect(change).not.toHaveBeenCalled();
    player = mount(Playback, { target: document.body, props: { change } });
  });

  it('keeps only Play when asked, and every control again after', () => {
    player.playOnly(true);
    flushSync();
    expect(root().classList.contains('is-play-only')).toBe(true);

    player.playOnly(false);
    flushSync();
    expect(root().classList.contains('is-play-only')).toBe(false);
  });
});
