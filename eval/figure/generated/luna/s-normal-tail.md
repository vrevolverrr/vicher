The shaded right tail is about $0.05$, so $P(Z > 1.645) \approx 0.05$.

```figure
export default function () {
  const density = x => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
  return (
    <Plot x={[-4, 4]} y={[0, 0.45]} xLabel="z" yLabel="Density">
      <Fn id="normal" f={density} from={-4} to={4} label="Standard normal" />
      <Region top="normal" from={1.645} to={4} label="P(Z > 1.645)" />
      <Shape pts={[[1.645, 0], [1.645, density(1.645)]]} label="z = 1.645" />
    </Plot>
  );
}
```

