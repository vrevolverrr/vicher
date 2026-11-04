/**
 * @vitest-environment jsdom
 */
import { flushSync, mount, unmount } from 'svelte';
import type { SkillOption } from '@/agents/types';
import SkillMenu, { filterSkills } from '@/chat/view/SkillMenu.svelte';

describe('filterSkills', () => {
  const skills = [
    { name: 'review-plan', description: 'Check a plan.' },
    { name: 'plan', description: 'Write a plan.' },
    { name: 'zebra', description: 'Answer with a fixed word.' },
    { name: 'simplify', description: 'Plan cleanups.' },
  ];

  it('ranks names that start with the query, then names that contain it, then descriptions', () => {
    expect(filterSkills(skills, 'plan').map((skill) => skill.name)).toEqual(['plan', 'review-plan', 'simplify']);
  });

  it('lists every skill alphabetically for an empty query', () => {
    expect(filterSkills(skills, '').map((skill) => skill.name)).toEqual(['plan', 'review-plan', 'simplify', 'zebra']);
  });

  it('matches regardless of case', () => {
    expect(filterSkills(skills, 'ZEB').map((skill) => skill.name)).toEqual(['zebra']);
  });
});

describe('SkillMenu', () => {
  const SKILLS: SkillOption[] = [
    { name: 'plan', description: 'Write a plan.', argumentHint: '[topic]' },
    { name: 'review-plan', description: 'Check a plan.' },
    { name: 'simplify', description: 'Plan cleanups.' },
  ];
  let picked: SkillOption[];
  let menu: ReturnType<typeof SkillMenu<SkillOption>>;

  const rows = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')];
  const active = () => rows().filter((row) => row.getAttribute('aria-selected') === 'true').map((row) => row.querySelector('.vicher-skill-name')!.textContent);
  const show = (items: SkillOption[], query: string) => {
    menu.show(items, query, '/');
    flushSync();
  };

  beforeEach(() => {
    document.body.replaceChildren();
    picked = [];
    menu = mount(SkillMenu<SkillOption>, { target: document.body, props: { onPick: (skill) => picked.push(skill) } });
  });

  afterEach(() => unmount(menu));

  it('lists each item after the prefix, marking the typed part and the argument hint', () => {
    show(SKILLS, 'PLAN');

    expect(rows().map((row) => row.querySelector('.vicher-skill-name')!.textContent)).toEqual(['/plan [topic]', '/review-plan', '/simplify']);
    expect(rows().map((row) => row.querySelector('.vicher-skill-match')?.textContent)).toEqual(['plan', 'plan', undefined]);
    expect(menu.isOpen()).toBe(true);
  });

  it('closes when nothing matches', () => {
    show(SKILLS, 'pl');

    show([], 'xyz');

    expect(menu.isOpen()).toBe(false);
    expect(document.querySelector('.vicher-skill-menu')).toBeNull();
  });

  it('moves the active row with wrapping, starts again at the top on a new list, and picks the active row', () => {
    show(SKILLS, '');
    menu.move(-1);
    flushSync();
    expect(active()).toEqual(['/simplify']);

    menu.move(1);
    menu.move(1);
    flushSync();
    expect(active()).toEqual(['/review-plan']);

    show(SKILLS, 'p');
    expect(active()).toEqual(['/plan [topic]']);
    menu.move(1);
    menu.pickActive();
    expect(picked.map((skill) => skill.name)).toEqual(['review-plan']);
  });

  it('picks a row on press without taking the focus from the input', () => {
    show(SKILLS, '');
    const press = new MouseEvent('mousedown', { bubbles: true, cancelable: true });

    rows()[2]!.dispatchEvent(press);

    expect(picked.map((skill) => skill.name)).toEqual(['simplify']);
    expect(press.defaultPrevented).toBe(true);
  });
});
