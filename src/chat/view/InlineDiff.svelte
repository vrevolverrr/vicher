<script module lang="ts">
  /** One run of a word diff: text both versions share, or text only the old or the new one has. */
  export interface ApprovalDiffPart {
    readonly kind: 'same' | 'removed' | 'added';
    readonly text: string;
  }

  /** The word-level edits from `before` to `after`, with a phrase replaced as one removal and one addition. */
  export function inlineDiff(before: string, after: string): readonly ApprovalDiffPart[] {
    const tokenize = (text: string): string[] => text.match(/\s+|[\p{L}\p{N}\p{M}_]+|[^\s]/gu) ?? [];
    const old = tokenize(before), next = tokenize(after);
    let start = 0, oldEnd = old.length, nextEnd = next.length;
    while (start < oldEnd && start < nextEnd && old[start] === next[start]) start++;
    while (oldEnd > start && nextEnd > start && old[oldEnd - 1] === next[nextEnd - 1]) { oldEnd--; nextEnd--; }
    const parts: ApprovalDiffPart[] = [];
    const append = (kind: ApprovalDiffPart['kind'], text: string): void => {
      if (!text) return;
      const previous = parts.at(-1);
      if (previous?.kind === kind) parts[parts.length - 1] = { kind, text: previous.text + text };
      else parts.push({ kind, text });
    };
    append('same', old.slice(0, start).join(''));
    const rows = oldEnd - start + 1, columns = nextEnd - start + 1;
    if (rows === 1 || columns === 1 || rows * columns > 250_000) {
      append('removed', old.slice(start, oldEnd).join(''));
      append('added', next.slice(start, nextEnd).join(''));
    } else {
      const lengths = new Uint32Array(rows * columns);
      for (let i = rows - 2; i >= 0; i--) for (let j = columns - 2; j >= 0; j--) {
        lengths[i * columns + j] = old[start + i] === next[start + j]
          ? 1 + lengths[(i + 1) * columns + j + 1]
          : Math.max(lengths[(i + 1) * columns + j], lengths[i * columns + j + 1]);
      }
      let i = start, j = start;
      while (i < oldEnd && j < nextEnd) {
        if (old[i] === next[j]) { append('same', old[i++]); j++; }
        else if (lengths[(i - start + 1) * columns + j - start] >= lengths[(i - start) * columns + j - start + 1]) append('removed', old[i++]);
        else append('added', next[j++]);
      }
      append('removed', old.slice(i, oldEnd).join(''));
      append('added', next.slice(j, nextEnd).join(''));
    }
    append('same', old.slice(oldEnd).join(''));
    // Shared spaces should not split one phrase replacement into alternating word highlights.
    const grouped: ApprovalDiffPart[] = [];
    for (let at = 0; at < parts.length;) {
      const current = parts[at];
      if (current.kind === 'same') { grouped.push(current); at++; continue; }
      let end = at + 1;
      while (end < parts.length && (parts[end].kind !== 'same'
        || (/^\s+$/u.test(parts[end].text) && parts[end + 1] !== undefined && parts[end + 1].kind !== 'same'))) end++;
      const changed = parts.slice(at, end);
      const removed = changed.filter((part) => part.kind !== 'added').map((part) => part.text).join('');
      const added = changed.filter((part) => part.kind !== 'removed').map((part) => part.text).join('');
      if (removed) grouped.push({ kind: 'removed', text: removed });
      if (added) grouped.push({ kind: 'added', text: added });
      at = end;
    }
    return grouped;
  }
</script>

<script lang="ts">
  import type { ToolApprovalRequest } from '@/agents/types';
  import { icon } from '@/shared/view/icon';

  /** A tool request that changes files: each file's edits inline, removals struck through and additions underlined. */
  interface Props {
    request: ToolApprovalRequest;
  }

  const { request }: Props = $props();

  const KINDS = { add: 'Added', delete: 'Deleted', update: 'Modified', write: 'Contents' } as const;
</script>

<div class="vicher-approval-changes">
  {#each request.changes as file, f (f)}
    <div class="vicher-approval-diff">
      <div class="vicher-approval-diff-header">
        <span class="vicher-approval-diff-icon" aria-hidden="true" {@attach icon('file-text')}></span>
        <span class="vicher-approval-diff-path">{file.path}</span>
        <span class="vicher-approval-diff-kind">{file.target ? 'Renamed' : KINDS[file.kind]}</span>
      </div>
      {#if file.target}<div class="vicher-approval-diff-note">Move to {file.target}</div>{/if}
      {#if file.note}<div class="vicher-approval-diff-note">{file.note}</div>{/if}
      {#each file.blocks as block, b (b)}
        {#if block.label}<div class="vicher-approval-diff-note">{block.label}</div>{/if}
        {@const parts: readonly ApprovalDiffPart[] = 'text' in block ? [{ kind: 'same', text: block.text }] : inlineDiff(block.before, block.after)}
        <div class="vicher-approval-diff-text" dir="auto">
          {#each parts as part, p (p)}{#if part.kind === 'removed'}<del>{part.text}</del>{:else if part.kind === 'added'}<ins>{part.text}</ins>{:else}<span>{part.text}</span>{/if}{/each}
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .vicher-approval-changes { padding: 0 14px 10px; }
  .vicher-approval-diff + .vicher-approval-diff { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--background-modifier-border); }
  .vicher-approval-diff-header { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; }
  .vicher-approval-diff-icon { display: flex; flex: 0 0 auto; padding-top: 3px; color: var(--text-muted); }
  .vicher-approval-diff-icon :global(.svg-icon) { width: 16px; height: 16px; }
  .vicher-approval-diff-path { flex: 1; min-width: 0; overflow-wrap: anywhere; font-size: var(--font-smallest); font-weight: var(--font-medium); }
  .vicher-approval-diff-kind { flex: none; color: var(--text-muted); font-size: var(--font-smallest); }
  .vicher-approval-diff-note { margin: 6px 0; color: var(--text-muted); font-size: var(--font-smallest); overflow-wrap: anywhere; }
  .vicher-approval-diff-text { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.65; tab-size: 2; }
  .vicher-approval-diff-text + .vicher-approval-diff-text { margin-top: 8px; }
  .vicher-approval-diff-text :is(del, ins) { padding-inline: 2px; border-radius: 3px; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
  .vicher-approval-diff-text del { color: var(--text-error); background: color-mix(in srgb, var(--color-red) 12%, transparent); text-decoration: line-through; }
  .vicher-approval-diff-text ins { color: var(--text-success, var(--color-green)); background: color-mix(in srgb, var(--color-green) 12%, transparent); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
</style>
