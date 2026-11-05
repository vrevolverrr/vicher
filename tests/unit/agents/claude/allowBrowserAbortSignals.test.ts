import events from 'events';

import { allowBrowserAbortSignals } from '@/agents/claude/allowBrowserAbortSignals';

const browserSignal = { aborted: false, addEventListener() {}, removeEventListener() {} } as unknown as EventTarget;

describe('allowBrowserAbortSignals', () => {
  const original = events.setMaxListeners;

  afterEach(() => {
    events.setMaxListeners = original;
  });

  it('starts from a Node that rejects a signal of the renderer', () => {
    expect(() => events.setMaxListeners(50, browserSignal)).toThrow(/eventTargets/);
  });

  it('lets such a signal through', () => {
    allowBrowserAbortSignals();

    expect(() => events.setMaxListeners(50, browserSignal)).not.toThrow();
  });

  it('still applies the limit to a real emitter', () => {
    allowBrowserAbortSignals();
    const emitter = new events.EventEmitter();

    events.setMaxListeners(7, emitter);

    expect(emitter.getMaxListeners()).toBe(7);
  });

  it('still rejects a bad limit and a target that is no signal', () => {
    allowBrowserAbortSignals();

    expect(() => events.setMaxListeners(-1, browserSignal)).toThrow();
    expect(() => events.setMaxListeners(50, {} as EventTarget)).toThrow(/eventTargets/);
  });

  it('wraps the function once', () => {
    allowBrowserAbortSignals();
    const patched = events.setMaxListeners;

    allowBrowserAbortSignals();

    expect(events.setMaxListeners).toBe(patched);
  });
});
