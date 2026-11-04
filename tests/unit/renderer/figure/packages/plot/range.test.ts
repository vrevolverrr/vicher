import { fitY } from '@/renderer/figure/packages/plot/range';

describe('fitY', () => {
  it('keeps zero as the floor of data that never goes below it', () => {
    expect(fitY({ x: [0, 1], layers: [{ kind: 'line', points: [[0, 3], [1, 7]] }] })[0]).toBe(0);
  });

  it('pads data of both signs past its ends', () => {
    const [low, high] = fitY({ x: [0, 1], layers: [{ kind: 'line', points: [[0, -5], [1, 5]] }] });
    expect(low).toBeLessThan(-5);
    expect(high).toBeGreaterThan(5);
  });

  it('is [0, 1] with nothing to fit', () => {
    expect(fitY({ x: [0, 1], layers: [] })).toEqual([0, 1]);
  });
});
