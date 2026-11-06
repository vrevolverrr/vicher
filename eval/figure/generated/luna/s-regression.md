The least-squares line is $\hat y = \frac{17}{14} + \frac{20}{21}x$. Each vertical segment shows a residual: observed $y$ minus predicted $\hat y$.

```figure
export default function () {
  const points = [[1, 2], [2, 3], [3, 5], [4, 4], [5, 6], [6, 8], [7, 7], [8, 9]];
  const predict = x => 17 / 14 + (20 / 21) * x;
  return (
    <Plot x={[0, 9]} y={[0, 10]} xLabel="x" yLabel="y">
      <Fn id="line" f={predict} from={0} to={9} label="Least-squares line" />
      {points.map(([x, y], i) => (
        <Shape id={`residual-${i}`} pts={[[x, y], [x, predict(x)]]} group="Residuals" />
      ))}
      <Points id="data" pts={points} label="Observed points" />
    </Plot>
  );
}
```

