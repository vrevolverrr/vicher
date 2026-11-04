<script lang="ts">
  import { untrack } from 'svelte';
  import type { AgentQuestion, QuestionAnswers } from '@/agents/types';
  import ApprovalCard from '@/chat/view/ApprovalCard.svelte';

  /** The agent's questions, one at a time so each gets the whole card; Next leads to Submit on the last. */
  interface Props {
    questions: readonly AgentQuestion[];
    id: string;
    /** Undefined when the student skips. */
    answer: (answers: QuestionAnswers | undefined) => void;
  }

  const { questions, id, answer }: Props = $props();

  let index = $state(0);
  /** Per question: the chosen option of a single choice, the chosen ones of a multiple choice, and typed text. */
  // One card answers one set of questions; the queue mounts a new card for the next set.
  const single = $state(untrack(() => questions.map(() => '')));
  const multi = $state(untrack(() => questions.map((): string[] => [])));
  const typed = $state(untrack(() => questions.map(() => '')));

  const question = $derived(questions[index]);
  const last = $derived(index === questions.length - 1);

  function read(i: number): string[] {
    const { multiSelect, options } = questions[i];
    const chosen = multiSelect ? options.map((option) => option.label).filter((label) => multi[i].includes(label)) : single[i] ? [single[i]] : [];
    const text = typed[i].trim();
    return text ? [...chosen, text] : chosen;
  }

  function next(): void {
    if (last) answer(questions.map((_, i) => read(i)));
    else index += 1;
  }

  /** A question that follows another takes the focus, so the keyboard carries on where it was. */
  const focusFollowing = (el: HTMLElement): void => {
    if (index > 0) el.querySelector('input')?.focus();
  };
</script>

<ApprovalCard
  icon="message-circle-question"
  heading={question.question}
  {id}
  label={[question.header, questions.length > 1 ? `${index + 1} of ${questions.length}` : ''].filter(Boolean).join(' · ')}
  decline="Skip"
  accept={last ? 'Submit' : 'Next'}
  canAccept={read(index).length > 0}
  onDecline={() => answer(undefined)}
  onAccept={next}
>
  {#snippet body()}
    {#key index}
      <div class="vicher-question-options" role="group" aria-labelledby={id} {@attach focusFollowing}>
        {#each question.options as option (option.label)}
          <label class="vicher-question-option">
            {#if question.multiSelect}
              <input type="checkbox" value={option.label} bind:group={multi[index]} />
            {:else}
              <!-- One answer only: choosing an option clears the typed text, and typing clears the option. -->
              <input type="radio" name={`${id}-${index}`} value={option.label} bind:group={single[index]} onchange={() => (typed[index] = '')} />
            {/if}
            <div class="vicher-question-option-text">
              <div>{option.label}</div>
              {#if option.description}<div class="vicher-question-detail">{option.description}</div>{/if}
            </div>
          </label>
        {/each}
        {#if question.other}
          <input
            class="vicher-question-other"
            type={question.secret ? 'password' : 'text'}
            placeholder={question.options.length ? 'Something else' : 'Your answer'}
            aria-label={question.question}
            bind:value={typed[index]}
            oninput={() => { if (typed[index] && !question.multiSelect) single[index] = ''; }}
          />
        {/if}
      </div>
    {/key}
  {/snippet}
</ApprovalCard>

<style>
  .vicher-question-options { display: flex; flex-direction: column; gap: 6px; padding: 0 14px 14px; }
  .vicher-question-option {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 9px 12px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 10px;
    cursor: pointer;
    overflow-wrap: anywhere;
    transition: background-color 120ms ease, border-color 120ms ease;
  }
  .vicher-question-option:hover { background: var(--background-modifier-hover); }
  .vicher-question-option:has(input:checked) { border-color: var(--interactive-accent); background: color-mix(in srgb, var(--interactive-accent) 8%, transparent); }
  .vicher-question-option input { flex: none; margin: 3px 0 0; }
  .vicher-question-option-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .vicher-question-detail { color: var(--text-muted); font-size: var(--font-smallest); }
  .vicher-question-options .vicher-question-other { width: 100%; height: auto; margin-top: 6px; padding: 11px 14px; border-radius: 10px; }
</style>
