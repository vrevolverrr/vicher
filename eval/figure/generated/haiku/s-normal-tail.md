$P(Z > 1.645) = 1 − Φ(1.645) ≈ 0.050$. The shaded area is the right tail beyond $z = 1.645$.

```figure
const phi = z => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);

export default function () {
  return (
    <Plot id="p" x={[-4, 4]} y={[0, 0.45]} xLabel="$z$" yLabel="$\phi(z)$">
      <Fn id="pdf" f={z => phi(z)} label="$\phi(z)$" />
      <Region id="tail" top="pdf" base={0} from={1.645} to={4} label="$P(Z>1.645)\approx 0.050$" state="active" />
      <Segment id="cut" from={[1.645, 0]} to={[1.645, phi(1.645)]} label="$z=1.645$" />
    </Plot>
  );
}
```