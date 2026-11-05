/**
 * @vitest-environment jsdom
 */
import { flushSync, mount, unmount } from 'svelte';
import ContextMeter from '@/chat/view/ContextMeter.svelte';

let meter: ReturnType<typeof ContextMeter>;
let ring: HTMLElement;

beforeEach(() => {
  document.body.replaceChildren();
  meter = mount(ContextMeter, { target: document.body });
  ring = document.body.firstElementChild as HTMLElement;
});

afterEach(() => unmount(meter));

const update = (run: () => void): void => {
  run();
  flushSync();
};

describe('ContextMeter', () => {
  it('starts hidden', () => {
    expect(ring.classList.contains('is-empty')).toBe(true);
  });

  it('shows the share and labels it in thousands of tokens', () => {
    update(() => meter.set(84_000, 200_000));

    expect(ring.classList.contains('is-empty')).toBe(false);
    expect(ring.getAttribute('aria-label')).toBe('Context 42%: 84k / 200k tokens');
    expect(ring.style.getPropertyValue('--vicher-context-share')).toBe('42%');
    expect(ring.dataset.high).toBe('false');
  });

  it('writes a count under a thousand as it is, and a thousand as 1k', () => {
    update(() => meter.set(999, 1000));

    expect(ring.getAttribute('aria-label')).toBe('Context 100%: 999 / 1k tokens');
  });

  it('rounds the count to the nearest thousand', () => {
    update(() => meter.set(1500, 200_000));

    expect(ring.getAttribute('aria-label')).toBe('Context 1%: 2k / 200k tokens');
  });

  it('flags the window from 80% full', () => {
    update(() => meter.set(159_999, 200_000));
    expect(ring.dataset.high).toBe('false');

    update(() => meter.set(160_000, 200_000));
    expect(ring.dataset.high).toBe('true');
  });

  it('flags a nearly full window and caps the ring at full', () => {
    update(() => meter.set(210_000, 200_000));

    expect(ring.dataset.high).toBe('true');
    expect(ring.style.getPropertyValue('--vicher-context-share')).toBe('100%');
  });

  it('hides again on clear', () => {
    update(() => meter.set(1, 2));

    update(() => meter.clear());

    expect(ring.classList.contains('is-empty')).toBe(true);
  });
});
