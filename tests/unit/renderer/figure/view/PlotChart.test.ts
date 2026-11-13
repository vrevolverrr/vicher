/** @vitest-environment jsdom */
import type { PlotModel } from '@/renderer/figure/packages/plot/PlotModel';
import { PlotChart } from '@/renderer/figure/view/PlotChart';

/** A chart whose frame is `width` pixels wide; jsdom lays nothing out. */
function chart(width: number, model: PlotModel): { chart: PlotChart; written: string[] } {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(width);
  const written: string[] = [];
  const plot = new PlotChart(document.body.appendChild(document.createElement('div')));
  plot.writeLabel = (el, text) => {
    written.push(text);
    el.textContent = text;
  };
  plot.render(model);
  return { chart: plot, written };
}

const texts = (plot: PlotChart): SVGTextElement[] => [...plot.el.querySelectorAll<SVGTextElement>('svg text')];

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('PlotChart', () => {
  it('lists a set of dots in the legend by its name and writes nothing beside them', () => {
    const { chart: plot } = chart(480, { x: [0, 1], y: [0, 1], layers: [{ kind: 'dot', x: 0, y: 0, name: 'nodes' }, { kind: 'dot', x: 1, y: 0 }] });
    expect([...plot.el.querySelectorAll('.vicher-plot-key')].map((key) => key.textContent)).toEqual(['nodes']);
    expect(plot.el.querySelectorAll('.vicher-plot-label')).toHaveLength(0);
  });

  it('gives each named set of dots its own colour, in the legend too', () => {
    const set = (name: string, y: number): PlotModel['layers'] => [0, 1].map((x) => ({ kind: 'dot', x, y, name }));
    const { chart: plot } = chart(480, { x: [0, 1], y: [0, 1], layers: [...set('A', 0), ...set('B', 1)] });
    const fills = [...plot.el.querySelectorAll('svg .vicher-plot-dot')].map((dot) => dot.getAttribute('fill'));
    const swatches = [...plot.el.querySelectorAll<HTMLElement>('.vicher-plot-swatch')].map((swatch) => swatch.style.getPropertyValue('--vicher-swatch'));

    expect(fills).toEqual(['var(--vicher-series-1)', 'var(--vicher-series-1)', 'var(--vicher-series-2)', 'var(--vicher-series-2)']);
    expect(swatches).toEqual(['var(--vicher-series-1)', 'var(--vicher-series-2)']);
  });

    it('gives unnamed bars one colour and the curve over them the next', () => {
    const bar = (from: number): PlotModel['layers'][number] => ({ kind: 'area', points: [[from, 1], [from + 1, 1]], base: 0, from, to: from + 1, bar: true });
    const { chart: plot } = chart(480, { x: [0, 3], y: [0, 2], layers: [bar(0), bar(1), bar(2), { kind: 'line', points: [[0, 0], [3, 2]], label: 'f' }] });
    expect(new Set([...plot.el.querySelectorAll('.vicher-plot-area')].map((area) => area.getAttribute('fill')))).toEqual(new Set(['var(--vicher-series-1)']));
    expect(plot.el.querySelector('.vicher-plot-line')!.getAttribute('stroke')).toBe('var(--vicher-series-2)');
  });

  it('draws a rectangle as a light fill with an outline, so the curve behind a window shows and equal bars stay apart', () => {
    const { chart: plot } = chart(480, { x: [0, 2], y: [0, 6], layers: [
      { kind: 'line', points: [[0, 1], [2, 5]], label: 'f' },
      { kind: 'area', points: [[0.5, 4], [1.5, 4]], base: 2, from: 0.5, to: 1.5, bar: true },
      { kind: 'area', points: [[0, 1], [2, 5]], base: 0 },
    ] });
    const [box, under] = [...plot.el.querySelectorAll('.vicher-plot-area')];

    expect(Number(box.getAttribute('fill-opacity'))).toBeLessThan(0.5);
    expect(box.getAttribute('stroke')).toBe(box.getAttribute('fill'));
    expect(box.closest('[clip-path*="-area-"]')).toBeNull();
    expect(under.getAttribute('stroke')).toBeNull();
  });

  it('draws no arrow for a vector of no length, and still writes its label', () => {
    const { chart: plot } = chart(480, { x: [0, 1], y: [0, 1], layers: [{ kind: 'arrow', from: [0.5, 0.5], to: [0.5, 0.5], label: '0 m/s' }] });
    expect(plot.el.querySelectorAll('.vicher-plot-arrow')).toHaveLength(0);
    expect(texts(plot).some((text) => text.textContent === '0 m/s')).toBe(true);
  });

  it('has the owner typeset labels and axis titles holding maths, and keeps plain ones as SVG text', () => {
    const { chart: plot, written } = chart(480, {
      x: [-40, 100],
      y: [-70, 70],
      xLabel: '$\\sigma$ (MPa)',
      yLabel: '$\\tau$ (MPa)',
      layers: [
        { kind: 'dot', x: 88, y: 0, label: '$\\sigma_1 = 88.3$' },
        { kind: 'dot', x: 30, y: 0, label: 'C (30, 0)' },
        { kind: 'note', x: 0, y: 50, text: '$\\tau_{max}$' },
      ],
    });
    expect(written).toEqual(expect.arrayContaining(['$\\sigma$ (MPa)', '$\\tau$ (MPa)', '$\\sigma_1 = 88.3$', '$\\tau_{max}$']));
    expect(plot.el.querySelectorAll('.vicher-plot-rich-label')).toHaveLength(4);
    expect(texts(plot).some((text) => text.textContent!.includes('$'))).toBe(false);
    expect(texts(plot).map((text) => text.textContent)).toContain('C (30, 0)');
  });

  it('leaves room past the plot for the last x tick label, which is centred on its tick', () => {
    const { chart: plot } = chart(320, { x: [0, 1000], y: [0, 1], layers: [] });
    const last = texts(plot).find((text) => text.textContent === '1000')!;
    expect(Number(last.getAttribute('x')) + (4 * 7.5) / 2).toBeLessThanOrEqual(320);
  });

  it('draws one unit as long on both axes at equal scale', () => {
    const { chart: plot } = chart(480, {
      x: [-1.4, 1.4],
      y: [-1.4, 1.4],
      equal: true,
      layers: [{ kind: 'dot', x: 0, y: 0 }, { kind: 'dot', x: 1, y: 0 }, { kind: 'dot', x: 0, y: 1 }],
    });
    const [origin, right, up] = [...plot.el.querySelectorAll('circle')].map((dot) => [Number(dot.getAttribute('cx')), Number(dot.getAttribute('cy'))]);
    expect(right[0] - origin[0]).toBeCloseTo(origin[1] - up[1], 6);
  });
});
