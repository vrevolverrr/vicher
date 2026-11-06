The shaded tail is $P(Z > 1.645) \approx 0.0500$, about 5% of the area under the curve.

```figure
const f = x => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
const z = 1.645;

export default function () {
  return (
    <Plot id="plot" x={[-4, 4]} y={[0, 0.45]} xLabel="z" yLabel="density">
      <Fn id="pdf" f={f} label="standard normal" />
      <Region id="tail" top="pdf" from={z} to={4} label="P(Z > 1.645)" />
      <Segment id="cut" from={[z, 0]} to={[z, f(z)]} />
      <Label id="cutlab" at={[z, f(z) + 0.02]} text="z = 1.645" />
    </Plot>
  );
}
```