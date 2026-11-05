<script module lang="ts">
  const HIGH = 0.8;

  function formatTokens(count: number): string {
    return count >= 1000 ? `${Math.round(count / 1000)}k` : String(count);
  }
</script>

<script lang="ts">
  /** A ring in the composer bar showing how much of the model's context window the conversation fills; hidden until a turn reports it. */
  let usage = $state<{ used: number; limit: number }>();

  const share = $derived(usage ? Math.min(usage.used / usage.limit, 1) : 0);

  export function set(used: number, limit: number): void {
    usage = { used, limit };
  }

  export function clear(): void {
    usage = undefined;
  }
</script>

<div
  class={['vicher-context-meter', { 'is-empty': !usage }]}
  style:--vicher-context-share="{share * 100}%"
  data-high={usage ? share >= HIGH : undefined}
  aria-label={usage ? `Context ${Math.round(share * 100)}%: ${formatTokens(usage.used)} / ${formatTokens(usage.limit)} tokens` : undefined}
></div>

<style>
  .vicher-context-meter {
    --vicher-context-share: 0%;
    flex-shrink: 0;
    width: 14px;
    height: 14px;
    margin-left: 4px;
    border-radius: 50%;
    background: conic-gradient(var(--text-muted) var(--vicher-context-share), var(--background-modifier-border) 0);
    mask: radial-gradient(circle, transparent 3px, #000 3.5px);
  }

  .vicher-context-meter[data-high='true'] {
    background: conic-gradient(var(--text-error) var(--vicher-context-share), var(--background-modifier-border) 0);
  }

  .vicher-context-meter.is-empty {
    display: none;
  }
</style>
