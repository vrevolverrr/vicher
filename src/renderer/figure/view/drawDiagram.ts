import { type Extent, type Room } from '@/renderer/figure/diagram/diagramExtent';
import { estimateLabel, labelOf, layoutDiagram, type LabelSize } from '@/renderer/figure/diagram/layoutDiagram';
import { arrowHeads, div, type Markdown, svg, tagInk } from '@/renderer/figure/view/dom';
import type { DiagramLayer, FigureNode } from '@/renderer/figure/FigureData';

type Diagram = Extract<FigureNode, { type: 'Diagram' }>;

/**
 * Draws a Diagram showing `extent` within `available` pixels of width, y upwards, scaled to fit; call again after a resize.
 * Returns the room past the border this drawing needs; it keeps at least `keep`, so every step of a figure can share the most
 * any step needs and nothing moves between them.
 */
export function drawDiagram(el: HTMLElement, diagram: Diagram, extent: Extent, available: number, markdown: Markdown, keep?: Room): Room {
  el.replaceChildren();
  el.classList.add('vicher-figure-diagram');
  // Every label is drawn and then measured in one layout; one not laid out (no layout, or a render still running) keeps an estimate.
  const boxes = new Map<DiagramLayer, HTMLElement>();
  const sizes = new Map<DiagramLayer, LabelSize>();
  for (const layer of diagram.children) {
    const text = labelOf(layer);
    if (text === undefined) continue;
    const box = el.appendChild(div('vicher-figure-diagram-label'));
    if (layer.tag) box.style.color = tagInk(layer.tag);
    if (layer.type === 'Shape' && layer.closed) box.classList.add('is-inside');
    markdown(box, text);
    boxes.set(layer, box);
    sizes.set(layer, estimateLabel(text));
  }
  for (const [layer, box] of boxes) {
    const rect = box.getBoundingClientRect();
    if (rect.width) sizes.set(layer, { width: rect.width, height: rect.height });
  }
  const layout = layoutDiagram(diagram, extent, available, sizes, keep);

  const { frame } = layout;
  const [width, height] = [frame.x1 - frame.x0, frame.y1 - frame.y0];
  const root = svg('svg', { width, height, viewBox: `${frame.x0} ${frame.y0} ${width} ${height}`, 'aria-hidden': 'true' }, el);
  el.prepend(root);
  const head = arrowHeads(root, { markerUnits: 'userSpaceOnUse', markerWidth: 11, markerHeight: 11 });
  for (const mark of layout.marks) {
    const { shape, className, tag } = mark;
    const attrs = mark.shape === 'path'
      ? { d: mark.d, fill: 'none', ...(mark.arrow ? { 'marker-end': head(tag ? tagInk(tag) : 'var(--vicher-figure-ink)') } : {}) }
      : { cx: mark.cx, cy: mark.cy, r: mark.r, ...(className === 'is-point' ? {} : { fill: 'none' }) };
    const el = svg(shape, { ...attrs, class: `vicher-figure-mark${className ? ` ${className}` : ''}` }, root);
    if (tag) el.style.color = tagInk(tag);
  }
  const shown = new Set<HTMLElement>();
  for (const { layer, x, y } of layout.labels) {
    const box = boxes.get(layer)!;
    box.style.left = `${x}px`;
    box.style.top = `${y}px`;
    shown.add(box);
  }
  for (const box of boxes.values()) if (!shown.has(box)) box.remove();
  el.style.width = `${width}px`;
  el.style.height = `${height}px`;
  return layout.needed;
}
