import type { NodeOf } from '@/renderer/figure/components/registry';
import { layoutGraph } from '@/renderer/figure/network/layoutGraph';
import type { NetworkLayout } from '@/renderer/figure/network/layoutNetwork';
import type { ElementView } from '@/renderer/figure/view/components/ElementView';
import { drawGraph } from '@/renderer/figure/view/drawGraph';

/** One layout over every step the Graph is in, so nothing moves. */
export const GraphView: ElementView<NodeOf<'Graph'>, NetworkLayout> = {
  prepare: (graphs) => layoutGraph(graphs),
  draw(el, graph, ctx) {
    if (!ctx.prepared) return;
    el.className = 'vicher-figure-canvas is-graph';
    drawGraph(el, graph, ctx.prepared, (id) => ctx.tagOf(id), ctx.markdown);
  },
};
