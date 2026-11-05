<script lang="ts" module>
  const SENT_LIMIT = 200;

  /** Text as the student reads it, for a message sent in their name: no markup, comment or hidden character the Markdown view would not show. */
  function plain(text: string): string {
    return text
      .replace(/<!--[\s\S]*?(?:-->|$)|<\?[\s\S]*?(?:\?>|$)|<!\[CDATA\[[\s\S]*?(?:\]\]>|$)|<![A-Za-z][^>]*>|<\/?[a-zA-Z][^<>]*>/g, '')
      .replace(/[\p{Cc}\p{Cf}]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, SENT_LIMIT);
  }
</script>

<script lang="ts">
  import type { FigureNode } from '@/renderer/figure/FigureData';
  import type { Markdown } from '@/renderer/figure/view/dom';

  /**
   * A multiple-choice check: Submit marks the answer and sends it as the student's next message through `send`.
   * `answers` holds what was sent, by id or question, so a redraw shows the Quiz still answered.
   */
  interface Props {
    quiz: Extract<FigureNode, { type: 'Quiz' }>;
    markdown: Markdown;
    answers: Map<string, number>;
    send?: (message: string) => boolean;
  }

  const { quiz, markdown, answers, send }: Props = $props();

  const right = $derived(quiz.options.indexOf(quiz.correct));
  // A param can change the question or its answer under the same id; a saved answer belongs only to the same quiz.
  const key = $derived(JSON.stringify([quiz.id, quiz.question, quiz.options, quiz.correct]));
  // The Quiz is drawn once per figure draw, so what a prop held when it mounted is what these start from.
  /* svelte-ignore state_referenced_locally */
  let chosen = $state<number | null>(answers.get(key) ?? null);
  /* svelte-ignore state_referenced_locally */
  let locked = $state(chosen !== null);
  let note = $state('');
  const feedback = $derived(locked && chosen === right ? quiz.explanation : undefined);

  function submit(): void {
    if (chosen === null || locked) return;
    const verdict = chosen === right ? ' (correct)' : ' (not correct)';
    const message = `My answer: ${plain(quiz.options[chosen])}${verdict}. Question: ${plain(quiz.question)}`;
    if (send && !send(message)) {
      note = 'Wait for the reply to finish, then submit.';
      return;
    }
    locked = true;
    answers.set(key, chosen);
  }
</script>

<div class="vicher-quiz">
  <div class="vicher-quiz-question" {@attach (el) => markdown(el, quiz.question)}></div>
  <div class="vicher-quiz-options" role="radiogroup">
    {#each quiz.options as option, index (index)}
      <!-- The option's text is drawn by the host into the span, so the compiler cannot see it. -->
      <!-- svelte-ignore a11y_consider_explicit_label -->
      <button
        class={['vicher-quiz-option', { 'is-correct': locked && right === index, 'is-wrong': locked && chosen === index && right !== index }]}
        type="button"
        role="radio"
        aria-checked={chosen === index}
        disabled={locked}
        onclick={() => { chosen = index; note = ''; }}
      ><span {@attach (el) => markdown(el, option)}></span></button>
    {/each}
  </div>
  {#if !locked}
    <div class="vicher-quiz-bar">
      <span class="vicher-quiz-note">{note}</span>
      <button class="vicher-quiz-submit mod-cta" type="button" disabled={chosen === null} onclick={submit}>Submit</button>
    </div>
  {:else if feedback}
    <div class="vicher-quiz-feedback" aria-live="polite" {@attach (el) => markdown(el, feedback)}></div>
  {/if}
</div>

<style>
  /* The stack's gap alone spaces the blocks, so the paragraph margins at a text block's edges would double it. */
  .vicher-quiz-question > :global(:first-child),
  .vicher-quiz-question > :global(:first-child) > :global(:first-child),
  .vicher-quiz-feedback > :global(:first-child),
  .vicher-quiz-feedback > :global(:first-child) > :global(:first-child) {
    margin-top: 0;
  }

  .vicher-quiz-question > :global(:last-child),
  .vicher-quiz-question > :global(:last-child) > :global(:last-child),
  .vicher-quiz-feedback > :global(:last-child),
  .vicher-quiz-feedback > :global(:last-child) > :global(:last-child) {
    margin-bottom: 0;
  }

  .vicher-quiz {
    display: flex;
    flex-direction: column;
    gap: var(--size-4-3);
  }

  .vicher-quiz-question {
    font-weight: var(--font-semibold);
  }

  .vicher-quiz-options {
    display: flex;
    flex-direction: column;
    gap: var(--size-2-3);
  }

  /* Doubled up so Obsidian's own button styles (background, shadow, height) do not win. */
  .vicher-quiz .vicher-quiz-option {
    display: flex;
    align-items: center;
    gap: var(--size-4-3);
    width: 100%;
    height: auto;
    padding: var(--size-4-2) var(--size-4-3);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m);
    background: var(--background-primary);
    box-shadow: none;
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    line-height: var(--line-height-normal);
    white-space: normal;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s ease, background-color 0.15s ease, transform 0.1s ease;
  }

  .vicher-quiz .vicher-quiz-option > span {
    flex: 1;
    min-width: 0;
  }

  /* A round mark in front of each option. Picked, it fills with a dot; marked, it becomes a tick or a cross. */
  .vicher-quiz .vicher-quiz-option::before {
    content: '';
    flex: none;
    box-sizing: border-box;
    width: 16px;
    height: 16px;
    border: 2px solid var(--text-faint);
    border-radius: 50%;
    transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
  }

  .vicher-quiz .vicher-quiz-option > span > :global(:first-child),
  .vicher-quiz .vicher-quiz-option > span > :global(:first-child) > :global(:first-child) {
    margin: 0;
  }

  .vicher-quiz .vicher-quiz-option:hover:not(:disabled) {
    border-color: var(--background-modifier-border-hover);
    background: var(--background-modifier-hover);
  }

  .vicher-quiz .vicher-quiz-option:hover:not(:disabled)::before {
    border-color: var(--text-muted);
  }

  .vicher-quiz .vicher-quiz-option:active:not(:disabled) {
    transform: scale(0.99);
  }

  .vicher-quiz .vicher-quiz-option[aria-checked='true'] {
    border-color: var(--interactive-accent);
    background: color-mix(in srgb, var(--interactive-accent) 10%, var(--background-primary));
  }

  .vicher-quiz .vicher-quiz-option[aria-checked='true']::before {
    border-color: var(--interactive-accent);
    background: var(--interactive-accent);
    box-shadow: inset 0 0 0 2px var(--background-primary);
  }

  .vicher-quiz .vicher-quiz-option:focus-visible {
    outline: var(--vicher-focus-ring);
    outline-offset: 1px;
  }

  .vicher-quiz .vicher-quiz-option:disabled {
    cursor: default;
    opacity: 1;
  }

  /* Once marked, a tick or a cross replaces the round mark, and the border grows by 1px that the padding gives back. */
  .vicher-quiz .vicher-quiz-option.is-correct,
  .vicher-quiz .vicher-quiz-option.is-wrong {
    padding: calc(var(--size-4-2) - 1px) calc(var(--size-4-3) - 1px);
    border-width: 2px;
  }

  .vicher-quiz .vicher-quiz-option.is-correct::before,
  .vicher-quiz .vicher-quiz-option.is-wrong::before {
    width: 16px;
    height: auto;
    border: 0;
    background: none;
    box-shadow: none;
    font-size: var(--font-ui-medium);
    font-weight: var(--font-bold);
    line-height: 1;
    text-align: center;
    animation: vicher-check-in 0.25s var(--vicher-ease-overshoot);
  }

  .vicher-quiz .vicher-quiz-option.is-correct {
    border-style: dashed;
    border-color: var(--text-success);
    background: color-mix(in srgb, var(--text-success) 6%, var(--background-primary));
  }

  .vicher-quiz .vicher-quiz-option.is-correct::before {
    content: '✓';
    color: var(--text-success);
  }

  .vicher-quiz .vicher-quiz-option.is-wrong {
    border-color: var(--color-orange);
    background: color-mix(in srgb, var(--color-orange) 10%, var(--background-primary));
    animation: vicher-quiz-shake 0.3s ease;
  }

  .vicher-quiz .vicher-quiz-option.is-wrong::before {
    content: '✕';
    color: var(--color-orange);
  }

  .vicher-quiz-bar {
    display: flex;
    align-items: center;
    gap: var(--size-4-3);
    margin-top: var(--size-4-1);
  }

  .vicher-quiz-note {
    margin-right: auto;
    color: var(--text-muted);
    font-size: var(--font-ui-smaller);
  }

  .vicher-quiz .vicher-quiz-submit {
    height: auto;
    padding: var(--size-4-2) var(--size-4-6);
    border-radius: var(--radius-m);
    font-size: var(--font-ui-small);
    font-weight: var(--font-semibold);
    transition: opacity 0.15s ease, transform 0.1s ease, background-color 0.15s ease;
  }

  .vicher-quiz .vicher-quiz-submit:disabled {
    opacity: 0.45;
  }

  .vicher-quiz .vicher-quiz-submit:active:not(:disabled) {
    transform: scale(0.97);
  }

  .vicher-quiz-feedback {
    margin-top: var(--size-4-1);
    color: var(--text-muted);
    font-size: var(--font-ui-small);
    animation: vicher-pop-in 0.25s ease;
  }

  @keyframes vicher-quiz-shake {
    25% {
      transform: translateX(-3px);
    }
    75% {
      transform: translateX(3px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .vicher-quiz :global(*),
    .vicher-quiz :global(*)::before {
      animation: none !important;
      transition: none !important;
    }
  }
</style>
