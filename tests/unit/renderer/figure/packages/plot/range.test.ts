import { fitRange, fitY } from '@/renderer/figure/packages/plot/range';

describe('fitRange', () => {
  it('starts one-signed data that comes near zero at zero, with room above', () => {
    expect(fitRange([1, 7])).toEqual([0, 8]);
    expect(fitRange([-50, -10])).toEqual([-60, 0]);
  });

  it('zooms in on data far from zero', () => {
    expect(fitRange([95, 105])).toEqual([94, 106]);
  });

  it('leaves room past both ends of data across zero', () => {
    expect(fitRange([-1, 1])).toEqual([-1.5, 1.5]);
  });

  it('is [0, 1] with nothing to fit', () => {
    expect(fitRange([])).toEqual([0, 1]);
  });
});

describe('fitY', () => {
  it('fits the y values a 2D plot reaches, bars from zero', () => {
    expect(fitY({ x: ['a', 'b'], layers: [{ kind: 'bars', values: [95, 105], mode: 'bars' }] })[0]).toBe(0);
    expect(fitY({ x: [0, 1], layers: [{ kind: 'line', points: [[0, 95], [1, 105]] }] })).toEqual([94, 106]);
  });
});
