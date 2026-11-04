import type { Point3 } from '@/renderer/figure/packages/plot3/Plot3Model';

/** A surface function that returns the wrong kind of value at `at`, the (u, v) where it was found. */
export class SurfaceError extends Error {
  constructor(
    /** `coordinates`: a point without three coordinates (`got` holds how many); `pointAfterNumbers` and `numberAfterPoints`: a mix of the two kinds. */
    readonly reason: 'coordinates' | 'pointAfterNumbers' | 'numberAfterPoints',
    readonly at: readonly [number, number],
    readonly got?: number,
  ) {
    super(`Surface ${reason} at (${at[0]}, ${at[1]})`);
  }
}

/**
 * Samples a function of two variables on a grid of `cells + 1` samples a side, row-major (the second variable is the row).
 * The first finite sample decides what it is: a number makes a graph z = f(x, y), returned as `zs`; a point makes a
 * parametric surface, returned as `pts`. A non-finite value is a hole (null) in either. Throws `SurfaceError` on a value of
 * the wrong kind; errors from `f` pass through.
 */
export function sampleSurface(f: (a: number, b: number) => unknown, [u0, u1]: readonly [number, number], [v0, v1]: readonly [number, number], cells: number): { zs: (number | null)[] } | { pts: (Point3 | null)[] } {
  let kind: 'graph' | 'parametric' | undefined;
  const out: (number | Point3 | null)[] = [];
  for (let j = 0; j <= cells; j += 1) {
    for (let i = 0; i <= cells; i += 1) {
      const a = u0 + ((u1 - u0) * i) / cells;
      const b = v0 + ((v1 - v0) * j) / cells;
      const value = f(a, b);
      if (Array.isArray(value)) {
        if (value.length !== 3) throw new SurfaceError('coordinates', [a, b], value.length);
        if (kind === 'graph') throw new SurfaceError('pointAfterNumbers', [a, b]);
        const point = value.map(Number) as unknown as Point3;
        const finite = point.every(Number.isFinite);
        if (finite) kind = 'parametric';
        out.push(finite ? point : null);
      } else {
        const z = Number(value);
        const finite = Number.isFinite(z);
        if (finite && kind === 'parametric') throw new SurfaceError('numberAfterPoints', [a, b]);
        if (finite) kind = 'graph';
        out.push(finite ? z : null);
      }
    }
  }
  return kind === 'parametric' ? { pts: out as (Point3 | null)[] } : { zs: out as (number | null)[] };
}
