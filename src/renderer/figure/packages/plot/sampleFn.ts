/** `f` at `count` evenly spaced x from `from` to `to`; y is null where `f` is not a finite number. Errors from `f` pass through. */
export function sampleFn(f: (x: number) => unknown, from: number, to: number, count: number): [number, number | null][] {
  return Array.from({ length: count }, (_, i) => {
    const x = from + ((to - from) * i) / (count - 1);
    const y = Number(f(x));
    return [x, Number.isFinite(y) ? y : null];
  });
}
