import { categoriesOf, type ResolvedModel } from '@/renderer/figure/plot/mixModel';
import { niceTicks, tickText, wrapLabel } from '@/renderer/figure/plot/plotMath';

const MIN_LEFT_MARGIN = 28;
export const TICK_CHAR_WIDTH = 7.5;
export const TICK_GAP = 8;
const Y_TITLE_WIDTH = 20;

export interface CategoryLabels { lines: string[][]; tilted: boolean }

export interface PlotLayout {
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  /** The plotting area's size, inside the margins. */
  pw: number;
  ph: number;
  /** How far an equal-scale plot is moved right to centre it. */
  shift: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  cats: string[] | null;
  labels: CategoryLabels | null;
  xTicks: number[];
  yTicks: number[];
  sx: (x: number) => number;
  sy: (y: number) => number;
}

/** Where a 2D plot's axes, ticks and plotting area go at `width` pixels, asked to be `height` tall. */
export function layoutPlot(model: ResolvedModel, width: number, height: number): PlotLayout {
  const narrow = width < 480;
  const cats = categoriesOf(model.x);
  const [x0, x1] = cats ? ([0, cats.length] as [number, number]) : (model.x as [number, number]);
  const [y0, y1] = model.y;
  const xTicks = cats ? [] : niceTicks(x0, x1, narrow ? 4 : 7);
  const margin = { top: 14, right: narrow ? 12 : 20, bottom: model.xLabel ? 46 : 32, left: 0 };
  // Only visible tick labels need room; interpolated range endpoints can have extra decimal places.
  const yTicks = (ph: number) => niceTicks(y0, y1, Math.max(3, Math.round(ph / 50)));
  const widest = Math.max(...yTicks(height - margin.top - margin.bottom).map((v) => tickText(v).length));
  margin.left = Math.max(MIN_LEFT_MARGIN, Math.ceil(widest * TICK_CHAR_WIDTH) + TICK_GAP + 4) + (model.yLabel ? Y_TITLE_WIDTH : 0);
  let pw = width - margin.left - margin.right;
  // A tick label is centred on its tick, so the last one needs room past the plot's right edge.
  const last = xTicks[xTicks.length - 1];
  if (last !== undefined && last > x0) pw = Math.min(pw, (width - margin.left - (tickText(last).length * TICK_CHAR_WIDTH) / 2) / ((last - x0) / (x1 - x0)));
  // Category names wrap to their slot, or tilt when a word will not fit, so neighbours never run together.
  const labels = cats ? categoryLabels(cats, pw / cats.length) : null;
  if (labels) margin.bottom = labels.tilted ? 62 : 20 + 13 * Math.max(...labels.lines.map((l) => l.length));
  let ph = height - margin.top - margin.bottom;
  // At equal scale the plot keeps the larger scale that fits both ranges: it is centred across the spare width, or
  // drawn shorter than asked.
  let shift = 0;
  if (model.equal && !cats) {
    const scale = Math.min(pw / (x1 - x0), ph / (y1 - y0));
    shift = (pw - (x1 - x0) * scale) / 2;
    margin.left += shift;
    pw -= 2 * shift;
    height -= Math.round(ph - (y1 - y0) * scale);
    ph = height - margin.top - margin.bottom;
  }
  const left = margin.left;
  return {
    height, margin, pw, ph, shift, x0, x1, y0, y1, cats, labels, xTicks, yTicks: yTicks(ph),
    sx: (x) => left + ((x - x0) / (x1 - x0)) * pw,
    sy: (y) => margin.top + (1 - (y - y0) / (y1 - y0)) * ph,
  };
}

function categoryLabels(cats: string[], band: number): CategoryLabels {
  const wrapped = cats.map((name) => wrapLabel(name, Math.max(4, Math.floor(band / 5.8))));
  const tilted = wrapped.some((w) => !w.fits);
  return { tilted, lines: tilted ? cats.map((name) => [name.length > 14 ? `${name.slice(0, 13)}…` : name]) : wrapped.map((w) => w.lines) };
}
