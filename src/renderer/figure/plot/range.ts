import { niceDomain } from '@/renderer/figure/plot/plotMath';

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
