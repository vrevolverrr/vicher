<script module lang="ts">
  import type { Effort, ModelOption, PermissionPolicy } from '@/agents/types';

  /** The effort if the model takes it, else the model's own default. */
  function keptEffort(effort: Effort | undefined, model: ModelOption | undefined): Effort | undefined {
    return effort && model?.efforts.includes(effort) ? effort : undefined;
  }

  function effortName(effort: Effort | undefined): string {
    if (!effort) return 'Auto';
    return effort === 'xhigh' ? 'Extra high' : effort.charAt(0).toUpperCase() + effort.slice(1);
  }
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import { PERMISSION_POLICIES } from '@/agents/types';
  import { AGENT_IDS, PROVIDERS } from '@/agents/providers';
  import { agentIcon } from '@/chat/view/agentIcons';
  import type { ModelPickerHost, PermissionMenuHost } from '@/chat/view/ModelPickerHost';
  import Picker from '@/chat/view/Picker.svelte';
  import { icon } from '@/shared/view/icon';

  /**
   * The model, effort and permission buttons under the input, each with its menu. The model menu has a section per
   * agent, and picking a model of the other agent switches the chat to it. The effort menu offers Auto and the levels
   * the current model takes. Picking closes the menu, as do Escape and a press outside.
   */
  interface Props {
    host: ModelPickerHost & PermissionMenuHost;
    container: HTMLElement;
  }

  const { host, container }: Props = $props();

  const POLICY_NAMES: Record<PermissionPolicy, string> = { inherit: 'Inherit', auto: 'Auto', approval: 'Approval', bypass: 'Bypass' };
  const DESCRIPTIONS: Record<PermissionPolicy, string> = {
    inherit: "Use the agent's own permission settings",
    auto: 'Let the agent review eligible actions automatically',
    approval: 'Ask you when the agent requires permission',
    bypass: 'Skip approvals and any sandbox the agent runs in',
  };

  type Name = 'model' | 'effort' | 'permission';
  let opened = $state<Name>();

  const read = () => ({ agent: host.agent, choice: host.choice(host.agent), policy: host.permissionPolicy });
  let shown = $state(untrack(read));

  /** Redraws the labels from the host. */
  export function update(): void {
    shown = read();
  }

  export function close(): void {
    opened = undefined;
  }

  const picker = (name: Name) => ({
    open: opened === name,
    toggle: () => (opened = opened === name ? undefined : name),
    close,
    container,
  });

  /** The chosen model of the current agent, found by name when that version is no longer listed, else the default. */
  const current = (models: ModelOption[]): ModelOption | undefined =>
    models.find((model) => model.id === shown.choice.model)
    ?? models.find((model) => model.name === shown.choice.name)
    ?? models.find((model) => model.isDefault);
</script>

{#snippet option(name: string, detail: string | undefined, selected: boolean, choose: () => Promise<void>, title?: string)}
  <button
    type="button"
    class="vicher-menu-item vicher-picker-option"
    role="menuitemradio"
    aria-checked={selected}
    {title}
    onclick={() => {
      close();
      void choose();
    }}
    ><span class="vicher-picker-option-label">{name}</span>{#if detail}<span class="vicher-picker-option-detail">{detail}</span>{/if}{#if selected}<span
        class="vicher-picker-check"
        {@attach icon('check')}
      ></span>{/if}</button
  >
{/snippet}

<Picker {...picker('model')}>
  {#snippet label()}
    <svg {@attach agentIcon(shown.agent)}></svg><span>{shown.choice.name ?? 'Auto'}</span>
  {/snippet}
  {#each AGENT_IDS as agent (agent)}
    {@const modelLabel = PROVIDERS[agent].modelLabel}
    <div class="vicher-picker-section" role="group" aria-label={modelLabel}>
      <div class="vicher-picker-heading"><svg {@attach agentIcon(agent)}></svg><span>{modelLabel}</span></div>
      {#await host.models(agent)}
        <div class="vicher-picker-loading">Loading models…</div>
      {:then models}
        {@const choice = host.choice(agent)}
        {@const auto = models.find((model) => model.isDefault)}
        {@const here = agent === shown.agent}
        {@render option('Auto', auto?.name, here && !choice.model, () => host.choose(agent, { effort: keptEffort(choice.effort, auto) }))}
        {#each models as model (model.id)}
          {@render option(model.name, undefined, here && model.id === choice.model,
            () => host.choose(agent, { model: model.id, name: model.name, effort: keptEffort(choice.effort, model) }))}
        {/each}
      {/await}
    </div>
  {/each}
</Picker>

<Picker {...picker('effort')}>
  {#snippet label()}
    <span class="vicher-picker-icon" {@attach icon('gauge')}></span><span>{effortName(shown.choice.effort)}</span>
  {/snippet}
  {#await host.models(shown.agent) then models}
    {#each [undefined, ...current(models)?.efforts ?? []] as effort (effort)}
      {@render option(effortName(effort), undefined, effort === shown.choice.effort, () => host.choose(shown.agent, { ...shown.choice, effort }))}
    {/each}
  {/await}
</Picker>

<Picker
  {...picker('permission')}
  class="vicher-permission-picker"
  aria-label="Permission policy"
  title={`Permission policy: ${POLICY_NAMES[shown.policy]} (changes apply next turn)`}
>
  {#snippet label()}
    <span class="vicher-picker-icon" {@attach icon('shield')}></span><span>{POLICY_NAMES[shown.policy]}</span>
  {/snippet}
  {#each PERMISSION_POLICIES as policy (policy)}
    {@render option(POLICY_NAMES[policy], undefined, shown.policy === policy, () => host.choosePermission(policy), DESCRIPTIONS[policy])}
  {/each}
</Picker>

<style>
  .vicher-picker-icon {
    display: inline-flex;
    flex: none;
  }

  .vicher-picker-icon :global(.svg-icon) {
    width: 14px;
    height: 14px;
  }

  .vicher-picker-section + .vicher-picker-section {
    margin-top: 4px;
    padding-top: 4px;
    border-top: 1px solid var(--background-modifier-border);
  }

  .vicher-picker-heading {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px 4px;
    color: var(--text-muted);
    font-size: var(--font-ui-smaller);
    font-weight: var(--font-semibold);
  }

  .vicher-picker-loading {
    padding: 5px 8px;
    color: var(--text-faint);
  }

  .vicher-picker-option {
    gap: 6px;
    padding: 5px 8px;
    transition: background-color 150ms ease, transform 150ms ease;
  }

  .vicher-picker-option:active {
    transform: scale(0.98);
  }

  .vicher-picker-option-label {
    display: inline-block;
    transition: transform 180ms var(--vicher-ease-out);
  }

  .vicher-picker-option:is(:hover, :focus-visible) .vicher-picker-option-label {
    transform: translateX(2px);
  }

  .vicher-picker-option-detail {
    color: var(--text-faint);
  }

  .vicher-picker-check {
    display: inline-flex;
    margin-left: auto;
    padding-left: 12px;
    animation: vicher-check-in 180ms var(--vicher-ease-out);
  }

  .vicher-picker-check :global(.svg-icon) {
    width: 14px;
    height: 14px;
  }

  @media (prefers-reduced-motion: reduce) {
    .vicher-picker-option,
    .vicher-picker-option-label {
      transition: none;
    }

    .vicher-picker-check {
      animation: none;
    }
  }
</style>
