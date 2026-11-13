Drag the surface to turn it. Peaks sit at $z = 1$ where $(x, y) = (\pi/2, 0)$, troughs at $z = -1$ where $(x, y) = (-\pi/2, 0)$, and $z = 0$ along $x = 0$ and $y = \pm\pi/2$.

```figure
export default function () {
  return (
    <Plot
      x={[-Math.PI, Math.PI]}
      y={[-Math.PI, Math.PI]}
      z={[-1, 1]}
      xLabel="x"
      yLabel="y"
      zLabel="z"
      view={{ azimuth: 30, elevation: 25 }}
    >
      <Fn id="surf" f={(x, y) => Math.sin(x) * Math.cos(y)} label="$z = \sin x \cos y$" />
    </Plot>
  );
}
```

Not checked: I did not render the figure, so the axis fit and the default view are unverified.