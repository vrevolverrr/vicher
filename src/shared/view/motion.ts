import { quartOut } from 'svelte/easing';
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
