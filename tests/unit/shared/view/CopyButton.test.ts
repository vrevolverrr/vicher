/**
 * @vitest-environment jsdom
 */
import { flushSync, mount, unmount } from 'svelte';
import CopyButton from '@/shared/view/CopyButton.svelte';

vi.mock('obsidian', () => ({ setIcon: vi.fn() }));

describe('CopyButton', () => {
  let writeText: ReturnType<typeof vi.fn>;
  let button: HTMLButtonElement;
  let copy: ReturnType<typeof CopyButton>;
  let text: string;

  const press = async () => {
    button.click();
    await vi.advanceTimersByTimeAsync(0);
    flushSync();
  };
  const copied = () => button.classList.contains('is-copied');

  beforeEach(() => {
    vi.useFakeTimers();
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    text = 'first';
    copy = mount(CopyButton, { target: document.body, props: { label: 'Copy it', text: () => text } });
    button = document.querySelector('button')!;
  });

  afterEach(() => {
    unmount(copy);
    vi.useRealTimers();
  });

  it('copies the text as it is when pressed', async () => {
    text = 'second';

    await press();

    expect(writeText).toHaveBeenCalledWith('second');
    expect(button.getAttribute('aria-label')).toBe('Copy it');
  });

  it('shows the check for 1.5 s, and a second press starts the moment again', async () => {
    await press();
    expect(copied()).toBe(true);

    await vi.advanceTimersByTimeAsync(1000);
    await press();
    await vi.advanceTimersByTimeAsync(1499);
    flushSync();
    expect(copied()).toBe(true);

    await vi.advanceTimersByTimeAsync(1);
    flushSync();
    expect(copied()).toBe(false);
  });

});
