import { layoutNetwork } from '@/renderer/figure/packages/network/layoutNetwork';

type Box = { x: number; y: number; width: number; height: number };
const overlap = (a: Box, b: Box): boolean => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
/** A label's text with its own 4 px of background: its box less the padding the layout sizes it with. */
const ink = (box: Box): Box => ({ x: box.x + 8, y: box.y + 6, width: box.width - 16, height: box.height - 12 });
const centre = (box: Box): [number, number] => [box.x + box.width / 2, box.y + box.height / 2];
/** Points along a drawn path of `M`, `L` and `Q` commands. */
function trace(path: string): Box[] {
  const points: Box[] = [];
  let at = { x: 0, y: 0 };
  for (const [, command, args] of path.matchAll(/([MLQ])([^MLQ]*)/g)) {
    const [c, end = c] = [...args.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map(([, x, y]) => ({ x: Number(x), y: Number(y) }));
    for (let t = 0; command !== 'M' && t <= 1; t += 0.05) {
      const ctrl = command === 'Q' ? c : at;
      const p = (k: 'x' | 'y') => (1 - t) ** 2 * at[k] + 2 * t * (1 - t) * ctrl[k] + t ** 2 * end[k];
      points.push({ x: p('x'), y: p('y'), width: 0, height: 0 });
    }
    at = end;
  }
  return points;
}

describe('layoutNetwork', () => {
  it('keeps edge labels off each other and off the nodes in a chain with every transition and self-loop', () => {
    const ids = ['sunny', 'cloudy', 'rainy'];
    const edges = ids.flatMap((from) => ids.map((to) => ({ id: `${from}-${to}`, from, to })));
    const layout = layoutNetwork({ nodes: ids.map((id) => ({ id })), edges, nodeLabels: ids, edgeLabels: ['0.6', '0.3', '0.1', '0.4', '0.2'] });
    const labels = layout.edges.map((edge) => ink(edge.label));
    labels.forEach((label, i) => {
      labels.slice(i + 1).forEach((other) => expect(overlap(label, other)).toBe(false));
      for (const node of layout.nodes.values()) expect(overlap(label, node)).toBe(false);
    });
  });

  describe('a precedence network', () => {
    const ids = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const pairs = ['AB', 'AC', 'BD', 'CE', 'DF', 'EF', 'FG', 'GH'];
    const network = (directed: boolean, extra: string[] = []) => layoutNetwork({ nodes: ids.map((id) => ({ id })), edges: [...pairs, ...extra].map((id) => ({ id, from: id[0], to: id[1], directed })), nodeLabels: ids, edgeLabels: [] });
    const downward = (layout: ReturnType<typeof network>): boolean => layout.edges.every(({ id }) => layout.nodes.get(id[0])!.y < layout.nodes.get(id[1])!.y);

    it('puts every node of directed edges with no cycle below the nodes that point at it, and no two on each other', () => {
      const layout = network(true);
      expect(downward(layout)).toBe(true);
      const boxes = [...layout.nodes.values()];
      boxes.forEach((box, i) => boxes.slice(i + 1).forEach((other) => expect(overlap(box, other)).toBe(false)));
      expect(layout.nodes.get('B')!.y).toBe(layout.nodes.get('C')!.y);
    });

    it('draws no edge through a node it does not join, and keeps each label on its edge', () => {
      // Wide nodes with unlabelled edges, which skip rows or leave far to one side, then short nodes with a turning route.
      const wide = 'Customer relationship management system';
      for (const [pairs, nodeLabel, edgeLabels] of [
        [['02', '03', '04', '05', '12', '14', '25', '34', '35', '45'], wide, []],
        [['02', '04', '05', '14', '15', '24', '35'], wide, []],
        [['01', '02', '03', '04', '14', '24', '34'], 'Node', ['edge']],
      ] as const) {
        const layout = layoutNetwork({
          nodes: [0, 1, 2, 3, 4, 5].map((n) => ({ id: String(n) })),
          edges: pairs.map((id) => ({ id, from: id[0], to: id[1], directed: true })),
          nodeLabels: [nodeLabel],
          edgeLabels,
        });
        for (const edge of layout.edges) {
          const curve = trace(edge.path);
          for (const [id, node] of layout.nodes) if (!edge.id.includes(id)) for (const point of curve) expect(overlap(point, node), `${edge.id} crosses ${id}`).toBe(false);
          expect(curve.some((point) => overlap(point, edge.label)), `${edge.id} label`).toBe(true);
        }
        const labels = layout.edges.map((edge) => ink(edge.label));
        labels.forEach((label, i) => labels.slice(i + 1).forEach((other) => expect(overlap(label, other)).toBe(false)));
      }
    });

    it('keeps the free layout for undirected edges and for a cycle', () => {
      expect(downward(network(false))).toBe(false);
      expect(downward(network(true, ['HA']))).toBe(false);
    });
  });

  it('draws a self-loop on the side away from the node\'s neighbour', () => {
    const layout = layoutNetwork({
      nodes: [{ id: 'a' }, { id: 'b' }],
      edges: [{ id: 'ab', from: 'a', to: 'b' }, { id: 'loop', from: 'b', to: 'b' }],
      nodeLabels: ['a', 'b'],
      edgeLabels: ['x'],
    });
    const [ax, ay] = centre(layout.nodes.get('a')!);
    const [bx, by] = centre(layout.nodes.get('b')!);
    const [lx, ly] = centre(layout.edges.find((edge) => edge.id === 'loop')!.label);
    expect((ax - bx) * (lx - bx) + (ay - by) * (ly - by)).toBeLessThan(0);
  });
});
