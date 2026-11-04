import { categoriesOf } from '@/renderer/figure/packages/plot/mixModel';
import { barSteps, niceDomain } from '@/renderer/figure/packages/plot/plotMath';
import type { PlotModel } from '@/renderer/figure/packages/plot/PlotModel';

/** Past this a fitted span can overflow to Infinity; data that large is left out of the fit. */
const HUGE = 1e300;
/** Room past the data on each side, as a share of its span, so nothing is drawn on the frame. */
const PAD = 0.08;
/** One-signed data that comes this close to zero, as a share of its far end, is drawn from zero. */
const NEAR_ZERO = 1 / 3;

/**
 * A range with round ends for an axis the Plot does not give: around every value in `values`, and the bulk of the
 * surface samples in `spread`, with room past each end. Data that stays on one side of zero and comes near it starts
 * at zero, so bars and densities stand on the axis; data far from zero (a price near 100) is zoomed in on. Samples
 * more than the 5–95% spread past it are cut at the box, so a spike such as 1/(x² + y²) does not flatten the rest of
 * its surface.
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
  if (low > high) return [0, 1];
  const pad = (high - low) * PAD;
  const floor = low >= 0 && low <= high * NEAR_ZERO;
  const ceiling = high <= 0 && high >= low * NEAR_ZERO;
  return niceDomain(floor ? 0 : low - pad, ceiling ? 0 : high + pad);
}

/** A 2D Plot's y range when the Plot gives none: `fitRange` over every value its layers reach. */
export function fitY(model: PlotModel): [number, number] {
  const categories = categoriesOf(model.x) !== null;
  const values: number[] = [];
  const see = (v: number | null | undefined): void => {
    if (v != null && Number.isFinite(v)) values.push(v);
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
  return fitRange(values);
}
