import { component, field } from '@/renderer/figure/components/component';
import { LIMITS, type Point3 } from '@/renderer/figure/FigureData';

const SURFACE_SAMPLES = (LIMITS.surfaceCells + 1) ** 2;
const PARAMETRIC = 'only for a parametric surface, f={(u, v) => [x, y, z]}';
const isSample = (value: unknown): boolean => Array.isArray(value) && value.length === 2 && typeof value[0] === 'number' && (value[1] === null || typeof value[1] === 'number');
const marks = { label: field.optional(field.text()), group: field.optional(field.group()), state: field.optional(field.state()) };

export const Fn = component({
  name: 'Fn',
  signature: '<Fn id f u v from to label group state />',
  summary: 'sampled by the host. `f={x => ...}` draws a curve; it breaks where it leaves the box through the top and comes back through the bottom, so `tan` and `1/x` draw no false vertical.',
  guidance: [
    '`f={(x, y) => ...}` draws a surface z = f(x, y) over the box\'s x and y, and `f={(u, v) => [x, y, z]}` with `u={[lo, hi]} v={[lo, hi]}` a parametric surface (a sphere, a torus, a cone). Write a surface\'s two parameters plain: a default value, as in `(x, y = 0) =>`, makes it a curve.',
    '`from` and `to` narrow x; any other domain (a disk, y ≥ 0, a cut-away sphere) returns `NaN` outside it, which leaves a hole. Surfaces are shaded by height, in the colour of their group when they have one, and cut at the box; paths, points and vectors are drawn over them. A point meant to lie on a surface uses the same function: `[x, y, f(x, y)]`. Give a surface the state `dim` when a path or point on it is the subject.',
  ],
  variants: {
    /** `pts` are the worker's samples of `f`; `y` is null where `f` was not finite. */
    Fn: {
      dimension: 2,
      fields: {
        id: field.optional(field.id()),
        pts: field.sampled<readonly (readonly [number, number | null])[]>((value) => Array.isArray(value) && value.length <= LIMITS.fnSamples && value.every(isSample), 'must be samples [x, y]'),
        u: field.unused(`is ${PARAMETRIC}`),
        v: field.unused(`is ${PARAMETRIC}`),
        from: field.optional(field.number()),
        to: field.optional(field.number()),
        ...marks,
      },
    },
    /** A graph z = f(x, y) sent as `zs`, or a parametric surface sent as `pts`; `surfaceCells + 1` samples a side, row-major, null where `f` was not finite. */
    Surface: {
      dimension: 3,
      fields: {
        id: field.optional(field.id()),
        zs: field.optional(field.sampled<readonly (number | null)[]>(Array.isArray, 'must be samples')),
        pts: field.optional(field.sampled<readonly (Point3 | null)[]>(Array.isArray, 'must be samples')),
        u: field.optional(field.range()),
        v: field.optional(field.range()),
        from: field.optional(field.number()),
        to: field.optional(field.number()),
        ...marks,
      },
    },
  },
  check(fn, { context, fail }) {
    if (fn.type === 'Fn') return;
    const uv = fn.u !== undefined || fn.v !== undefined;
    const samples = (value: readonly unknown[], check: (sample: unknown) => boolean, what: string): void => {
      if (value.length !== SURFACE_SAMPLES || !value.every((sample) => sample === null || check(sample))) fail(`Fn samples must be ${SURFACE_SAMPLES} ${what}`);
    };
    if (fn.zs !== undefined) {
      if (uv) fail(`u and v are ${PARAMETRIC}`);
      samples(fn.zs, (z) => typeof z === 'number', 'heights');
      return;
    }
    const pts = (fn.pts ?? []) as readonly unknown[];
    if (!pts.some((p) => Array.isArray(p) && p.length === 3)) fail(`this Fn is a curve, f={x => ...}; ${context.why}, and an Fn in a 3D Plot is a surface, f={(x, y) => z} or f={(u, v) => [x, y, z]}`);
    if (fn.u === undefined || fn.v === undefined) fail('a parametric surface, f={(u, v) => [x, y, z]}, needs u={[lo, hi]} and v={[lo, hi]}');
    if (fn.from !== undefined || fn.to !== undefined) fail('from and to narrow x, which a parametric surface does not take; return NaN outside its domain instead');
    samples(pts, (p) => Array.isArray(p) && p.length === 3 && p.every((c) => typeof c === 'number'), 'points [x, y, z]');
  },
});
