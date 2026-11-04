<script module lang="ts">
  import type { SkillOption } from '@/agents/types';

  /** Names that start with the query first, then those that only contain it or match in the description. */
  export function filterSkills(skills: SkillOption[], query: string): SkillOption[] {
    const needle = query.toLowerCase();
    const rank = (skill: SkillOption): number => {
      const name = skill.name.toLowerCase();
      if (name.startsWith(needle)) return 0;
      if (name.includes(needle)) return 1;
      return skill.description.toLowerCase().includes(needle) ? 2 : 3;
    };
    return skills
      .filter((skill) => rank(skill) < 3)
      .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  }
</script>

<script lang="ts" generics="T extends SkillOption">
  import Menu from '@/chat/view/Menu.svelte';

  /** The list above the input while a skill name (or a file name, after `@`) is typed; the input keeps focus and forwards the arrow keys. */
  interface Props {
    onPick: (item: T) => void;
    label?: string;
  }

  const { onPick, label = 'Skills' }: Props = $props();

  let items = $state.raw<T[]>([]);
  let query = $state('');
  let prefix = $state('');
  let active = $state(0);
  let open = $state(false);

  export function isOpen(): boolean {
    return open;
  }

  /** Lists `next`, or hides the menu when there is nothing to list. */
  export function show(next: T[], typed: string, shownPrefix: string): void {
    open = next.length > 0;
    items = next;
    query = typed;
    prefix = shownPrefix;
    active = 0;
  }

  export function hide(): void {
    open = false;
  }

  export function move(step: number): void {
    active = (active + step + items.length) % items.length;
  }

  export function pickActive(): void {
    const item = items[active];
    if (item) onPick(item);
  }

  const reveal = (index: number) => (el: HTMLElement): void => {
    if (index === active) el.scrollIntoView?.({ block: 'nearest' });
  };
</script>

<Menu {open} class="vicher-skill-menu" role="listbox" aria-label={label}>
  {#each items as item, index (index)}
    {@const at = query ? item.name.toLowerCase().indexOf(query.toLowerCase()) : -1}
    <!-- Keep focus in the input; a press picks without blurring it. -->
    <div
      class={['vicher-skill-option', { 'is-active': index === active }]}
      role="option"
      tabindex="-1"
      aria-selected={index === active}
      onmousedown={(event) => {
        event.preventDefault();
        onPick(item);
      }}
      onmousemove={() => (active = index)}
      {@attach reveal(index)}
    >
      <span class="vicher-skill-name"
        >{prefix}{#if at < 0}{item.name}{:else}{item.name.slice(0, at)}<span class="vicher-skill-match">{item.name.slice(at, at + query.length)}</span>{item.name.slice(at + query.length)}{/if}{#if item.argumentHint}<span class="vicher-skill-hint">{` ${item.argumentHint}`}</span>{/if}</span
      >
      <div class="vicher-skill-description">{item.description}</div>
    </div>
  {/each}
</Menu>

<style>
  :global(.vicher-skill-menu) {
    position: absolute;
    right: 0;
    bottom: calc(100% + 6px);
    left: 0;
    max-height: min(280px, 50vh);
    transform-origin: bottom center;
  }

  .vicher-skill-option {
    padding: 5px 8px;
    border-radius: 10px;
    cursor: pointer;
  }

  .vicher-skill-option.is-active {
    background: var(--background-modifier-hover);
  }

  .vicher-skill-name {
    font-weight: var(--font-medium);
  }

  .vicher-skill-hint {
    color: var(--text-faint);
    font-weight: var(--font-normal);
  }

  .vicher-skill-description {
    overflow: hidden;
    color: var(--text-muted);
    font-size: var(--font-ui-smaller);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
