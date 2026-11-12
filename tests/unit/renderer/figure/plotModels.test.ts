import { plot3Model, plotModel } from '@/renderer/figure/plotModels';
import type { FigureNode } from '@/renderer/figure/FigureData';

const sampled = (f: (x: number) => number, from: number, to: number): [number, number | null][] =>
  Array.from({ length: 161 }, (_, i) => {
    const x = from + ((to - from) * i) / 160;
    const y = f(x);
    return [x, Number.isFinite(y) ? y : null];
  });

const linePoints = (fn: (x: number) => number, from: number, to: number, y: [number, number]): [number, number | null][] => {
  const plot: Extract<FigureNode, { type: 'Plot' }> = { type: 'Plot', x: [from, to], y, children: [{ type: 'Fn', pts: sampled(fn, from, to) }] };
  const layer = plotModel(plot).layers[0];
  if (layer.kind !== 'line') throw new Error('expected a line');
  return layer.points;
};

describe('the Fn jump rule', () => {
  it('breaks tan at each asymptote in [-3, 3]', () => {
    const points = linePoints(Math.tan, -3, 3, [-5, 5]);
    const breaks = points.filter(([, y]) => y === null).map(([x]) => x);
    expect(breaks).toHaveLength(2);
    expect(breaks[0]).toBeCloseTo(-Math.PI / 2, 1);
    expect(breaks[1]).toBeCloseTo(Math.PI / 2, 1);
  });

  it('keeps the vertical of a step function that stays in the box', () => {
    const points = linePoints((x) => (x < 0 ? -1 : 1), -2, 2, [-2, 2]);
    expect(points.some(([, y]) => y === null)).toBe(false);
  });
});

describe('equal scale', () => {
  const plot = (x: [number, number], y?: [number, number], equal?: boolean): Extract<FigureNode, { type: 'Plot' }> => ({ type: 'Plot', x, ...(y ? { y } : {}), ...(equal === undefined ? {} : { equal }), children: [] });

  it('is on when the two given ranges have the same length, and off otherwise unless asked for', () => {
    expect(plotModel(plot([-1.4, 1.4], [-1.4, 1.4])).equal).toBe(true);
    expect(plotModel(plot([-40, 100], [-70, 70])).equal).toBe(true);
    expect(plotModel(plot([0, 10], [-2, 4])).equal).toBeUndefined();
    expect(plotModel(plot([0, 10])).equal).toBeUndefined();
    expect(plotModel(plot([0, 10], [-2, 4], true)).equal).toBe(true);
    expect(plotModel(plot([0, 1], [0, 1], false)).equal).toBeUndefined();
  });
});

describe('a layer\'s colour', () => {
  const colors = new Map([['missed', 'red'], ['pivot', 'blue']]);
  const colorOf = (name: string | undefined): string | undefined => (name ? colors.get(name) : undefined);
  const shape = { pts: [[0, 0], [1, 1]] as [number, number][] };
  const layers = (...children: unknown[]) => plotModel({ type: 'Plot', x: [0, 1], y: [0, 1], children } as Extract<FigureNode, { type: 'Plot' }>, colorOf).layers;

  it('takes a line\'s label as its name', () => {
    expect(layers({ type: 'Shape', ...shape, label: 'missed' })[0]).toMatchObject({ color: 'red' });
  });

  it('writes a 2D Segment\'s label on the plot and leaves the line neutral', () => {
    const layers = plotModel({ type: 'Plot', x: [0, 2], children: [{ type: 'Segment', from: [0, 1], to: [2, 1], label: 'limit' }] } as never, () => undefined).layers;
    expect(layers).toMatchObject([{ kind: 'line', neutral: true }, { kind: 'note', x: 1, y: 1, text: 'limit' }]);
    expect(layers[0]).not.toHaveProperty('label');
  });

  it('marks a Region with a number top and both ends as a bar, and no other', () => {
    const area = (props: object) => plotModel({ type: 'Plot', x: [0, 2], children: [{ type: 'Region', ...props }] } as never, () => undefined).layers[0];
    expect(area({ top: 1, from: 0, to: 1 })).toMatchObject({ bar: true });
    expect(area({ top: 1 })).not.toHaveProperty('bar');
  });

  it('leaves only an unnamed Shape neutral', () => {
    const [unnamed, named] = layers({ type: 'Shape', ...shape }, { type: 'Shape', ...shape, label: 'observed' });
    expect(unnamed).toMatchObject({ neutral: true });
    expect(named).not.toHaveProperty('neutral');
  });

  it('takes a 3D line\'s label as its name, but not a dot\'s', () => {
    const plot = { type: 'Plot3', children: [{ type: 'Segment', from: [0, 0, 0], to: [1, 1, 1], label: 'missed' }, { type: 'Points', pts: [[0, 0, 0]], label: 'missed' }] } as unknown as Extract<FigureNode, { type: 'Plot3' }>;
    const [line, dot] = plot3Model(plot, colorOf).children;
    expect(line).toMatchObject({ color: 'red' });
    expect(dot).toMatchObject({ color: undefined });
  });

  it('prefers a group to a label', () => {
    expect(layers({ type: 'Shape', ...shape, label: 'missed', group: 'pivot' })[0]).toMatchObject({ color: 'blue' });
  });

  it('writes one point\'s label beside it, and lists the label several points share in the legend', () => {
    expect(layers({ type: 'Points', pts: [[0, 0]], label: 'peak' })).toMatchObject([{ kind: 'dot', label: 'peak' }]);
    const set = layers({ type: 'Points', pts: [[0, 0], [1, 1]], label: 'nodes' });
    expect(set).toMatchObject([{ kind: 'dot', name: 'nodes' }, { kind: 'dot' }]);
    expect(set.some((dot) => 'label' in dot)).toBe(false);
  });

  it('draws parametric surfaces at one scale even when the Plot gives its axes, and a graph z = f(x, y) to fill them', () => {
    const plot3 = (surface: object) => plot3Model({ type: 'Plot3', x: [-2.6, 2.6], y: [-2.6, 2.6], z: [-0.6, 0.6], children: [{ type: 'Surface', ...surface }] } as never);
    expect(plot3({ pts: [[2, 0, 0.5]] }).equal).toBe(true);
    expect(plot3({ zs: [0.5] }).equal).toBe(false);
  });

  it('does not read a dot\'s label as a name', () => {
    expect(layers({ type: 'Points', pts: [[0, 0]], label: 'missed' })[0]).toMatchObject({ color: undefined });
  });
});
