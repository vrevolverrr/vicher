import type { AgentTurn } from '@/chat/ChatRecord';
import { countFigures, replaceFigures, splitReply } from '@/chat/splitReply';
import { LIMITS } from '@/renderer/figure/FigureData';

/** A figure of a live reply that failed and a repair may fix; `ordinal` is its place in the reply, from 0. */
export interface FigureFailure {
  ordinal: number;
  error: string;
}

/** What the hidden turn asks. It carries neither the failed source nor the figure contract, which the conversation already holds. */
export function repairMessage(failures: readonly FigureFailure[]): string {
  const lines = failures.map(({ ordinal, error }) => `Figure ${ordinal + 1} of your last reply failed: ${error.replace(/\r?\n/g, ' ').slice(0, LIMITS.repairError)}`);
  return `<figure-repair>
${lines.join('\n')}

Rewrite only these figures. Reply with each whole corrected \`\`\`figure fence, in this order, and nothing else. Change only what the errors need. Use no tools.
</figure-repair>`;
}

/** The sources in a repair reply by figure number, matched by order; undefined when its fences do not match the failures one for one. */
export function repairFixes(reply: string, failures: readonly FigureFailure[]): ReadonlyMap<number, string> | undefined {
  const fences = splitReply(reply, true).filter((segment) => segment.kind === 'figure');
  if (fences.length !== failures.length) return undefined;
  return new Map(failures.map(({ ordinal }, index) => [ordinal, fences[index].text]));
}

/** `turn` with the figures numbered in `fixes` replaced in its text. */
export function applyFixes(turn: AgentTurn, fixes: ReadonlyMap<number, string>): AgentTurn {
  let first = 0;
  const parts = turn.parts.map((part) => {
    if (part.type !== 'text') return part;
    const text = replaceFigures(part.text, fixes, first);
    first += countFigures(part.text);
    return { ...part, text };
  });
  return { ...turn, parts };
}
