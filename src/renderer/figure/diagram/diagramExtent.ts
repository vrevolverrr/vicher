import type { DiagramLayer, FigureNode, Point } from '@/renderer/figure/FigureData';

type Diagram = Extract<FigureNode, { type: 'Diagram' }>;

export function pointsOf(layer: DiagramLayer): readonly Point[] {
  switch (layer.type) {
    case 'Shape':
    case 'Points':
      return layer.pts;
    case 'Circle':
      return [[layer.at[0] - layer.r, layer.at[1] - layer.r], [layer.at[0] + layer.r, layer.at[1] + layer.r]];
    case 'Label':
      return [layer.at];
    case 'Tick':
      return layer.on;
    default:
      return 'at' in layer ? [layer.at, layer.from, layer.to] : [layer.from, layer.to];
  }
}

export type Extent = readonly [number, number, number, number];

/** [minX, minY, maxX, maxY] of `points`, by a loop: spreading a layer's thousands of points into Math.min overflows the stack. */
export function bounds(points: Iterable<readonly [number, number]>): Extent {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of points) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
}
/** Pixels a drawing reaches past its border on each side, for marks drawn off their points and labels pushed outside. */
export type Room = Readonly<{ left: number; top: number; right: number; bottom: number }>;

/** The larger of two rooms on each side. */
export const widen = (a: Room, b: Room = a): Room => ({
  left: Math.max(a.left, b.left),
  top: Math.max(a.top, b.top),
  right: Math.max(a.right, b.right),
  bottom: Math.max(a.bottom, b.bottom),
});

/**
 * What a Diagram shows, as [x0, y0, x1, y1]: what it drew, or the model's width and height when it drew nothing.
 * `keep` is an extent to keep, so a redraw stays anchored.
 */
export function diagramExtent(diagram: Diagram, keep?: Extent): Extent {
  const points = diagram.children.flatMap(pointsOf);
  const [x0, y0, x1, y1] = points.length ? bounds(points) : [0, 0, diagram.width, diagram.height];
  // A single point has no size to scale to, so it gets a unit around it.
  const pad = x1 > x0 || y1 > y0 ? 0 : 1;
  const own: Extent = [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
  return keep ? [Math.min(own[0], keep[0]), Math.min(own[1], keep[1]), Math.max(own[2], keep[2]), Math.max(own[3], keep[3])] : own;
}
