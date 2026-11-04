import { type Child, component, type Context, field } from '@/renderer/figure/components/component';
import { SHARED_LAYER_NAMES } from '@/renderer/figure/components/names';
import { LIMITS } from '@/renderer/figure/FigureData';
import { isObject, over, own } from '@/renderer/figure/plain';


/** How a message names a layer: `Fn` `bowl`, or a `Fn`. */
export const layerName = (type: string, id: unknown): string => (typeof id === 'string' ? `\`${type}\` \`${id}\`` : `a \`${type}\``);

/** Why a Plot is 3D, read from its raw layers before any is checked: an Fn of two variables, or a point with three coordinates. */
function threeD(children: readonly unknown[]): string | undefined {
  const triple = (value: unknown): boolean => Array.isArray(value) && value.length === 3;
  for (const child of children) {
    if (!isObject(child) || !isObject(own(child, 'props'))) continue;
    const type = own(child, 'type');
    const props = own(child, 'props') as Record<string, unknown>;
    const pts = own(props, 'pts');
    if (type === 'Fn') {
      if (own(props, 'zs') !== undefined || (Array.isArray(pts) && pts.some(triple))) return `${layerName('Fn', own(props, 'id'))} takes two variables`;
      continue;
    }
    if ((Array.isArray(pts) && pts.some(triple)) || ['at', 'from', 'to'].some((key) => triple(own(props, key)))) return `${layerName(String(type), own(props, 'id'))} has a point with three coordinates`;
  }
  return undefined;
}

const NOT_2D = 'is for a 3D Plot, one that holds an Fn of two variables or points with three coordinates';
const common = {
  id: field.optional(field.id()),
  x: field.optional(field.range()),
  y: field.optional(field.range()),
  xLabel: field.optional(field.text()),
  yLabel: field.optional(field.text()),
  equal: field.optional(field.boolean()),
};

export const Plot = component({
  name: 'Plot',
  signature: '<Plot id x={[lo, hi]} y={[lo, hi]} z={[lo, hi]} xLabel yLabel zLabel equal view={{ azimuth, elevation }}>',
  summary: 'axes in data coordinates.',
  guidance: [
    'A Plot is 3D when it holds an `Fn` of two variables or any point with three coordinates; then every point in it is `[x, y, z]`, z points up, and the student turns it by dragging.',
    'An axis is required when a function takes it as input (`x` for a curve, `x` and `y` for a surface z = f(x, y)); every other axis is fitted to the layers when absent, and a surface\'s few extreme heights (near a pole such as 1/(x² + y²)) are cut at the box; give the axis to show more.',
    '`equal` draws one unit as long on every axis, so a circle stays round and a sphere a sphere; it is on when the axes span the same length, or when a 3D Plot gives none and its spans are within 10× of each other, and `equal={false}` turns it off. Without it each axis fills its side, so unequal ranges never squash the drawing.',
    '`view` is a 3D Plot\'s starting angle in degrees, default `{ azimuth: 30, elevation: 25 }`.',
  ],
  variants: {
    Plot: { dimension: 2, fields: { ...common, z: field.unused(NOT_2D), zLabel: field.unused(NOT_2D), view: field.unused(NOT_2D) } },
    Plot3: {
      dimension: 3,
      fields: { ...common, z: field.optional(field.range()), zLabel: field.optional(field.text()), view: field.optional(field.object({ azimuth: field.optional(field.number()), elevation: field.optional(field.number()) })) },
    },
  },
  children: [...SHARED_LAYER_NAMES, 'Fn', 'Region'],
  context({ children }): Context {
    const why = threeD(children);
    return why ? { dimension: 3, why: `this Plot is 3D because ${why}` } : { dimension: 2, why: 'this Plot is 2D' };
  },
  check(plot, { fail }) {
    const layers = plot.children;
    if (layers.length > LIMITS.layers) fail(over(layers.length, 'layers', LIMITS.layers));
    const fns = layers.filter((layer) => layer.type === 'Fn' || layer.type === 'Surface');
    if (plot.type === 'Plot3') {
      if (fns.length > LIMITS.surfaces) fail(over(fns.length, 'surfaces', LIMITS.surfaces));
      const graph = fns.find((layer) => layer.zs !== undefined);
      for (const key of ['x', 'y'] as const) if (graph && plot[key] === undefined) fail(`${key} is required: ${layerName('Fn', graph.id)} takes x and y as input`);
      return;
    }
    if (fns[0] && plot.x === undefined) fail(`x is required: ${layerName('Fn', fns[0].id)} takes x as input`);
    const ids = new Set(fns.flatMap((layer: Child) => (layer.id ? [layer.id] : [])));
    for (const layer of layers) {
      if (layer.type !== 'Region') continue;
      for (const key of ['top', 'base'] as const) {
        const value = layer[key];
        if (typeof value === 'string' && !ids.has(value)) fail(`Region "${key}" names no Fn of this Plot: "${value}"`);
      }
    }
  },
});
