The least-squares line is $\hat y \approx 0.0893 + 1.2024x$. Each vertical segment shows a residual: the observed value minus the line’s predicted value at that $x$.

```figure
export default function () {
  return (
    <Plot x={[0, 9]} y={[0, 10]} xLabel="x" yLabel="y">
      <Fn id="fit" f={x => 0.0892857 + 1.20238 * x} from={0} to={9} label="Least-squares line" />
      <Points
        pts={[[1, 2], [2, 3], [3, 5], [4, 4], [5, 6], [6, 8], [7, 7], [8, 9]]}
        label="Observed points"
      />
      <Segment from={[1, 1.29167]} to={[1, 2]} label="Residuals" group="residuals" />
      <Segment from={[2, 2.49405]} to={[2, 3]} group="residuals" />
      <Segment from={[3, 3.69643]} to={[3, 5]} group="residuals" />
      <Segment from={[4, 4.89881]} to={[4, 4]} group="residuals" />
      <Segment from={[5, 6.10119]} to={[5, 6]} group="residuals" />
      <Segment from={[6, 7.30357]} to={[6, 8]} group="residuals" />
      <Segment from={[7, 8.50595]} to={[7, 7]} group="residuals" />
      <Segment from={[8, 9.70833]} to={[8, 9]} group="residuals" />
    </Plot>
  );
}
```

