import { categoriesOf } from '@/renderer/figure/plot/mixModel';
import { barSteps, niceDomain } from '@/renderer/figure/plot/plotMath';
import type { PlotModel } from '@/renderer/figure/plot/PlotModel';

/** Past this a fitted span can overflow to Infinity; data that large is left out of the fit. */
const HUGE = 1e300;

/**
 * A range with round ends for an axis the Plot does not give: around every value in `values`, and the bulk of the
 * surface samples in `spread`. Samples more than the 5–95% spread past it are cut at the box, so a spike such as
 * 1/(x² + y²) does not flatten the rest of its surface.
 */
export function fitRange(values: readonly number[], spread: readonly number[] = []): [number, number] {
  let low = Infinity;
  let high = -Infinity;
  const see = (value: number): void => {
    if (Math.abs(value) > HUGE) return;
    low = Math.min(low, value);
    high = Math.max(high, value);
  };
  values.forEach(see);
  const sorted = spread.filter((value) => Math.abs(value) <= HUGE).sort((a, b) => a - b);
  if (sorted.length) {
    const p5 = sorted[Math.floor(sorted.length * 0.05)];
    const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1];
    see(Math.max(sorted[0], p5 - (p95 - p5)));
    see(Math.min(sorted[sorted.length - 1], p95 + (p95 - p5)));
  }
  return low <= high ? niceDomain(low, high) : [0, 1];
}

/** A 2D Plot's y range when the Plot gives none: every value its layers reach, padded, with zero as the floor or ceiling of one-signed data. */
export function fitY(model: PlotModel): [number, number] {
  const categories = categoriesOf(model.x) !== null;
  let low = Infinity;
  let high = -Infinity;
  const see = (v: number | null | undefined) => {
    if (v == null || !Number.isFinite(v) || Math.abs(v) > 1e9) return;
    low = Math.min(low, v);
    high = Math.max(high, v);
  };
  for (const layer of model.layers) {
    if (layer.kind === 'line') layer.points.forEach((p) => see(p[1]));
    else if (layer.kind === 'area') { layer.points.forEach((p) => see(p[1])); layer.lower?.forEach((p) => see(p[1])); if (!layer.lower) see(layer.base); }
    else if (layer.kind === 'bars') { for (const step of barSteps(layer.values, layer.mode)) { see(step.from); see(step.to); } see(0); }
    else if (layer.kind === 'dot') see(layer.y);
    else if (layer.kind === 'rule' && layer.axis === 'y') see(layer.at);
    else if (layer.kind === 'note' && !categories) see(layer.y);
    else if (layer.kind === 'arrow') { see(layer.from[1]); see(layer.to[1]); }
  }
  if (!Number.isFinite(low)) return [0, 1];
  const pad = (high - low) * 0.08;
  // Data that never goes below zero keeps zero as the floor, so a baseline does not float above the axis.
  return niceDomain(low >= 0 ? 0 : low - pad, high <= 0 ? 0 : high + pad);
}
