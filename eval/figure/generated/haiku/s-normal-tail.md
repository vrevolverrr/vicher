**P(Z > 1.645) ≈ 0.05.** The shaded right tail is that area.

```figure
const z = 1.645;
const pdf = x => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);

export default function () {
  return (
    <Plot id="plot" x={[-4, 4]} y={[0, 0.45]} xLabel="z" yLabel="density">
      <Fn id="pdf" f={pdf} label="standard normal curve" />
      <Region id="tail" top="pdf" from={z} to={4} label="$P(Z > 1.645) \approx 0.05$" />
      <Segment id="cut" from={[z, 0]} to={[z, 0.2]} label="z = 1.645" />
    </Plot>
  );
}
```

The standard normal curve is a density. Its total area is 1, and any area under it is a probability. The shaded area to the right of $z = 1.645$ is the chance that $Z$ is above 1.645.

For a standard normal $Z$, the **right-tail probability** is

$$P(Z > z) = \int_{z}^{\infty} \varphi(t)\,dt, \qquad \varphi(t) = \frac{e^{-t^2/2}}{\sqrt{2\pi}}$$

Here $\varphi$ is the density of $Z$, and the integral sums the area from $z$ to infinity.

Tables give $\Phi(z) = P(Z \le z)$, which is the area to the left. The table values are:

- $\Phi(1.64) = 0.9495$
- $\Phi(1.65) = 0.9505$

1.645 is halfway between these, so $\Phi(1.645) \approx 0.9500$. Since the total area is 1:

$$P(Z > 1.645) = 1 - \Phi(1.645) \approx 1 - 0.9500 = 0.0500$$

The exact value is 0.04998, so the tail is about 5% of the total area.