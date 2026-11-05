<script lang="ts">
  import { SvelteMap } from 'svelte/reactivity';
  import type { AgentQuestion, QuestionAnswers, ToolApprovalRequest } from '@/agents/types';
  import ApprovalCard from '@/chat/view/ApprovalCard.svelte';
  import Card from '@/chat/view/Card.svelte';
  import InlineDiff from '@/chat/view/InlineDiff.svelte';
  import QuestionCard from '@/chat/view/QuestionCard.svelte';

  /**
   * Each chat owns its pending approvals and questions, including while its presentation is hidden. The card above the
   * chat tabs shows the first: a file change as an inline diff, a question as a form, any other request as its fields.
   */
  interface Props {
    /** The queue grew or shrank. */
    changed: () => void;
  }

  const { changed }: Props = $props();

  type Entry =
    | { id: string; request: ToolApprovalRequest; answer: (approved: boolean) => void }
    | { id: string; questions: readonly AgentQuestion[]; answer: (answers: QuestionAnswers | undefined) => void };

  const pending = new SvelteMap<object, Entry>();
  const current = $derived(pending.values().next().value);

  export function size(): number {
    return pending.size;
  }

  /** Resolves with the student's answer, or false once `signal` aborts. */
  export function ask(request: ToolApprovalRequest, signal: AbortSignal): Promise<boolean> {
    return enqueue(request, signal, false, (answer) => ({ id: newId(), request, answer }));
  }

  /** Resolves with one answer list per question, or undefined once the student skips or `signal` aborts. */
  export function askQuestions(questions: readonly AgentQuestion[], signal: AbortSignal): Promise<QuestionAnswers | undefined> {
    return enqueue<QuestionAnswers | undefined>(questions, signal, undefined, (answer) => ({ id: newId(), questions, answer }));
  }

  function enqueue<T>(key: object, signal: AbortSignal, cancelled: T, entry: (answer: (value: T) => void) => Entry): Promise<T> {
    if (signal.aborted) return Promise.resolve(cancelled);
    return new Promise((resolve) => {
      const settle = (value: T): void => {
        if (!pending.delete(key)) return;
        signal.removeEventListener('abort', cancel);
        resolve(value);
        changed();
      };
      const cancel = (): void => settle(cancelled);
      pending.set(key, entry(settle));
      signal.addEventListener('abort', cancel, { once: true });
      changed();
    });
  }

  function newId(): string {
    return `vicher-approval-${crypto.randomUUID()}`;
  }
</script>

<Card open={!!current} class="vicher-approval-card" role="region" aria-live="polite" aria-labelledby={current?.id}>
  <!-- Keyed by the request, so a button left from one request can never answer the next. -->
  {#each current ? [current] : [] as entry (entry)}
    {#if 'questions' in entry}
      <QuestionCard questions={entry.questions} id={entry.id} answer={entry.answer} />
    {:else}
      <ApprovalCard
        icon="shield-question"
        heading={`Allow ${entry.request.description}?`}
        id={entry.id}
        reason={entry.request.decisionReason}
        request={entry.request}
        decline="Deny"
        accept="Allow once"
        onDecline={() => entry.answer(false)}
        onAccept={() => entry.answer(true)}
      >
        {#snippet body()}
          {#if entry.request.changes.length}<InlineDiff request={entry.request} />{/if}
        {/snippet}
      </ApprovalCard>
    {/if}
  {/each}
</Card>

<style>
  :global(.vicher-approval-card) {
    grid-row: 3;
    margin-bottom: 42px;
    color: var(--text-normal);
    line-height: 1.5;
  }
</style>
