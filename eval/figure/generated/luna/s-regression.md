The least-squares line is $\hat y = \frac{17}{14}+\frac{20}{21}x$. Each vertical segment shows a residual: observed $y$ minus fitted $\hat y$.

```figure
export default function () {
  const fitted = x => 17 / 14 + (20 * x) / 21;
  const observed = [[1, 2], [2, 3], [3, 5], [4, 4], [5, 6], [6, 8], [7, 7], [8, 9]];

  return (
    <Plot x={[0, 9]} y={[0, 10]} xLabel="x" yLabel="y">
      <Fn id="fit" f={fitted} from={1} to={8} label="Least-squares line" />
      {observed.map(([x, y]) => (
        <Segment
          id={`residual-${x}`}
          from={[x, y]}
          to={[x, fitted(x)]}
          group="residual"
        />
      ))}
      <Points pts={observed} label="Observed points" />
    </Plot>
  );
}
```

