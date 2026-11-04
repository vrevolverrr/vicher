<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ToolApprovalRequest } from '@/agents/types';
  import { setIcon } from '@/shared/view/icon';

  /**
   * What the agent asks the student: a header, a body, and two answers. A caller that asks something other than a tool
   * request passes its own `body`; a tool request's fields and its full input draw under it. Everything is plain text:
   * tool arguments are untrusted and can contain code or markup.
   */
  interface Props {
    icon: string;
    heading: string;
    /** The heading's id, which names the card. */
    id: string;
    /** A line above the heading, such as which question this is. */
    label?: string;
    /** The agent's reason for asking. */
    reason?: string;
    body?: Snippet;
    /** The tool request whose fields and input draw after `body`. */
    request?: ToolApprovalRequest;
    decline: string;
    accept: string;
    /** Accept is offered only once there is something to accept. */
    canAccept?: boolean;
    onDecline: () => void;
    /** Also runs on Enter in a field of the body. */
    onAccept: () => void;
  }

  const { icon, heading, id, label, reason, body, request, decline, accept, canAccept = true, onDecline, onAccept }: Props = $props();

  const FIELDS = {
    command: ['Command', 'terminal'], file: ['File', 'file-text'], path: ['Path', 'file-text'],
    cwd: ['Working directory', 'folder'], url: ['URL', 'globe'], permissions: ['Access', 'shield'],
    changes: ['Changes', 'files'],
  } as const;

  const draw = (name: string) => (el: HTMLElement) => setIcon(el, name);
</script>

<form
  class="vicher-approval"
  onsubmit={(event) => {
    // A disabled accept already blocks submitting, Enter included.
    event.preventDefault();
    onAccept();
  }}
>
  <div class="vicher-approval-body">
    <div class={['vicher-approval-header', { 'has-label': label }]}>
      <span class="vicher-approval-icon" aria-hidden="true" {@attach draw(icon)}></span>
      <div class="vicher-approval-heading">
        {#if label}<div class="vicher-approval-label">{label}</div>{/if}
        <div class="vicher-approval-title" {id}>{heading}</div>
      </div>
    </div>
    {#if reason}<div class="vicher-approval-reason">{reason}</div>{/if}
    {@render body?.()}
    {#if request}
      <div class="vicher-approval-summary">
        {#each request.fields as field, f (f)}
          {@const [name, fieldIcon] = FIELDS[field.kind]}
          <div class="vicher-approval-row" data-field={field.kind}>
            <span class="vicher-approval-row-icon" aria-hidden="true" {@attach draw(fieldIcon)}></span>
            <div class="vicher-approval-row-content">
              <div class={field.kind === 'command' || field.kind === 'cwd' ? 'vicher-visually-hidden' : 'vicher-approval-label'}>{name}</div>
              <pre class="vicher-approval-value">{field.value}</pre>
            </div>
          </div>
        {/each}
        <details class="vicher-approval-disclosure" open={request.changes.length + request.fields.length === 0}>
          <summary>
            <span class="vicher-approval-chevron" aria-hidden="true" {@attach draw('chevron-right')}></span>
            <span>Request details</span>
          </summary>
          <pre class="vicher-approval-details">{JSON.stringify(request.input, null, 2)}</pre>
        </details>
      </div>
    {/if}
  </div>
  <div class="vicher-approval-actions">
    <button type="button" class="vicher-approval-deny" onclick={onDecline}>{decline}</button>
    <button type="submit" class="vicher-approval-allow" disabled={!canAccept}>{accept}</button>
  </div>
</form>

<style>
  .vicher-approval { display: contents; }
  .vicher-approval-body {
    max-height: min(300px, 32vh);
    min-width: 0;
    overflow: auto;
    scrollbar-width: thin;
    animation: reveal 180ms ease-out;
  }
  .vicher-approval-header { display: flex; align-items: center; gap: 8px; padding: 12px 14px 10px; }
  .vicher-approval-header.has-label { align-items: flex-start; padding-bottom: 12px; }
  .vicher-approval-heading { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .has-label .vicher-approval-heading { padding-top: 3px; }
  .vicher-approval-icon {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--interactive-accent) 9%, var(--background-primary));
    color: var(--text-accent);
  }
  .vicher-approval-icon :global(.svg-icon) { width: 16px; height: 16px; }
  .vicher-approval-title { min-width: 0; font-weight: var(--font-semibold); line-height: 1.35; overflow-wrap: anywhere; }
  .vicher-approval-reason {
    margin: 0 14px 10px;
    color: var(--text-muted);
    line-height: 1.45;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .vicher-approval-summary { padding: 0 14px 6px; }
  .vicher-approval-label { color: var(--text-muted); font-size: var(--font-smallest); }
  .vicher-approval-row { display: flex; align-items: flex-start; gap: 8px; margin-top: 8px; }
  .vicher-approval-row:first-child { margin-top: 0; }
  .vicher-approval-row-icon { display: flex; flex: 0 0 auto; padding-top: 3px; color: var(--text-muted); }
  .vicher-approval-row-icon :global(.svg-icon) { width: 16px; height: 16px; }
  .vicher-approval-row-content { min-width: 0; flex: 1; }
  .vicher-approval-value,
  .vicher-approval-details {
    margin: 4px 0 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--text-normal);
    font-family: var(--font-monospace);
    font-size: var(--font-smallest);
    line-height: 1.5;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .vicher-approval-row[data-field="command"] .vicher-approval-value,
  .vicher-approval-details {
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--background-secondary);
    tab-size: 2;
  }
  .vicher-approval-row[data-field="cwd"] .vicher-approval-value { color: var(--text-muted); }
  .vicher-approval-row[data-field="command"] .vicher-approval-row-icon { padding-top: 12px; }
  .vicher-approval-disclosure { margin-top: 6px; }
  .vicher-approval-disclosure > summary {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 28px;
    width: fit-content;
    max-width: 100%;
    padding: 4px 6px;
    margin-inline-start: -6px;
    border-radius: 6px;
    color: var(--text-muted);
    cursor: pointer;
    font-size: var(--font-smallest);
    list-style: none;
    transition: color 140ms ease, background-color 140ms ease;
  }
  .vicher-approval-disclosure > summary::-webkit-details-marker { display: none; }
  .vicher-approval-disclosure > summary:hover { color: var(--text-normal); background: var(--background-modifier-hover); }
  .vicher-approval-chevron { display: flex; flex: 0 0 auto; }
  .vicher-approval-chevron :global(.svg-icon) { width: 14px; height: 14px; transform: rotate(0deg); transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1); }
  .vicher-approval-chevron:dir(rtl) :global(.svg-icon) { transform: rotate(180deg); }
  .vicher-approval-disclosure[open] .vicher-approval-chevron :global(.svg-icon) { transform: rotate(90deg); }
  .vicher-approval-disclosure[open] > pre { animation: reveal 180ms ease-out; }
  .vicher-approval-actions {
    display: grid;
    grid-template-columns: 1fr 1.3fr;
    gap: 8px;
    padding: 10px 14px 12px;
    border-top: 1px solid var(--background-modifier-border);
  }
  .vicher-approval-actions button {
    width: 100%;
    min-width: 0;
    height: auto;
    min-height: 34px;
    padding: 6px 8px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 10px;
    box-shadow: none;
    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    white-space: normal;
    transition: background-color 140ms ease, box-shadow 140ms ease, transform 100ms ease;
  }
  .vicher-approval-actions .vicher-approval-deny { background: var(--background-primary); color: var(--text-normal); }
  .vicher-approval-actions .vicher-approval-deny:hover { background: var(--background-modifier-hover); }
  .vicher-approval-actions .vicher-approval-allow { background: var(--text-normal); color: var(--background-primary); border-color: transparent; }
  .vicher-approval-actions .vicher-approval-allow:hover { background: color-mix(in srgb, var(--text-normal) 88%, var(--background-primary)); }
  .vicher-approval-actions button:hover { transform: translateY(-1px); box-shadow: 0 2px 4px color-mix(in srgb, var(--text-normal) 8%, transparent); }
  .vicher-approval-actions button:active { transform: scale(0.97); box-shadow: none; }
  .vicher-approval-actions button:disabled { opacity: 0.5; cursor: default; transform: none; box-shadow: none; }
  .vicher-approval-actions button:focus-visible,
  .vicher-approval-disclosure > summary:focus-visible { outline: 2px solid var(--interactive-accent); outline-offset: 2px; }
  @keyframes reveal {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .vicher-approval-body,
    .vicher-approval-disclosure[open] > pre { animation: none; }
    .vicher-approval-actions button,
    .vicher-approval-disclosure > summary,
    .vicher-approval-chevron :global(.svg-icon) { transition: none; }
    .vicher-approval-actions button:is(:hover, :active) { transform: none; }
  }
</style>
