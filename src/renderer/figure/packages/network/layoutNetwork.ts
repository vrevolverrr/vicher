import type { Point, Size } from '@/renderer/figure/geometry';
import { fittedSize } from '@/renderer/figure/geometry';

interface NodeGeometry extends Point, Size {}
interface EdgeGeometry {
  readonly id: string;
  readonly path: string;
  readonly label: Point & Size;
}
/** Room around the drawing for a thick active border. */
const MARGIN = 4;
/** Where along its edge a label may sit, as Bezier parameters, in the order tried. */
const LABEL_SPOTS = [0.5, 0.35, 0.65, 0.2, 0.8];
/** The padding `fittedSize` adds around a label's text on each side, less the 4 px the text's own background keeps. */
const LABEL_AIR = { x: 8, y: 6 };
/** The radius of a turn in a routed edge, small so the curve stays on its route. */
const TURN = 8;

export interface NetworkLayout extends Size {
  readonly kind: 'tree' | 'graph';
  readonly nodes: ReadonlyMap<string, NodeGeometry>;
  readonly edges: readonly EdgeGeometry[];
}

export interface NetworkInput {
  readonly nodes: readonly { readonly id: string }[];
  readonly edges: readonly { readonly id: string; readonly from: string; readonly to: string; readonly directed?: boolean }[];
  /** Every node label and every edge label shown in any step, which size the boxes. */
  readonly nodeLabels: readonly string[];
  readonly edgeLabels: readonly string[];
}

export function layoutNetwork({ nodes, edges, nodeLabels, edgeLabels }: NetworkInput): NetworkLayout {
  const nodeSize = fittedSize(nodeLabels, 40, 192);
  const edgeSize = fittedSize(edgeLabels, 20, 160);
  const children = new Map(nodes.map(n => [n.id, [] as string[]]));
  const parents = new Map<string, number>();
  const pairs = new Map<string, typeof edges[number][]>();
  const nodeIndex = new Map(nodes.map((n, i) => [n.id, i]));
  for (const edge of edges) {
    children.get(edge.from)!.push(edge.to);
    parents.set(edge.to, (parents.get(edge.to) ?? 0) + 1);
    const a = nodeIndex.get(edge.from)!;
    const b = nodeIndex.get(edge.to)!;
    const key = `${Math.min(a, b)}:${Math.max(a, b)}`;
    pairs.set(key, [...(pairs.get(key) ?? []), edge]);
  }
  const roots = nodes.filter(n => !parents.has(n.id));
  const seen = new Set<string>();
  const visit = (id: string): boolean => {
    if (seen.has(id)) return false;
    seen.add(id);
    return children.get(id)!.every(visit);
  };
  const tree = nodes.length > 0 && roots.length === 1 && edges.length === nodes.length - 1 && nodes.every(n => (parents.get(n.id) ?? 0) <= 1) && [...pairs.values()].every(p => p.length === 1) && visit(roots[0].id) && seen.size === nodes.length;
  const links = edges.map(e => [nodeIndex.get(e.from)!, nodeIndex.get(e.to)!] as const);
  // Directed edges with no cycle give each node a row, so a precedence network reads top to bottom as a tree does.
  const rows = !tree && edges.length > 0 && edges.every(e => e.directed) ? ranks(nodes.length, links) : null;
  const grid = tree || rows !== null;
  let points: Point[];
  let ways: ReadonlyMap<number, readonly Point[]> = new Map();
  if (tree) {
    const positions = new Map<string, Point>();
    let leaf = 0;
    const place = (id: string, depth: number): number => {
      const xs = children.get(id)!.map(child => place(child, depth + 1));
      const x = xs.length ? (xs[0] + xs[xs.length - 1]) / 2 : leaf++;
      positions.set(id, { x, y: depth });
      return x;
    };
    place(roots[0].id, 0);
    points = nodes.map(n => positions.get(n.id)!);
  } else if (rows) ({ points, ways } = layered(rows, links));
  else points = force(nodes.length, links);

  // Room between neighbours for each lane's edge label and a little air, so a small graph fits beside its table.
  const lanes = Math.max(1, ...[...pairs.values()].map(group => (group[0].from === group[0].to ? 1 : group.length)));
  const spacingX = nodeSize.width + edgeSize.width * lanes + 12;
  const spacingY = nodeSize.height + edgeSize.height * lanes + 12;
  // A graph scales uniformly until every pair is a full gap apart on at least one axis.
  let scale = 0;
  if (!grid) for (let a = 0; a < points.length; a++) for (let b = a + 1; b < points.length; b++) scale = Math.max(scale, Math.min(spacingX / Math.max(0.001, Math.abs(points[a].x - points[b].x)), spacingY / Math.max(0.001, Math.abs(points[a].y - points[b].y))));
  const geometry = new Map(nodes.map((n, i) => [n.id, { x: points[i].x * (grid ? spacingX : scale), y: points[i].y * (grid ? spacingY : scale), ...nodeSize }]));
  // Keep Bezier control points and label boxes inside the reserved surface as well.
  const bounds: Point[] = [...geometry.values()].flatMap(p => [{ x: p.x - p.width / 2, y: p.y - p.height / 2 }, { x: p.x + p.width / 2, y: p.y + p.height / 2 }]);
  const routes: { id: string; points: Point[]; shape: 'loop' | 'curve' | 'route' }[] = [];
  const edgeIndex = new Map(edges.map((e, i) => [e, i]));
  for (const group of pairs.values()) group.forEach((edge, index) => {
    const a = geometry.get(edge.from)!;
    const b = geometry.get(edge.to)!;
    const loop = edge.from === edge.to;
    // In rows, an edge leaves the bottom of its node and enters the top of the next, and runs upright through each row it
    // crosses, so no part of it lies in a row beside a node.
    const way = ways.get(edgeIndex.get(edge)!)?.flatMap(w => [{ x: w.x * spacingX, y: w.y * spacingY - nodeSize.height / 2 }, { x: w.x * spacingX, y: w.y * spacingY + nodeSize.height / 2 }]);
    const out = { x: a.x, y: a.y + a.height / 2 };
    const into = { x: b.x, y: b.y - b.height / 2 };
    let path: Point[];
    if (way) path = [out, ...way, into];
    else if (loop) {
      const neighbours = edges.flatMap(e => (e.from === e.to ? [] : e.from === edge.from ? [geometry.get(e.to)!] : e.to === edge.from ? [geometry.get(e.from)!] : []));
      path = selfLoop(a, loopSide(a, neighbours), 64 + index * (edgeSize.height + 32));
    } else {
      // One canonical normal for both directions keeps opposite lanes distinct.
      const sign = nodeIndex.get(edge.from)! < nodeIndex.get(edge.to)! ? 1 : -1;
      const dx = (b.x - a.x) * sign;
      const dy = (b.y - a.y) * sign;
      const distance = Math.hypot(dx, dy) || 1;
      const offset = (index - (group.length - 1) / 2) * (edgeSize.height + 36);
      const control = { x: (a.x + b.x) / 2 - dy / distance * offset * 2, y: (a.y + b.y) / 2 + dx / distance * offset * 2 };
      path = rows ? [out, control, into] : [boundary(a, control), control, boundary(b, control)];
    }
    bounds.push(...path);
    routes.push({ id: edge.id, points: path, shape: way ? 'route' : loop ? 'loop' : 'curve' });
  });
  // Each label takes the first spot along its own edge clear of the nodes and the labels placed before it, so edges that
  // cross or share a node do not stack their labels.
  const taken: (Point & Size)[] = [...geometry.values()].map(n => ({ x: n.x - n.width / 2, y: n.y - n.height / 2, width: n.width, height: n.height }));
  const labels = routes.map(route => {
    const spots = LABEL_SPOTS.map(t => {
      const c = route.shape === 'route' ? along(route.points, t) : pointAt(route.points, t);
      return { x: c.x - edgeSize.width / 2, y: c.y - edgeSize.height / 2, ...edgeSize };
    });
    const index = spots.map(ink).findIndex(spot => !taken.some(other => overlaps(spot, other)));
    const label = spots[Math.max(0, index)];
    taken.push(ink(label));
    bounds.push({ x: label.x, y: label.y }, { x: label.x + label.width, y: label.y + label.height });
    return label;
  });
  const minX = Math.min(0, ...bounds.map(p => p.x)) - MARGIN;
  const minY = Math.min(0, ...bounds.map(p => p.y)) - MARGIN;
  const maxX = Math.max(0, ...bounds.map(p => p.x)) + MARGIN;
  const maxY = Math.max(0, ...bounds.map(p => p.y)) + MARGIN;
  const shifted = (p: Point) => ({ x: p.x - minX, y: p.y - minY });
  return {
    kind: tree ? 'tree' : 'graph', width: maxX - minX, height: maxY - minY,
    nodes: new Map([...geometry].map(([id, p]) => [id, { ...p, x: p.x - minX - p.width / 2, y: p.y - minY - p.height / 2 }])),
    edges: routes.map((route, i) => {
      const p = route.points.map(shifted);
      const path = route.shape === 'route' ? rounded(p) : `M${p[0].x},${p[0].y} ${route.shape === 'loop' ? 'C' : 'Q'}${p.slice(1).map(v => `${v.x},${v.y}`).join(' ')}`;
      return { id: route.id, path, label: { ...labels[i], ...shifted(labels[i]) } };
    }),
  };
}

/** The point at `t` on the Bezier curve with control points `p`, by de Casteljau's construction. */
function pointAt(p: readonly Point[], t: number): Point {
  let q = p;
  while (q.length > 1) q = q.slice(1).map((v, i) => ({ x: q[i].x + (v.x - q[i].x) * t, y: q[i].y + (v.y - q[i].y) * t }));
  return q[0];
}

/** A path through every point of a route, straight between them and rounded at each turn by up to `TURN`. */
function rounded(p: readonly Point[]): string {
  const toward = (from: Point, to: Point): Point => {
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    const share = Math.min(TURN, length / 2) / (length || 1);
    return { x: from.x + (to.x - from.x) * share, y: from.y + (to.y - from.y) * share };
  };
  const turns = p.slice(1, -1).map((corner, i) => {
    const [enter, leave] = [toward(corner, p[i]), toward(corner, p[i + 2])];
    return `L${enter.x},${enter.y} Q${corner.x},${corner.y} ${leave.x},${leave.y}`;
  });
  return `M${p[0].x},${p[0].y} ${turns.join(' ')} L${p[p.length - 1].x},${p[p.length - 1].y}`;
}

/** The point a share `t` of the way along a route, by length. */
function along(p: readonly Point[], t: number): Point {
  const lengths = p.slice(1).map((point, i) => Math.hypot(point.x - p[i].x, point.y - p[i].y));
  let left = t * lengths.reduce((sum, length) => sum + length, 0);
  const i = lengths.findIndex(length => (left <= length ? true : ((left -= length), false)));
  const share = left / lengths[i];
  return { x: p[i].x + (p[i + 1].x - p[i].x) * share, y: p[i].y + (p[i + 1].y - p[i].y) * share };
}

/** A label's box without the air around its text (`fittedSize`), which a neighbour may cover. */
const ink = (box: Point & Size): Point & Size => ({ x: box.x + LABEL_AIR.x, y: box.y + LABEL_AIR.y, width: box.width - 2 * LABEL_AIR.x, height: box.height - 2 * LABEL_AIR.y });

const overlaps = (a: Point & Size, b: Point & Size): boolean => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/**
 * -1 (up), or 1 (down) when a node's neighbours lie above it on balance: a self-loop leaves on the side facing away from
 * its edges, and never sideways, since a node is wider than it is tall.
 */
function loopSide(box: NodeGeometry, neighbours: readonly Point[]): 1 | -1 {
  const pull = neighbours.reduce((sum, n) => sum + (n.y - box.y) / (Math.hypot(n.x - box.x, n.y - box.y) || 1), 0);
  return pull < 0 ? 1 : -1;
}

/** A self-loop as a cubic Bezier leaving `box` above it (`side` -1) or below it (1) and reaching `reach` past it. */
function selfLoop(box: NodeGeometry, side: 1 | -1, reach: number): Point[] {
  const top = box.y + side * box.height / 2;
  const far = box.y + side * (box.height / 2 + reach) * 1.6;
  return [{ x: box.x - box.width / 3, y: top }, { x: box.x - box.width, y: far }, { x: box.x + box.width, y: far }, { x: box.x + box.width / 3, y: top }];
}

function boundary(box: NodeGeometry, toward: Point): Point {
  const dx = toward.x - box.x;
  const dy = toward.y - box.y;
  const scale = 1 / Math.max(Math.abs(dx) / (box.width / 2), Math.abs(dy) / (box.height / 2), 0.001);
  return { x: box.x + dx * scale, y: box.y + dy * scale };
}

/** Each node's row when every edge points down: one below its lowest predecessor. `null` when the edges form a cycle. */
function ranks(count: number, edges: readonly (readonly number[])[]): number[] | null {
  const rank = new Array<number>(count).fill(0);
  const waiting = new Array<number>(count).fill(0);
  for (const [, to] of edges) waiting[to]++;
  const ready = rank.flatMap((_, i) => (waiting[i] ? [] : [i]));
  let placed = 0;
  for (let i = ready.shift(); i !== undefined; i = ready.shift()) {
    placed++;
    for (const [from, to] of edges) if (from === i) {
      rank[to] = Math.max(rank[to], rank[i] + 1);
      if (--waiting[to] === 0) ready.push(to);
    }
  }
  return placed === count ? rank : null;
}

/**
 * Rows of members, each row centred. An edge that skips rows takes a place in every row it crosses, which keeps it clear
 * of the nodes there: those places are its way. Each row is then ordered by where its neighbours in the row before sit,
 * going down, up and down again, so few edges cross and their labels find room.
 */
function layered(rows: readonly number[], edges: readonly (readonly number[])[]): { points: Point[]; ways: Map<number, Point[]> } {
  // Members 0 to n - 1 are the nodes; the places follow.
  const row = [...rows];
  const places = new Map<number, number[]>();
  const links: (readonly [number, number])[] = [];
  edges.forEach(([from, to], e) => {
    let upper = from;
    for (let r = rows[from] + 1; r < rows[to]; r++) {
      const place = row.push(r) - 1;
      places.set(e, [...(places.get(e) ?? []), place]);
      links.push([upper, place]);
      upper = place;
    }
    links.push([upper, to]);
  });
  const xs = row.map(() => 0);
  const byRow = row.reduce<number[][]>((all, y, m) => ((all[y] ??= []).push(m), all), []);
  /** Each member's neighbours in the row above (0) and the row below (1). */
  const near = [row.map((): number[] => []), row.map((): number[] => [])];
  for (const [upper, lower] of links) {
    near[0][lower].push(upper);
    near[1][upper].push(lower);
  }
  /** Orders row `r` by its neighbours on the far `end` of its links (0 the row above, 1 the row below); a tie keeps the order it has. */
  const order = (r: number, end: 0 | 1): void => {
    const members = [...byRow[r]];
    const pull = new Map(members.map((m) => [m, near[end][m].length ? near[end][m].reduce((sum, n) => sum + xs[n], 0) / near[end][m].length : xs[m]]));
    members.sort((a, b) => pull.get(a)! - pull.get(b)! || xs[a] - xs[b]).forEach((m, k) => { xs[m] = k - (members.length - 1) / 2; });
  };
  const last = Math.max(...rows);
  for (let r = 0; r <= last; r++) order(r, 0);
  for (let r = last - 1; r >= 0; r--) order(r, 1);
  for (let r = 1; r <= last; r++) order(r, 0);
  return { points: rows.map((y, i) => ({ x: xs[i], y })), ways: new Map([...places].map(([e, way]) => [e, way.map((m) => ({ x: xs[m], y: row[m] }))])) };
}

/** Fixed iteration budget and declaration-order seeds; never rerun while stepping. */
function force(count: number, edges: readonly (readonly number[])[]): Point[] {
  if (!count) return [];
  const radius = Math.max(1, Math.sqrt(count));
  const p = Array.from({ length: count }, (_, i) => ({ x: Math.cos(i * 2.399963229728653) * Math.sqrt(i + 1), y: Math.sin(i * 2.399963229728653) * Math.sqrt(i + 1) }));
  for (let iteration = 0; iteration < 120; iteration++) {
    const delta = p.map(v => ({ x: -v.x * 0.04, y: -v.y * 0.04 }));
    for (let a = 0; a < count; a++) for (let b = a + 1; b < count; b++) {
      const dx = p[a].x - p[b].x;
      const dy = p[a].y - p[b].y;
      const d2 = Math.max(0.01, dx * dx + dy * dy);
      const f = 0.18 / d2;
      delta[a].x += dx * f; delta[a].y += dy * f;
      delta[b].x -= dx * f; delta[b].y -= dy * f;
    }
    for (const [a, b] of edges) if (a !== b) {
      const dx = (p[b].x - p[a].x) * 0.02;
      const dy = (p[b].y - p[a].y) * 0.02;
      delta[a].x += dx; delta[a].y += dy;
      delta[b].x -= dx; delta[b].y -= dy;
    }
    p.forEach((v, i) => {
      v.x = Math.max(-radius * 2, Math.min(radius * 2, v.x + Math.max(-0.2, Math.min(0.2, delta[i].x))));
      v.y = Math.max(-radius * 2, Math.min(radius * 2, v.y + Math.max(-0.2, Math.min(0.2, delta[i].y))));
    });
  }
  return p;
}
