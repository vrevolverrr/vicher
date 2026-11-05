import events from 'events';

type SetMaxListeners = typeof events.setMaxListeners & { allowsBrowserSignals?: boolean };

const isSignal = (target: unknown): boolean => {
  const signal = target as Partial<AbortSignal> | null;
  return typeof signal?.aborted === 'boolean' && typeof signal.addEventListener === 'function';
};

/**
 * The Claude SDK calls `events.setMaxListeners(n, signal)` on a signal from the renderer's own `AbortController`, which
 * Node rejects as not one of its event targets. The call only silences a warning, so a signal is let through. The
 * `events` module is shared with every other plugin, and a clean Obsidian has no such patch until this one runs.
 */
export function allowBrowserAbortSignals(): void {
  const original: SetMaxListeners = events.setMaxListeners;
  if (original.allowsBrowserSignals) return;
  const patched: SetMaxListeners = (limit, ...targets) => {
    try {
      original(limit, ...targets);
    } catch (error) {
      if (typeof limit !== 'number' || limit < 0 || !targets.length || !targets.every(isSignal)) throw error;
    }
  };
  patched.allowsBrowserSignals = true;
  events.setMaxListeners = patched;
}
