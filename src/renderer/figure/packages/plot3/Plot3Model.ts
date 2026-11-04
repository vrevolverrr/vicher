import type { Tag } from '@/renderer/figure/Tag';

export type Point3 = readonly [number, number, number];
export type Range = readonly [number, number];

export interface View { azimuth: number; elevation: number }
export const DEFAULT_VIEW: View = { azimuth: 30, elevation: 25 };
/** Short of straight up or down, where the azimuth would stop turning the box. */
export const clampElevation = (elevation: number): number => Math.max(-89, Math.min(89, elevation));

type Marked = { id?: string; label?: string; tag?: Tag };

/** A layer in data coordinates. Surfaces are grids of (n + 1)² samples, row-major (the second variable is the row), null where `f` was not finite. */
export type Layer3 =
  | ({ type: 'Shape'; pts: readonly Point3[]; closed?: boolean } & Marked)
  | ({ type: 'Circle'; at: Point3; r: number } & Marked)
  | ({ type: 'Vector' | 'Segment'; from: Point3; to: Point3 } & Marked)
  | ({ type: 'Points'; pts: readonly Point3[] } & Marked)
  | { type: 'Label'; at: Point3; text: string; tag?: Tag }
  /** A graph z = f(x, y) over `x` × `y`. */
  | ({ type: 'Fn'; x: Range; y: Range; zs: readonly (number | null)[] } & Marked)
  /** A parametric surface (u, v) => [x, y, z]. */
  | ({ type: 'Fn'; pts: readonly (Point3 | null)[] } & Marked);

/** A 3D Plot ready to draw: the box with every axis resolved, the starting view, and the layers in data coordinates. */
export interface Plot3Model {
  x: Range;
  y: Range;
  z: Range;
  xLabel?: string;
  yLabel?: string;
  zLabel?: string;
  /** One unit is as long on every axis; otherwise each axis fills its side of the box. */
  equal: boolean;
  view: View;
  children: readonly Layer3[];
}
