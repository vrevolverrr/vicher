export type Point = [number, number | null];

/** `color` and `state`, a figure's marks, ink a layer with their theme colour. */
export type Layer = (
  | { kind: 'line'; points: Point[]; label?: string; series?: number; neutral?: boolean }
  /** `lower`, when set, replaces the flat `base` as the edge shaded against; `from` and `to` limit the shading to an x range. */
  | { kind: 'area'; points: Point[]; base: number; lower?: Point[]; from?: number; to?: number; label?: string; series?: number }
  | { kind: 'bars'; values: (number | null)[]; mode: 'bars' | 'waterfall'; label?: string; series?: number }
  | { kind: 'dot'; x: number; y: number; label?: string; series?: number }
  | { kind: 'rule'; at: number; axis: 'x' | 'y'; label?: string; series?: number }
  | { kind: 'note'; x: number; y: number; text: string; series?: number }
  /** A line with an arrowhead at `to` and no point marks. */
  | { kind: 'arrow'; from: [number, number]; to: [number, number]; label?: string; series?: number }
) & { color?: string; state?: string };

export interface PlotModel {
  /** A range, or the names of the categories a `Bars` layer stands on. */
  x: [number, number] | string[];
  y?: [number, number];
  xLabel?: string;
  yLabel?: string;
  /** One unit is as long on both axes, so a circle stays round. */
  equal?: boolean;
  layers: Layer[];
}

/**
 * A sampled curve that leaves the box through one edge and comes back through the other with a change of sign, as
 * `tan` and `1/x` do at an asymptote, gets a break there instead of a vertical line. A jump that stays in the box is kept.
 */
export function breakJumps(points: readonly Point[], [y0, y1]: readonly [number, number]): Point[] {
  const out: Point[] = [];
  points.forEach((point, i) => {
    const before = points[i - 1];
    const a = before?.[1];
    const b = point[1];
    if (a !== undefined && a !== null && b !== null) {
      const outside = a > y1 || a < y0 || b > y1 || b < y0;
      if (outside && Math.sign(a) !== Math.sign(b) && Math.abs(b - a) > y1 - y0) out.push([(before[0] + point[0]) / 2, null]);
    }
    out.push(point);
  });
  return out;
}
