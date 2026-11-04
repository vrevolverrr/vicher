import { layoutPlot } from '@/renderer/figure/plot/layoutPlot';

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
});
