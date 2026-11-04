import type { SpawnOptions } from '@anthropic-ai/claude-agent-sdk';
import spawn from 'cross-spawn';
import { PassThrough } from 'stream';

import { releaseClaudeSdk, spawnClaudeCode } from '@/agents/claude/spawnClaudeCode';

jest.mock('cross-spawn', () => jest.fn());

describe('spawnClaudeCode', () => {
  const originalPlatform = process.platform;
  const spawnMock = spawn as jest.MockedFunction<typeof spawn>;

  beforeEach(() => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
    jest.restoreAllMocks();
    spawnMock.mockReset();
  });

  const createMockProcess = () => {
    const stderr = new PassThrough();
    return {
      stdin: {} as NodeJS.WritableStream,
      stdout: {} as NodeJS.ReadableStream,
      stderr,
      pid: 12345,
      killed: false,
      exitCode: null,
      kill: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
    };
  };

  it('pipes stderr and hands each chunk to its reader', () => {
    const mockProcess = createMockProcess();
    spawnMock.mockReturnValue(mockProcess as unknown as ReturnType<typeof spawn>);
    const onStderr = jest.fn();

    spawnClaudeCode({ command: 'claude', args: [], cwd: '/tmp', env: {}, signal: new AbortController().signal }, onStderr);

    expect(spawnMock.mock.calls[0][2]?.stdio).toEqual(['pipe', 'pipe', 'pipe']);
    mockProcess.stderr.write('Error: not logged in');
    expect(onStderr).toHaveBeenCalledWith('Error: not logged in');
  });

  it('removes on release the exit listener the SDK adds when it tracks the process', async () => {
    spawnMock.mockReturnValue(createMockProcess() as unknown as ReturnType<typeof spawn>);
    const others = () => undefined;
    const sdk = () => undefined;
    process.on('exit', others);
    try {
      spawnClaudeCode({ command: 'claude', args: [], cwd: '/tmp', env: {}, signal: new AbortController().signal });
      process.on('exit', sdk);
      await Promise.resolve();
      releaseClaudeSdk();
      expect(process.listeners('exit')).not.toContain(sdk);
      expect(process.listeners('exit')).toContain(others);
    } finally {
      process.off('exit', others);
      process.off('exit', sdk);
    }
  });

  it('removes the listener of a spawn that finishes after release', async () => {
    spawnMock.mockReturnValue(createMockProcess() as unknown as ReturnType<typeof spawn>);
    const sdk = () => undefined;
    releaseClaudeSdk();
    try {
      spawnClaudeCode({ command: 'claude', args: [], cwd: '/tmp', env: {}, signal: new AbortController().signal });
      process.on('exit', sdk);
      await Promise.resolve();
      expect(process.listeners('exit')).not.toContain(sdk);
    } finally {
      process.off('exit', sdk);
    }
  });

  it('throws when process streams are missing', () => {
    const mockProcess = {
      stdin: null,
      stdout: null,
      stderr: null,
      killed: false,
      exitCode: null,
      kill: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
    };
    spawnMock.mockReturnValue(mockProcess as unknown as ReturnType<typeof spawn>);

    const signal = new AbortController().signal;

    expect(() => spawnClaudeCode({
      command: 'node',
      args: ['cli.js'],
      cwd: '/tmp',
      env: {},
      signal,
    })).toThrow('Failed to create process streams');
  });

  it('delegates returned Windows .cmd process kill to process-tree termination', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const mockProcess = createMockProcess();
    const originalKill = mockProcess.kill;
    spawnMock.mockReturnValue(mockProcess as unknown as ReturnType<typeof spawn>);

    const result = spawnClaudeCode({
      command: 'C:\\Users\\R&D\\AppData\\Roaming\\npm\\claude.cmd',
      args: ['--output-format', 'stream-json'],
      cwd: 'C:\\Vault',
      env: {},
    } as SpawnOptions);

    expect(spawnMock).toHaveBeenCalledWith(
      'C:\\Users\\R&D\\AppData\\Roaming\\npm\\claude.cmd',
      ['--output-format', 'stream-json'],
      expect.objectContaining({
        cwd: 'C:\\Vault',
        windowsHide: true,
      }),
    );

    expect(result).toBe(mockProcess);

    result.kill('SIGKILL');

    expect(spawnMock).toHaveBeenCalledWith(
      'taskkill.exe',
      ['/pid', '12345', '/t', '/f'],
      expect.objectContaining({
        stdio: 'ignore',
        windowsHide: true,
      }),
    );
    expect(originalKill).not.toHaveBeenCalled();
  });

  it('kills child immediately when signal is already aborted', () => {
    const mockProcess = createMockProcess();
    spawnMock.mockReturnValue(mockProcess as unknown as ReturnType<typeof spawn>);

    const controller = new AbortController();
    controller.abort();

    spawnClaudeCode({
      command: 'node',
      args: ['cli.js'],
      cwd: '/tmp',
      env: {},
      signal: controller.signal,
    });

    expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
  });

  it('kills child when signal aborts after spawn', () => {
    const mockProcess = createMockProcess();
    spawnMock.mockReturnValue(mockProcess as unknown as ReturnType<typeof spawn>);

    const controller = new AbortController();

    spawnClaudeCode({
      command: 'node',
      args: ['cli.js'],
      cwd: '/tmp',
      env: {},
      signal: controller.signal,
    });

    expect(mockProcess.kill).not.toHaveBeenCalled();

    controller.abort();

    expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
  });
});
