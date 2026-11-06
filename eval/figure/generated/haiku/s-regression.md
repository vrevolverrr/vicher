**Least-squares line: ŷ = 17/14 + (20/21)x ≈ 1.214 + 0.952x**

Sums: n = 8, x̄ = 4.5, ȳ = 5.5, Sₓₓ = 42, Sₓᵧ = 40. So the slope is b = Sₓᵧ / Sₓₓ = 40/42 = 20/21, and the intercept is a = ȳ − b·x̄ = 17/14.

| x | y | ŷ | residual (y − ŷ) |
|---|---|---|---|
| 1 | 2 | 2.167 | −0.167 |
| 2 | 3 | 3.119 | −0.119 |
| 3 | 5 | 4.071 | 0.929 |
| 4 | 4 | 5.024 | −1.024 |
| 5 | 6 | 5.976 | 0.024 |
| 6 | 8 | 6.929 | 1.071 |
| 7 | 7 | 7.881 | −0.881 |
| 8 | 9 | 8.833 | 0.167 |

The residuals sum to 0. The sum of squared residuals is 82/21 ≈ 3.905.

```figure
const xs = [1, 2, 3, 4, 5, 6, 7, 8];
const ys = [2, 3, 5, 4, 6, 8, 7, 9];
const a = 17 / 14;
const b = 20 / 21;
const yhat = x => a + b * x;

export default function () {
  return (
    <Plot id="plot" x={[0, 9]} y={[0, 10]} xLabel="x" yLabel="y">
      <>
        {xs.map((x, i) => (
          <Segment id={`res-${x}`} from={[x, ys[i]]} to={[x, yhat(x)]} group="Residual" />
        ))}
      </>
      <Points id="data" pts={xs.map((x, i) => [x, ys[i]])} group="Data" />
      <Fn id="line" f={yhat} from={0} to={9} label="ŷ = 17/14 + (20/21)x" />
    </Plot>
  );
}
```

Computed by hand, not run in code. The residuals check out because they sum to 0.