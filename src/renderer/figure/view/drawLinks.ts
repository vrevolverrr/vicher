import { arrowHeads, div, lineInk, type Markdown, markData, type Marks, svg } from '@/renderer/figure/view/dom';
import type { FigureNode } from '@/renderer/figure/FigureData';

/** A link with its group's colour, since links draw after their step and without the figure. */
export type Link = Extract<FigureNode, { type: 'Arrow' | 'Pointer' }> & Marks;
type Box = { el: Element; l: number; t: number; r: number; b: number };

/** A pointer is 20 px tall; the next one down sits this far below it. */
export const POINTER_STEP = 22;

/** A pointer's arrow and name, the arrow first unless the pointer stands left of what it points at. */
export function pointerLabel(name: string | number, arrow: string, markdown: Markdown, nameFirst = false): HTMLElement {
  const label = div('vicher-figure-pointer');
  const text = createSpan();
  markdown(text, name);
  const mark = Object.assign(div('vicher-figure-pointer-mark'), { textContent: arrow });
  label.append(...(nameFirst ? [text, mark] : [mark, text]));
  return label;
}

/**
 * Draws a step's arrows and pointers over it, from the boxes of the elements they name; call again after anything moves.
 * A pointer into a Tex goes in that Tex's pointer column instead.
 */
export function drawLinks(step: HTMLElement, links: readonly Link[], markdown: Markdown): void {
  step.querySelector(':scope > .vicher-figure-links')?.remove();
  for (const old of step.querySelectorAll('.vicher-figure-tex-lane > .vicher-figure-pointer')) old.remove();
  if (!links.length) return;
  const layer = step.appendChild(div('vicher-figure-links'));
  layer.setAttribute('aria-hidden', 'true');
  const frame = step.getBoundingClientRect();
  const drawing = svg('svg', { class: 'vicher-figure-links-svg', width: frame.width, height: frame.height }, layer);
  const head = arrowHeads(drawing, { markerWidth: 8, markerHeight: 8 });
  const box = (id: string): Box | null => {
    const el = step.querySelector(`[data-figure-id="${id}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { el, l: r.left - frame.left, t: r.top - frame.top, r: r.right - frame.left, b: r.bottom - frame.top };
  };
  // Each Table, Tex or Seq's pointers so far: one that would cover another moves down past it.
  const taken = new Map<Element, { top: number; x: number; half: number }[]>();
  for (const link of links) {
    if (link.type === 'Arrow') {
      const a = box(link.from);
      const b = box(link.to);
      if (!a || !b) continue;
      let start: [number, number];
      let end: [number, number];
      if (b.l >= a.r - 1) [start, end] = [[a.r, (a.t + a.b) / 2], [b.l, (b.t + b.b) / 2]];
      else if (b.r <= a.l + 1) [start, end] = [[a.l, (a.t + a.b) / 2], [b.r, (b.t + b.b) / 2]];
      else if (b.t >= a.b - 1) [start, end] = [[(a.l + a.r) / 2, a.b], [(b.l + b.r) / 2, b.t]];
      else [start, end] = [[(a.l + a.r) / 2, a.t], [(b.l + b.r) / 2, b.b]];
      const path = svg('path', { d: `M${start[0]} ${start[1]}L${end[0]} ${end[1]}`, class: 'vicher-figure-link', 'marker-end': head(lineInk(link)) }, drawing);
      markData(path, link);
      if (link.label === undefined) continue;
      const label = layer.appendChild(div('vicher-figure-link-label'));
      markData(label, link);
      label.style.left = `${(start[0] + end[0]) / 2}px`;
      label.style.top = `${(start[1] + end[1]) / 2}px`;
      markdown(label, link.label);
      continue;
    }
    const target = box(link.to);
    if (!target) continue;
    const table = target.el.closest('table');
    const tex = target.el.closest('.vicher-figure-tex');
    const column = tex?.querySelector<HTMLElement>(':scope > .vicher-figure-tex-lane');
    const seq = target.el.closest('.vicher-figure-seq');
    const owner = table ?? tex ?? seq ?? target.el;
    const placed = taken.get(owner) ?? [];
    taken.set(owner, placed);
    const pointer = column
      ? column.appendChild(pointerLabel(link.name, '←', markdown))
      : layer.appendChild(table ? pointerLabel(link.name, '→', markdown, true) : pointerLabel(link.name, '↑', markdown));
    // Pointers beside a Table or Tex share one column. One under a cell stays right of the step's edge, which cannot scroll to it.
    const half = table || tex ? 0 : pointer.getBoundingClientRect().width / 2;
    const x = table || tex ? 0 : Math.max((target.l + target.r) / 2, half);
    const hit = (y: number) => placed.find((p) => Math.abs(p.top - y) < POINTER_STEP && Math.abs(p.x - x) <= p.half + half);
    let top = table || tex ? (target.t + target.b) / 2 : target.b + 2;
    for (let other = hit(top); other; other = hit(top)) top = other.top + POINTER_STEP;
    placed.push({ top, x, half });
    if (table) {
      pointer.classList.add('is-left');
      pointer.style.left = `${table.getBoundingClientRect().left - frame.left - 4}px`;
      pointer.style.top = `${top}px`;
    } else if (column) {
      pointer.style.top = `${top - (column.getBoundingClientRect().top - frame.top)}px`;
    } else {
      pointer.style.left = `${x}px`;
      pointer.style.top = `${top}px`;
    }
    const lane = seq?.querySelector<HTMLElement>(':scope > .vicher-figure-lane');
    if (lane) lane.style.minHeight = `${Math.max(...placed.map((p) => p.top)) - target.b + POINTER_STEP + 2}px`;
    markData(pointer, link);
  }
}
