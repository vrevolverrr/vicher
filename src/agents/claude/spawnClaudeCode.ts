import type { SpawnedProcess, SpawnOptions } from '@anthropic-ai/claude-agent-sdk';
import type { ChildProcess, spawn as nodeSpawn } from 'child_process';
import crossSpawn from 'cross-spawn';

import {
  resolveWindowsCmdShimSpawnSpec,
  terminateSpawnedProcess,
  type WindowsCmdShimSpawnSpec,
} from '@/agents/process/windowsCmdShim';

const spawn = crossSpawn as typeof nodeSpawn;

/** The `exit` listeners the SDK added to `process`. */
const sdkExitListeners = new Set<(code: number) => void>();
/** A spawn can finish after unload, such as the model listing a quick reload interrupts. */
let released = false;

/**
 * Removes the `exit` listener the SDK adds to `process` on its first spawn and never removes. It would keep this
 * copy of the plugin's code alive after unload, about 2.5 MB for each reload of the plugin.
 */
export function releaseClaudeSdk(): void {
  released = true;
  for (const listener of sdkExitListeners) process.off('exit', listener);
  sdkExitListeners.clear();
}

/** Starts the CLI for the SDK, which would otherwise spawn it itself, and hands its stderr to `onStderr`; the SDK reads none from a process it did not start. */
export function spawnClaudeCode(options: SpawnOptions, onStderr: (text: string) => void = () => undefined): SpawnedProcess {
  const { args, command, cwd, env, signal } = options;
  // The SDK tracks the process it gets back in the same tick, which is when it adds its listener.
  const listeners = new Set(process.listeners('exit'));
  queueMicrotask(() => {
    for (const listener of process.listeners('exit')) if (!listeners.has(listener)) sdkExitListeners.add(listener);
    if (released) releaseClaudeSdk();
  });

  const resolvedSpawnSpec = resolveWindowsCmdShimSpawnSpec({ args, command });

  // Do not pass `signal` directly to spawn() — Obsidian's Electron runtime
  // uses a different realm for AbortSignal, causing `instanceof EventTarget`
  // checks inside Node's internals to fail. Handle abort manually instead.
  const child = spawn(resolvedSpawnSpec.command, resolvedSpawnSpec.args, {
    cwd,
    env: env,
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });
  installTreeAwareKill(child, resolvedSpawnSpec);

  if (signal) {
    const killChild = (): void => {
      child.kill('SIGTERM');
    };
    if (signal.aborted) {
      killChild();
    } else {
      signal.addEventListener('abort', killChild, { once: true });
    }
  }

  child.stderr?.on('data', (chunk: Buffer | string) => onStderr(String(chunk)));

  if (!child.stdin || !child.stdout) {
    throw new Error('Failed to create process streams');
  }

  return child;
}

function installTreeAwareKill(child: ChildProcess, spawnSpec: WindowsCmdShimSpawnSpec): void {
  if (!spawnSpec.killProcessTree) {
    return;
  }

  const originalKill = child.kill.bind(child);
  const callOriginalKill = (signal?: NodeJS.Signals | number): boolean =>
    originalKill(signal);
  const killableChild = {
    get pid(): number | undefined {
      return child.pid;
    },
    kill: callOriginalKill,
  };

  child.kill = ((signal?: NodeJS.Signals | number): boolean =>
    terminateSpawnedProcess(killableChild, signal, spawn, spawnSpec)
  );
}
