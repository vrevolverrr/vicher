import { layoutPlot } from '@/renderer/figure/packages/plot/layoutPlot';
import type { Layer } from '@/renderer/figure/packages/plot/PlotModel';

describe('layoutPlot', () => {
  it('maps the ranges onto the plotting area inside the margins', () => {
    const layout = layoutPlot({ x: [0, 10], y: [0, 5], layers: [] }, 480, 300);
    expect(layout.sx(0)).toBe(layout.margin.left);
    expect(layout.sx(10)).toBeCloseTo(layout.margin.left + layout.pw);
    expect(layout.sy(0)).toBeCloseTo(layout.margin.top + layout.ph);
    expect(layout.sy(5)).toBe(layout.margin.top);
  });

  it('keeps one unit as long on both axes when equal, centring the plot and drawing it shorter', () => {
    const layout = layoutPlot({ x: [-1, 1], y: [-1, 1], equal: true, layers: [] }, 480, 300);
    expect(layout.sx(1) - layout.sx(-1)).toBeCloseTo(layout.sy(-1) - layout.sy(1));
    expect(layout.shift).toBeGreaterThan(0);
  });

  it('tilts category names that do not fit their slot', () => {
    const layout = layoutPlot({ x: ['Extraordinarily', 'Incomprehensible', 'Uncharacteristically'], y: [0, 1], layers: [] }, 260, 300);
    expect(layout.labels?.tilted).toBe(true);
    expect(layout.xTicks).toEqual([]);
  });

  it('keeps to whole x ticks when the data sits only on whole x values', () => {
    const ticks = (layers: Layer[], x: [number, number] = [0.8, 3.2]) => layoutPlot({ x, y: [0, 5], layers }, 480, 300).xTicks;
    const line = (...xs: number[]): Layer => ({ kind: 'line', points: xs.map((x) => [x, 1]) });
    expect(ticks([line(1, 2, 3)])).toEqual([1, 2, 3]);
    expect(ticks([line(0.8, 3.2), line(1, 2, 3)]), 'a line across the axis says nothing about the data').toEqual([1, 2, 3]);
    expect(ticks([line(1, 1.5, 3)])).toContain(1.5);
    expect(ticks([line(0.8, 3.2)]), 'no data between the ends').toContain(1.5);
    expect(ticks([{ kind: 'dot', x: 1, y: 1 }, { kind: 'dot', x: 2, y: 1 }], [1, 2]), 'too few whole ticks to keep').toContain(1.5);
  });
});
