import { el, read } from './read';

const diagram = (...layers: unknown[]) => el('Diagram', { width: 4, height: 3 }, ...layers);

describe('Diagram layers', () => {
  it('reads a Tick across two points', () => {
    expect(read(diagram(el('Tick', { on: [[0, 0], [1, 0]], n: 2 })))).toMatchObject({ children: [{ type: 'Tick', n: 2 }] });
  });

  it.each([
    [el('Tick', { on: [[0, 0]] }), 'Step 1 > Diagram > Tick: on must hold 2, not 1'],
    [el('Tick', { on: [[0, 0], [1, 0]], n: 9 }), 'Step 1 > Diagram > Tick: n must be a whole number from 1 to 8'],
    [el('Circle', { at: [0, 0], r: 0 }), 'Step 1 > Diagram > Circle: r must be a number above 0'],
    [el('Segment', { from: [0, 0, 1], to: [1, 1] }), 'Step 1 > Diagram > Segment: from holds a point with 3 coordinates; a Diagram is 2D, so every point is [x, y]'],
    [el('Fn', { pts: [] }), 'Step 1 > Diagram > Fn: Fn cannot go inside a Diagram; Fn goes only inside a Plot'],
    [el('Row'), 'Step 1 > Diagram > Row: Row cannot go inside a Diagram'],
  ])('refuses %j', (layer, message) => {
    expect(read(diagram(layer))).toBe(message);
  });

  it('keeps Region to a 2D Plot', () => {
    expect(read(el('Plot', { x: [0, 1], y: [0, 1] }, el('Points', { pts: [[0, 0, 0]] }), el('Region', { top: 1 })))).toBe('Step 1 > Plot > Region: Region is 2D only; this Plot is 3D because a `Points` has a point with three coordinates');
  });
});
