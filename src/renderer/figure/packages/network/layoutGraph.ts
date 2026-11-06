import type { FigureNode, GraphEdge, GraphNode } from '@/renderer/figure/FigureData';
import { layoutNetwork, type NetworkLayout } from '@/renderer/figure/packages/network/layoutNetwork';

type Graph = Extract<FigureNode, { type: 'Graph' }>;

const nodeText = (node: GraphNode): string => [node.label ?? node.id, node.sub ?? ''].filter(Boolean).join('\n');

/** Each edge's key across steps: its id, or its ends and how many edges with the same ends come before it. */
export function edgeKeys(edges: readonly GraphEdge[]): string[] {
  const seen = new Map<string, number>();
  return edges.map((edge) => {
    if (edge.id) return edge.id;
    const ends = `${edge.from}>${edge.to}`;
    const count = seen.get(ends) ?? 0;
    seen.set(ends, count + 1);
    return `${ends}#${count}`;
  });
}

/** One layout for a Graph over every step it is in: the union of its nodes and edges, first seen first, so nothing moves. */
export function layoutGraph(uses: readonly Graph[]): NetworkLayout {
  const nodes = new Set<string>();
  const edges = new Map<string, { id: string; from: string; to: string }>();
  const nodeLabels: string[] = [];
  const edgeLabels: string[] = [];
  for (const graph of uses) {
    for (const node of graph.nodes) {
      nodes.add(node.id);
      nodeLabels.push(nodeText(node));
    }
    edgeKeys(graph.edges).forEach((key, i) => {
      const edge = graph.edges[i];
      if (!edges.has(key)) edges.set(key, { id: key, from: edge.from, to: edge.to });
      if (edge.label !== undefined) edgeLabels.push(edge.label);
    });
  }
  return layoutNetwork({ nodes: [...nodes].map((id) => ({ id })), edges: [...edges.values()], nodeLabels, edgeLabels });
}
