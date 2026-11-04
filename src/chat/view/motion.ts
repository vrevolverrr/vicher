import { quartOut } from 'svelte/easing';
import { prefersReducedMotion } from 'svelte/motion';

/** A transition's duration, or none where the reader asked for less motion or the Web Animations API is missing. */
export function ms(duration: number): number {
  return prefersReducedMotion.current || typeof Element.prototype.animate !== 'function' ? 0 : duration;
}

/** Fades a card and shrinks it, gap included, so the chat above grows smoothly instead of jumping. */
export function collapse(node: HTMLElement) {
  const style = getComputedStyle(node);
  const height = node.offsetHeight;
  const margin = parseFloat(style.marginBottom) || 0;
  const border = parseFloat(style.borderTopWidth) || 0;
  return {
    duration: ms(280),
    easing: quartOut,
    css: (t: number) => `height: ${t * height}px; margin-bottom: ${t * margin}px; border-width: ${t * border}px; opacity: ${t}`,
  };
}
