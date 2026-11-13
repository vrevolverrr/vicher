import type { PROVIDERS } from './providers';

export type AgentId = keyof typeof PROVIDERS;

export const PERMISSION_POLICIES = ['inherit', 'auto', 'approval', 'bypass'] as const;
export type PermissionPolicy = typeof PERMISSION_POLICIES[number];

export function isPermissionPolicy(value: unknown): value is PermissionPolicy {
  return PERMISSION_POLICIES.some((policy) => policy === value);
}

/** A reasoning effort level as the CLI names it, such as "low", "xhigh", or "ultra". */
export type Effort = string;

/** One model family in the picker, on its latest version. */
export interface ModelOption {
  /** What `model` takes. */
  id: string;
  /** The family name without a version, such as "Opus" or "Sol". */
  name: string;
  /** The levels this model takes, lowest first; empty when it takes none. */
  efforts: Effort[];
  /** The CLI's own default, used when Vicher sends no model. */
  isDefault: boolean;
}

/** A skill or command the student can run from the chat input. */
export interface SkillOption {
  /** Without the agent's prefix. */
  name: string;
  description: string;
  /** What the skill takes after its name, such as "<file>". */
  argumentHint?: string;
}

/** How the CLI reads a skill in the prompt: `prefix` then the name. `atStart`: only at the very start of the prompt, else anywhere after whitespace. */
export interface SkillSyntax {
  prefix: string;
  atStart: boolean;
}

/** A tool Vicher runs for the agent, taking one string chosen from a fixed list. */
export interface AgentTool {
  name: string;
  description: string;
  argument: { name: string; values: readonly string[] };
  run(value: string): string;
  title(value: string): string;
}

export interface AgentSessionOptions {
  /** Vicher's instructions, added to the agent's own system prompt for the whole session. */
  systemPrompt: string;
  /** Omitted: the CLI's own default ("Auto" in the picker). */
  model?: string;
  /** Omitted: the CLI's own default. */
  effort?: Effort;
  /** Working directory for the agent process; the CLI loads its project instructions from here. */
  cwd: string;
  /** User-configured CLI path; when missing or invalid the CLI is auto-detected. */
  cliPath?: string;
  /** The `id` of an earlier session to continue, so the agent keeps its memory of that chat. Rejects when the CLI no longer has it. */
  resume?: string;
  /** Tools the agent may call besides its own. */
  tools?: AgentTool[];
  /** Inherit native settings unless this chat explicitly overrides them. */
  permissionPolicy?: PermissionPolicy;
}

/** A resume failed because the CLI no longer has the conversation, as opposed to failing for another reason. */
export class ConversationNotFoundError extends Error {
  constructor(readonly conversationId: string, cause: unknown) {
    super(cause instanceof Error ? cause.message : String(cause), { cause });
    this.name = 'ConversationNotFoundError';
  }
}

export type TurnStatus = 'completed' | 'interrupted' | 'failed';

export type ToolStatus = 'running' | 'done' | 'failed';

/** Work the agent started that outlives the CLI turn that started it, such as a background subagent or shell. */
export interface BackgroundTask {
  id: string;
  description: string;
}

/**
 * Every event of a session, in order, from the session's one reader.
 * `user` says the CLI took a sent message in; `dropped` says sent messages never will be. Within one session a message gets exactly one of them.
 * `text`, `tool`, `thinking`, `usage`, `approval` and `question` belong to the running CLI turn, and `done` ends it, once per CLI turn, prompted or not.
 * `tool` reports one of the agent's own tool calls, first as `running`, then with the same `id` once it ends.
 * `name` is the tool's short name such as "Read" or "Bash"; `title` is a one-line summary such as "Read notes/ch11.md".
 * `thinking` says the agent started work that writes no text, such as reasoning or composing a tool call.
 * `usage` reports the tokens the conversation now holds against the model's context window; the latest one wins.
 * A failed `done` carries a short `error` for the student and, when the CLI left any, its stderr as `detail` for diagnosis.
 * `background` carries the whole set of top-level background tasks each time it changes.
 * `notice` reports that one run of a top-level task ended: `task` is its id, `description` what `background` showed for it, `text` what it reported.
 */
export type AgentEvent =
  | { type: 'user'; id: string }
  /** `stopped`: an `interrupt` ended the message before it was taken in, so nothing went wrong. */
  | { type: 'dropped'; ids: string[]; error: string; stopped?: boolean }
  | { type: 'text'; delta: string }
  | { type: 'thinking' }
  | { type: 'tool'; id: string; name: string; title: string; status: ToolStatus }
  | { type: 'usage'; used: number; window: number }
  | { type: 'done'; status: TurnStatus; error?: string; detail?: string }
  /** The agent waits on `answer`; `signal` aborts on interrupt, close or process exit, and a later answer is ignored. */
  | { type: 'approval'; request: ToolApprovalRequest; signal: AbortSignal; answer: (approved: boolean) => void }
  /** The agent waits on `answer`: one list of answers per question, or undefined when the student declines. Same `signal`. */
  | { type: 'question'; questions: readonly AgentQuestion[]; signal: AbortSignal; answer: (answers: QuestionAnswers | undefined) => void }
  | { type: 'background'; tasks: BackgroundTask[] }
  | { type: 'notice'; task: string; description: string; status: NoticeStatus; text: string };

export type NoticeEvent = Extract<AgentEvent, { type: 'notice' }>;

export type NoticeStatus = 'completed' | 'failed' | 'stopped';

/** One list per question, in the order asked. */
export type QuestionAnswers = readonly (readonly string[])[];

/** A question the agent asks the student mid-turn. An answer is a chosen option's label or the student's own text. */
export interface AgentQuestion {
  readonly header: string;
  readonly question: string;
  readonly options: readonly { readonly label: string; readonly description: string }[];
  readonly multiSelect: boolean;
  /** Whether the student may type an answer of their own; always true when there are no options. */
  readonly other: boolean;
  readonly secret: boolean;
}

/** Display data only; the native agent still owns permission policy and the scope of an answer. */
export interface ToolApprovalRequest {
  readonly description: string;
  readonly decisionReason?: string;
  /** Original native input, retained for inspection rather than interpreted by consumers. */
  readonly input: Readonly<Record<string, unknown>>;
  readonly fields: readonly ToolApprovalField[];
  readonly changes: readonly ToolApprovalFileChange[];
}

export interface ToolApprovalField {
  readonly kind: 'command' | 'file' | 'path' | 'cwd' | 'url' | 'permissions' | 'changes';
  readonly value: string;
}

export interface ToolApprovalFileChange {
  readonly path: string;
  readonly kind: 'add' | 'delete' | 'update' | 'write';
  readonly target?: string;
  readonly note?: string;
  readonly blocks: readonly ToolApprovalBlock[];
}

/** Blocks are supplied snippets or hunks, not necessarily complete files. Text has no known before/after pair. */
export type ToolApprovalBlock = { readonly label?: string } & (
  | { readonly before: string; readonly after: string }
  | { readonly text: string }
);

export type ImageMediaType = 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';

/** An image file a turn carries. The adapter reads it from `path`, which is absolute. */
export interface TurnImage {
  path: string;
  mediaType: ImageMediaType;
}

/** A message for the agent. `id` is the caller's, and comes back on the `user` or `dropped` event for it. */
export interface AgentMessage {
  id: string;
  text: string;
  images?: TurnImage[];
}

export interface AgentSession {
  /** The CLI's own id for this conversation, which a later `resume` takes. Known as soon as the session opens. */
  readonly id: string;
  /**
   * Every event of the session, in order. Any number of listeners; events emitted while there are none are not kept.
   * No event is emitted before the first `send`, `stopTask` or process exit, so subscribing right after `openSession` loses nothing.
   */
  subscribe(listener: (event: AgentEvent) => void): () => void;
  /** Never blocks or throws for a busy agent. The provider queues the message or takes it into the running CLI turn. */
  send(message: AgentMessage): void;
  /** Ends the running CLI turn, with any message already taken into it. Messages not yet taken in still run; background tasks keep running. */
  interrupt(): void;
  /** Stops one background task. Resolves when the native call returns; its end arrives as `notice` and `background`. An unknown or finished id is a no-op. */
  stopTask(id: string): Promise<void>;
  /** Resolves once the CLI has started. */
  started(): Promise<void>;
  /** The title the CLI gave this conversation, or undefined while it has none. Only a CLI that names its conversations offers it; for the others the chat asks the agent to write one. */
  title?(): Promise<string | undefined>;
  /** The student's own skills the CLI reports for this session, without its bundled ones; read fresh each call. */
  skills(): Promise<SkillOption[]>;
  /** Switches model and effort from the next turn on; omitted means the CLI's own default. */
  setModel(model?: string, effort?: Effort): Promise<void>;
  close(): Promise<void>;
}

export type AuthState = 'missing' | 'logged-out' | 'logged-in';

export interface AgentAdapter {
  readonly id: AgentId;
  readonly skillSyntax: SkillSyntax;
  /** How the prompt names a file the CLI loads itself, or undefined when the turn must carry the file's text. */
  readonly fileMention?: (path: string) => string | undefined;
  authState(cliPath?: string): Promise<AuthState>;
  /** The CLI's own model list, one entry per family; starts a short-lived CLI process. */
  models(cliPath?: string): Promise<ModelOption[]>;
  openSession(options: AgentSessionOptions): Promise<AgentSession>;
}
