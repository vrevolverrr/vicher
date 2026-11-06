The shaded right tail is $P(Z>1.645)\approx 0.05$.

```figure
export default function () {
  return (
    <Plot x={[-4, 4]} y={[0, 0.45]} xLabel="z" yLabel="Density">
      <Fn id="normal" f={x => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI)} from={-4} to={4} label="Standard normal curve" />
      <Region id="tail" top="normal" from={1.645} to={4} label="P(Z > 1.645)" />
      <Points pts={[[1.645, Math.exp(-1.645 * 1.645 / 2) / Math.sqrt(2 * Math.PI)]]} label="z = 1.645" />
    </Plot>
  );
}
```

