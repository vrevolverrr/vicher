import { component, field, keyedMarks } from '@/renderer/figure/components/component';
import { LIMITS } from '@/renderer/figure/FigureData';

export const Graph = component({
  name: 'Graph',
  summary: 'nodes and links placed by the host: a single rooted tree as a tree, and edges that are all `directed` with no cycle (a precedence network, a dependency graph) in rows from top to bottom.',
  guidance: [
    'Keep the same node ids in every step; change labels, groups and states. A binary tree node with one child gets a dimmed `nil` node for the other, so left and right stay apart.',
    'Put a small Graph and its Table side by side in a `Row`; beside a Graph of more than about six nodes, give per-node values as a wide Table, one column per node and one row per quantity, under it in a `Column`.',
  ],
  markedItems: ['nodes', 'edges'],
  fields: {
    id: field.optional(field.id()),
    nodes: field.list(field.object({ id: field.id(), label: field.optional(field.text()), sub: field.optional(field.text()) }), { min: 1, max: LIMITS.graphNodes }),
    edges: field.list(field.object({ id: field.optional(field.id()), from: field.ref(), to: field.ref(), label: field.optional(field.text()), directed: field.optional(field.boolean()) }), { max: LIMITS.graphEdges }),
    ...keyedMarks,
  },
  check(graph, { fail }) {
    const known = new Set(graph.nodes.map((node) => node.id));
    graph.edges.forEach((edge, e) => {
      for (const end of [edge.from, edge.to]) if (!known.has(end)) fail(`edges[${e}] joins ${JSON.stringify(end)}, which is no node of this Graph`);
    });
  },
});
