import { cubicIn, quartOut } from 'svelte/easing';
import type { EasingFunction } from 'svelte/transition';

/** Whether to animate: `el` has the Web Animations API and the reader has not asked for less motion. */
export function canAnimate(el: Element = HTMLElement.prototype): boolean {
  return typeof el.animate === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** A `--vicher-ease-*` curve from `styles.css`, for the Web Animations API, which cannot read CSS variables. */
export function ease(name: 'out' | 'emphasized' | 'standard' | 'in', el: Element = document.body): string {
  return getComputedStyle(el).getPropertyValue(`--vicher-ease-${name}`).trim() || 'ease';
}

/** A transition's duration, or none where `canAnimate` says no. */
export function ms(duration: number): number {
  return canAnimate() ? duration : 0;
}

/** Fades a card and shrinks it, gap included, so the chat above grows smoothly instead of jumping. */
export function collapse(node: HTMLElement) {
  const duration = ms(280);
  if (!duration) return { duration };
  const style = getComputedStyle(node);
  const height = node.offsetHeight;
  const margin = parseFloat(style.marginBottom) || 0;
  const border = parseFloat(style.borderTopWidth) || 0;
  return {
    duration,
    easing: quartOut,
    css: (t: number) => `height: ${t * height}px; margin-bottom: ${t * margin}px; border-width: ${t * border}px; opacity: ${t}`,
  };
}

/** Fades in from a little below and a little smaller, or out the same way. */
export function pop(_node: Element, { y, scale, duration, easing }: { y: number; scale: number; duration: number; easing: EasingFunction }) {
  return {
    duration: ms(duration),
    easing,
    css: (t: number, u: number) => `opacity: ${t}; transform: translateY(${u * y}px) scale(${1 - u * (1 - scale)})`,
  };
}

/** How a chip leaves: a dropped one shrinks away, a sent one rises toward the message it went with. */
export type ChipExit = 'dropped' | 'sent';

/**
 * Grows a chip from nothing or folds it back to nothing. Its box and the gap beside it shrink together, so the chips
 * next to it slide into place.
 */
function squeeze(chip: HTMLElement, { duration, easing, y = 0, scale = 1 }: { duration: number; easing: EasingFunction; y?: number; scale?: number }) {
  const time = ms(duration);
  if (!time) return { duration: time };
  const style = getComputedStyle(chip);
  const gap = parseFloat(getComputedStyle(chip.parentElement!).columnGap) || 0;
  const { offsetWidth, offsetHeight } = chip;
  const [top, right, bottom, left] = [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].map((side) => parseFloat(side) || 0);
  return {
    duration: time,
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
