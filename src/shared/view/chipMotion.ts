import { cubicIn, quartOut } from 'svelte/easing';
import type { EasingFunction } from 'svelte/transition';

import { ms } from '@/shared/view/motion';

/** How a chip leaves: a dropped one shrinks away, a sent one rises toward the message it went with. */
export type ChipExit = 'dropped' | 'sent';

/**
 * Grows a chip from nothing or folds it back to nothing. Its box and the gap beside it shrink together, so the chips
 * next to it slide into place.
 */
function squeeze(chip: HTMLElement, { duration, easing, y = 0, scale = 1 }: { duration: number; easing: EasingFunction; y?: number; scale?: number }) {
  const style = getComputedStyle(chip);
  const gap = parseFloat(getComputedStyle(chip.parentElement!).columnGap) || 0;
  const { offsetWidth, offsetHeight } = chip;
  const [top, right, bottom, left] = [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].map((side) => parseFloat(side) || 0);
  return {
    duration: ms(duration),
    easing,
    css: (t: number, u: number) =>
      `width: ${t * offsetWidth}px; height: ${t * offsetHeight}px; padding: ${t * top}px ${t * right}px ${t * bottom}px ${t * left}px; margin-right: ${-u * gap}px; opacity: ${t}; transform: translateY(${u * y}px) scale(${1 - u * (1 - scale)})`,
  };
}

/** `in:` transition of a chip; with `animate` false it appears at once. */
export const arrive = (chip: HTMLElement, { animate = true }: { animate?: boolean } = {}) =>
  squeeze(chip, { duration: animate ? 200 : 0, easing: quartOut, scale: 0.9 });

/** `out:` transition of a chip. The chip stops taking clicks and is hidden from assistive technology while it goes. */
export function leave(chip: HTMLElement, { exit }: { exit: ChipExit }) {
  chip.classList.add('is-leaving');
  chip.setAttribute('aria-hidden', 'true');
  return squeeze(chip, { duration: 160, easing: cubicIn, ...(exit === 'sent' ? { y: -8 } : { scale: 0.9 }) });
}
