/** @vitest-environment jsdom */
import { formatElapsed } from '@/chat/view/ToolGroup';

vi.mock('obsidian', () => ({ setIcon: vi.fn() }));

it('formats seconds, minutes and hours', () => {
  expect([0, 45, 125, 3599, 3725, 90000].map(formatElapsed)).toEqual(['0s', '45s', '2m 5s', '59m 59s', '1h 2m', '25h 0m']);
});
