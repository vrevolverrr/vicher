import type { Point as DataPoint, FigureNode, Plot3Layer, PlotLayer, Point3 } from '@/renderer/figure/FigureData';
import { formatFigure } from '@/renderer/figure/formatFigure';
import { breakJumps, type Layer, type PlotModel, type Point } from '@/renderer/figure/plot/PlotModel';
import { fitRange } from '@/renderer/figure/plot/range';
import type { Layer3, Plot3Model, Range } from '@/renderer/figure/plot3/Plot3Model';

// The boundary between a validated figure and the plot packages: axes the program left out are fitted, and text is formatted.


type Plot = Extract<FigureNode, { type: 'Plot' }>;

const CIRCLE_POINTS = 96;

/** The `PlotChart` model of a figure's Plot, with x fitted to the layers when the Plot gives none. */
export function plotModel(plot: Plot): PlotModel {
  const x = plot.x ?? fitRange(plot.children.flatMap((layer) => coordinates(layer, 0)));
  const fns = new Map(plot.children.flatMap((layer) => (layer.type === 'Fn' && layer.id ? [[layer.id, layer] as const] : [])));
  const box = plot.y ?? finiteRange(plot.children.flatMap((layer) => (layer.type === 'Fn' ? layer.pts.map((p) => p[1]) : [])));
  const curve = (id: string): Point[] => breakJumps(fns.get(id)!.pts.map(([x, y]): Point => [x, y]), box);
  const layers = plot.children.flatMap((layer): Layer[] => {
    const marks = { ...(layer.tag ? { tag: layer.tag } : {}) };
    const label = 'label' in layer && layer.label !== undefined ? formatFigure(layer.label) : undefined;
    switch (layer.type) {
      case 'Fn':
        return [{ kind: 'line', points: breakJumps(layer.pts.map(([x, y]): Point => [x, y]), box), label, ...marks }];
      case 'Region': {
        const from = layer.from ?? x[0];
        const to = layer.to ?? x[1];
        const top = typeof layer.top === 'string' ? curve(layer.top) : ([[from, layer.top], [to, layer.top]] as Point[]);
        const lower = typeof layer.base === 'string' ? curve(layer.base) : undefined;
        return [{ kind: 'area', points: top, base: typeof layer.base === 'number' ? layer.base : 0, ...(lower ? { lower } : {}), from, to, label, ...marks }];
      }
      case 'Shape': {
        const pts = layer.pts.map(([x, y]): Point => [x, y]);
        return pts.length < 2 ? [] : [{ kind: 'line', points: layer.closed ? [...pts, pts[0]] : pts, label, ...marks }];
      }
      case 'Circle':
        return [{ kind: 'line', points: circle(layer.at, layer.r), label, ...marks }];
      case 'Vector':
        return [{ kind: 'arrow', from: [...layer.from], to: [...layer.to], label, ...marks }];
      case 'Segment':
        return [{ kind: 'line', points: [[...layer.from], [...layer.to]], label, ...marks }];
      case 'Points':
        return layer.pts.map(([x, y], i): Layer => ({ kind: 'dot', x, y, label: i === 0 ? label : undefined, ...marks }));
      case 'Label':
        return [{ kind: 'note', x: layer.at[0], y: layer.at[1], text: formatFigure(layer.text), ...marks }];
    }
    return [];
  });
  // Two given ranges of the same length are read as one unit on both axes, as a unit circle or a complex plane has.
  const span = (range: readonly [number, number]): number => range[1] - range[0];
  const equal = plot.equal ?? (plot.y !== undefined && Math.abs(span(x) - span(plot.y)) <= 1e-9 * Math.abs(span(x)));
  return { x: [x[0], x[1]], ...(plot.y ? { y: [plot.y[0], plot.y[1]] } : {}), xLabel: plot.xLabel, yLabel: plot.yLabel, ...(equal ? { equal } : {}), layers };
}

function circle(at: readonly [number, number], r: number): Point[] {
  return Array.from({ length: CIRCLE_POINTS + 1 }, (_, i) => {
    const t = (2 * Math.PI * i) / CIRCLE_POINTS;
    return [at[0] + r * Math.cos(t), at[1] + r * Math.sin(t)];
  });
}

function finiteRange(values: readonly (number | null)[]): readonly [number, number] {
  const finite = values.filter((v): v is number => v !== null && Number.isFinite(v));
  return finite.length ? [Math.min(...finite), Math.max(...finite)] : [0, 1];
}

type Plot3 = Extract<FigureNode, { type: 'Plot3' }>;

const models3 = new WeakMap<Plot3, Plot3Model>();

/**
 * The `scene3` model of a figure's 3D Plot: every axis it does not give is fitted to the layers and the bulk of the surface
 * samples, and a graph's x and y become the Plot's, narrowed by its `from` and `to`. Kept per node, so a redraw reuses the
 * mesh `scene3` caches per model.
 */
export function plot3Model(plot: Plot3): Plot3Model {
  const kept = models3.get(plot);
  if (kept) return kept;
  const surfaces = plot.children.filter((layer) => layer.type === 'Fn');
  const axis = (given: Range | undefined, k: number): Range =>
    given ?? fitRange(plot.children.filter((layer) => layer.type !== 'Fn').flatMap((layer) => coordinates(layer, k)), surfaces.flatMap((layer) => coordinates(layer, k)));
  const [x, y, z] = [axis(plot.x, 0), axis(plot.y, 1), axis(plot.z, 2)];
  const span = (range: Range): number => range[1] - range[0];
  const same = [y, z].every((range) => Math.abs(span(range) - span(x)) <= 1e-9 * span(x));
  const spans = [x, y, z].map(span);
  // A Plot that gives no axis draws a solid in its own units, so a torus is not stretched to a cube. Spans more than 10×
  // apart are data in different units, which one scale would squash to a sliver.
  const solid = plot.x === undefined && plot.y === undefined && plot.z === undefined && Math.max(...spans) <= 10 * Math.min(...spans);
  const children = plot.children.map((layer): Layer3 => {
    if (layer.type === 'Label') return { type: 'Label', at: layer.at, text: formatFigure(layer.text), ...(layer.tag ? { tag: layer.tag } : {}) };
    const marks = { ...(layer.id ? { id: layer.id } : {}), ...(layer.tag ? { tag: layer.tag } : {}), ...(layer.label === undefined ? {} : { label: formatFigure(layer.label) }) };
    switch (layer.type) {
      case 'Fn':
        return 'zs' in layer ? { type: 'Fn', zs: layer.zs, x: [layer.from ?? x[0], layer.to ?? x[1]], y, ...marks } : { type: 'Fn', pts: layer.pts, ...marks };
      case 'Shape':
        return { type: 'Shape', pts: layer.pts, ...(layer.closed ? { closed: true } : {}), ...marks };
      case 'Circle':
        return { type: 'Circle', at: layer.at, r: layer.r, ...marks };
      case 'Vector':
      case 'Segment':
        return { type: layer.type, from: layer.from, to: layer.to, ...marks };
      case 'Points':
        return { type: 'Points', pts: layer.pts, ...marks };
    }
  });
  const model: Plot3Model = { x, y, z, equal: plot.equal ?? (same || solid), view: plot.view, xLabel: plot.xLabel, yLabel: plot.yLabel, zLabel: plot.zLabel, children };
  models3.set(plot, model);
  return model;
}

/** The values a layer reaches along axis `k` (0 is x), for fitting an axis to it. */
function coordinates(layer: PlotLayer | Plot3Layer, k: number): number[] {
  const at = (p: DataPoint | Point3): number => p[k];
  switch (layer.type) {
    case 'Shape':
    case 'Points':
      return (layer.pts as readonly (DataPoint | Point3)[]).map(at);
    case 'Vector':
    case 'Segment':
      return [at(layer.from), at(layer.to)];
    case 'Label':
      return [at(layer.at)];
    case 'Circle':
      return k < 2 ? [at(layer.at) - layer.r, at(layer.at) + layer.r] : [at(layer.at)];
    case 'Region':
      return k === 0 ? [layer.from, layer.to].filter((v): v is number => v !== undefined) : [];
    case 'Fn':
      if ('zs' in layer) return k === 2 ? layer.zs.filter((z): z is number => z !== null) : [];
      if (layer.pts.some((p) => p !== null && p.length === 3)) return (layer.pts as readonly (Point3 | null)[]).flatMap((p) => (p ? [p[k]] : []));
      return [];
  }
}
