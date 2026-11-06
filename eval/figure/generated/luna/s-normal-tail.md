The shaded right tail is about $0.05$.

```figure
export default function () {
  const density = x => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
  return (
    <Plot x={[-3.5, 3.5]} y={[0, 0.45]} xLabel="z" yLabel="Density">
      <Fn id="normal" f={density} label="Standard normal curve" />
      <Region id="tail" top="normal" from={1.645} to={3.5}
        label="$P(Z > 1.645) \approx 0.05$" group="tail" />
      <Segment from={[1.645, 0]} to={[1.645, density(1.645)]} label="$1.645$" />
    </Plot>
  );
}
```

