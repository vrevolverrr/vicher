import { sampleSurface, SurfaceError } from '@/renderer/figure/packages/plot3/sampleSurface';

describe('sampleSurface', () => {
  it('returns heights for a graph and points for a parametric surface, with holes as null', () => {
    expect(sampleSurface((x, y) => (x === 0 && y === 0 ? NaN : x + y), [0, 1], [0, 1], 1)).toEqual({ zs: [null, 1, 1, 2] });
    expect(sampleSurface((u, v) => [u, v, 0], [0, 1], [0, 1], 1)).toEqual({ pts: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0]] });
  });

  it('throws its own error, with where and why, on a value of the wrong kind', () => {
    const thrown = (f: (a: number, b: number) => unknown): unknown => {
      try {
        sampleSurface(f, [0, 1], [0, 1], 1);
      } catch (error) {
        return error;
      }
    };
    expect(thrown(() => [1, 2])).toMatchObject({ reason: 'coordinates', at: [0, 0], got: 2 });
    expect(thrown((x) => (x < 1 ? 0 : [0, 0, 0]))).toMatchObject({ reason: 'pointAfterNumbers', at: [1, 0] });
    expect(thrown((x) => (x < 1 ? [0, 0, 0] : 0))).toBeInstanceOf(SurfaceError);
  });

  it('lets an error from f through untouched', () => {
    const own = new TypeError('x is undefined');
    expect(() => sampleSurface(() => { throw own; }, [0, 1], [0, 1], 1)).toThrow(own);
  });
});
