import { arrowHeads, div, lineInk, type Markdown, markData, type Marks, svg } from '@/renderer/figure/view/dom';
import type { FigureNode } from '@/renderer/figure/FigureData';
import { type Point, status } from '@/renderer/figure/geometry';
import { edgeKeys } from '@/renderer/figure/packages/network/layoutGraph';
import type { NetworkLayout } from '@/renderer/figure/packages/network/layoutNetwork';

type Graph = Extract<FigureNode, { type: 'Graph' }>;

function position(el: HTMLElement, p: Point): void {
  el.style.transform = `translate(${p.x}px, ${p.y}px)`;
}

/** Draws one step of a Graph at the places `layout` gives; nodes and edges absent from this step are hidden. */
export function drawGraph(parent: HTMLElement, graph: Graph, layout: NetworkLayout, marksOf: (id: string) => Marks, markdown: Markdown): void {
  const surface = parent.appendChild(div('vicher-figure-graph'));
  if (graph.id) surface.dataset.figureId = graph.id;
  surface.style.width = `${layout.width}px`;
  surface.style.height = `${layout.height}px`;
  const drawing = svg('svg', { width: layout.width, height: layout.height, 'aria-hidden': 'true', class: 'vicher-network-edges' }, surface);
  const head = arrowHeads(drawing, { markerUnits: 'userSpaceOnUse', markerWidth: 12, markerHeight: 12 });

  const present = new Map(edgeKeys(graph.edges).map((key, i) => [key, graph.edges[i]]));
  for (const geometry of layout.edges) {
    const edge = present.get(geometry.id);
    if (!edge) continue;
    const marks = edge.id ? marksOf(edge.id) : {};
    const path = svg('path', { d: geometry.path, fill: 'none', class: 'vicher-network-edge' }, drawing);
    if (edge.id) path.dataset.figureId = edge.id;
    markData(path, marks);
    if (edge.directed) path.setAttribute('marker-end', head(lineInk(marks)));
    if (edge.label === undefined) continue;
    const label = surface.appendChild(div('vicher-network-edge-label'));
    markData(label, marks);
    position(label, geometry.label);
    label.style.width = `${geometry.label.width}px`;
    label.style.height = `${geometry.label.height}px`;
    markdown(label.appendChild(createSpan()), `${status(marks.state ?? '')}${edge.label}`);
  }

  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  for (const [id, box] of layout.nodes) {
    const node = nodes.get(id);
    if (!node) continue;
    const marks = marksOf(id);
    const el = surface.appendChild(div('vicher-network-node'));
    el.dataset.figureId = id;
    markData(el, marks);
    position(el, box);
    el.style.width = `${box.width}px`;
    el.style.height = `${box.height}px`;
    markdown(el.appendChild(div('vicher-network-node-label')), `${status(marks.state ?? '')}${node.label ?? node.id}`);
    if (node.sub !== undefined) markdown(el.appendChild(div('vicher-network-node-sub')), node.sub);
  }
}
