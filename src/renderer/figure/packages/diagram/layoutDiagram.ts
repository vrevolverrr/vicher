import { angleMark, dimensionMark, rightAngleMark, tickMarks } from '@/renderer/figure/packages/diagram/marks';
import { bounds, type Extent, pointsOf, type Room, widen } from '@/renderer/figure/packages/diagram/diagramExtent';
import type { DiagramLayer, FigureNode, Point } from '@/renderer/figure/FigureData';
import { type LabelBox, placeLabels } from '@/renderer/figure/placeLabels';

type Diagram = Extract<FigureNode, { type: 'Diagram' }>;

const PAD = 10;
const MAX_HEIGHT = 260;
const CHAR_WIDTH = 7.5;
/** More than the 2 px margin `placeLabels` counts a line crossing within. */
const LABEL_GAP = 3;

type Marked = { group?: string | undefined; state?: string | undefined };

/** One SVG shape in pixels; `arrow` puts an arrowhead at its end. */
export type DiagramMark =
  | { shape: 'path'; d: string; className?: string; arrow?: boolean } & Marked
  | { shape: 'circle'; cx: number; cy: number; r: number; className?: string } & Marked;

export interface DiagramLayout {
  marks: DiagramMark[];
  /** Each placed label's layer and its top left in the frame. */
  labels: { layer: DiagramLayer; x: number; y: number }[];
  /** The drawing's box in pixels, past its border by the room it keeps. */
  frame: { x0: number; y0: number; x1: number; y1: number };
  /** The room past the border this step needs. */
  needed: Room;
}

export type LabelSize = { width: number; height: number };

/** A label's estimated size before it is rendered and measured. */
export const estimateLabel = (text: string): LabelSize => ({ width: text.length * CHAR_WIDTH + 8, height: 18 });

/** The text a layer writes as its label, if any. */
export const labelOf = (layer: DiagramLayer): string | undefined => (layer.type === 'Label' ? layer.text : 'label' in layer ? layer.label : undefined);

/**
 * Lays out a Diagram showing `extent` within `available` pixels of width, y upwards, scaled to fit, with each label at
 * `sizes`. It keeps at least the room `keep`, so every step of a figure can share the most any step needs.
 */
export function layoutDiagram(diagram: Diagram, extent: Extent, available: number, sizes: ReadonlyMap<DiagramLayer, LabelSize>, keep?: Room): DiagramLayout {
  const [x0, y0, x1, y1] = extent;
  available = Math.max(160, available) - 2 * PAD;
  const scale = Math.min(available / (x1 - x0), (MAX_HEIGHT - 2 * PAD) / (y1 - y0));
  const width = (x1 - x0) * scale + 2 * PAD;
  const height = (y1 - y0) * scale + 2 * PAD;
  const px = (p: Point): [number, number] => [PAD + (p[0] - x0) * scale, PAD + (y1 - p[1]) * scale];
  const units = (pixels: number): number => pixels / scale;

  const marks: DiagramMark[] = [];
  const lines: [number, number][][] = [];
  const labels: (LabelBox & { layer: DiagramLayer })[] = [];
  const path = (points: readonly Point[], close = false): string => `M${points.map((p) => px(p).map((v) => v.toFixed(1)).join(',')).join('L')}${close ? 'Z' : ''}`;
  const polyline = (points: readonly Point[], marked: Marked = {}, extra: { className?: string; arrow?: boolean } = {}, close = false): void => {
    if (points.length < 2) return;
    marks.push({ shape: 'path', d: path(points, close), ...extra, ...marked });
    lines.push((close ? [...points, points[0]] : points).map(px));
  };
  const label = (at: Point, layer: DiagramLayer, center = false): void => {
    const size = sizes.get(layer);
    if (!size) return;
    const [x, y] = px(at);
    labels.push({ x, y, width: size.width, height: size.height, layer, center });
  };

  const all = diagram.children.flatMap(pointsOf);
  const centre: Point = all.length ? [all.reduce((sum, p) => sum + p[0], 0) / all.length, all.reduce((sum, p) => sum + p[1], 0) / all.length] : [(x0 + x1) / 2, (y0 + y1) / 2];
  for (const layer of diagram.children) {
    const marked: Marked = { group: layer.group, state: layer.state };
    switch (layer.type) {
      case 'Shape': {
        polyline(layer.pts, marked, layer.closed ? { className: 'is-closed' } : {}, layer.closed);
        if (layer.pts.length) {
          const middle: Point = [layer.pts.reduce((s, p) => s + p[0], 0) / layer.pts.length, layer.pts.reduce((s, p) => s + p[1], 0) / layer.pts.length];
          label(layer.closed ? middle : layer.pts[layer.pts.length - 1], layer, layer.closed);
        }
        break;
      }
      case 'Circle': {
        const [cx, cy] = px(layer.at);
        marks.push({ shape: 'circle', cx, cy, r: layer.r * scale, ...marked });
        lines.push(Array.from({ length: 33 }, (_, i) => px([layer.at[0] + layer.r * Math.cos((i * Math.PI) / 16), layer.at[1] + layer.r * Math.sin((i * Math.PI) / 16)])));
        label([layer.at[0], layer.at[1] + layer.r], layer);
        break;
      }
      case 'Vector':
      case 'Segment':
        polyline([layer.from, layer.to], marked, layer.type === 'Vector' ? { arrow: true, className: 'is-vector' } : {});
        label([(layer.from[0] + layer.to[0]) / 2, (layer.from[1] + layer.to[1]) / 2], layer);
        break;
      case 'Points':
        for (const p of layer.pts) {
          const [cx, cy] = px(p);
          marks.push({ shape: 'circle', cx, cy, r: 3.5, className: 'is-point', ...marked });
          if (layer.state === 'active') marks.push({ shape: 'circle', cx, cy, r: 7.5, className: 'is-ring' });
        }
        if (layer.pts.length) label(layer.pts[0], layer);
        break;
      case 'Label':
        label(layer.at, layer, true);
        break;
      case 'Angle': {
        const size = sizes.get(layer);
        const arc = angleMark(layer.at, layer.from, layer.to, units(22), size ? [units(size.width / 2), units(size.height / 2)] : undefined, units(LABEL_GAP));
        const points = Array.from({ length: 25 }, (_, i): Point => {
          const t = ((arc.start + ((arc.end - arc.start) * i) / 24) * Math.PI) / 180;
          return [layer.at[0] + arc.radius * Math.cos(t), layer.at[1] + arc.radius * Math.sin(t)];
        });
        polyline(points, marked);
        label(arc.label, layer, true);
        break;
      }
      case 'RightAngle':
        polyline(rightAngleMark(layer.at, layer.from, layer.to, units(10)), marked);
        break;
      case 'Tick':
        for (const tick of tickMarks(layer.on[0], layer.on[1], layer.n ?? 1, units(10), units(4))) polyline(tick, marked);
        break;
      case 'Dimension': {
        // Offset away from the rest of the drawing, so the measure never lies across it.
        const [dx, dy] = [layer.to[0] - layer.from[0], layer.to[1] - layer.from[1]];
        const side = -dy * (centre[0] - (layer.from[0] + layer.to[0]) / 2) + dx * (centre[1] - (layer.from[1] + layer.to[1]) / 2) > 0 ? -1 : 1;
        const dimension = dimensionMark(layer.from, layer.to, side * units(16));
        polyline(dimension.line, marked, { className: 'is-dimension' });
        for (const bar of dimension.bars) polyline(bar, marked, { className: 'is-dimension' });
        label(dimension.label, layer, true);
        break;
      }
    }
  }

  // A mark drawn at a pixel offset from its points (a Dimension's line and bars) can reach past the border; the drawing grows to hold it.
  const [lx0, ly0, lx1, ly1] = bounds(lines.flat());
  const left = Math.max(0, PAD - Math.min(PAD, lx0));
  const top = Math.max(0, PAD - Math.min(PAD, ly0));
  const right = Math.max(0, Math.max(width - PAD, lx1) - width + PAD);
  const bottom = Math.max(0, Math.max(height - PAD, ly1) - height + PAD);
  const outer = { x0: -left, y0: -top, x1: width + right, y1: height + bottom };
  // A label pushed past the top or bottom (one on a line along the edge) grows the drawing instead of covering the line.
  const spare = Math.max(0, ...labels.map((item) => item.height)) + LABEL_GAP * 2;
  const placed = placeLabels(labels, { ...outer, y0: outer.y0 - spare, y1: outer.y1 + spare }, lines);
  const needed: Room = {
    left: Math.max(left, -Math.min(0, ...placed.map((at) => at.x))),
    right: Math.max(right, Math.max(width, ...placed.map((at, i) => at.x + labels[i].width)) - width),
    top: Math.max(top, -Math.min(0, ...placed.map((at) => at.y))),
    bottom: Math.max(bottom, Math.max(height, ...placed.map((at, i) => at.y + labels[i].height)) - height),
  };
  const room = widen(needed, keep);
  const frame = { x0: -room.left, y0: -room.top, x1: width + room.right, y1: height + room.bottom };
  return { marks, labels: placed.map((at, i) => ({ layer: labels[i].layer, x: at.x - frame.x0, y: at.y - frame.y0 })), frame, needed };
}
