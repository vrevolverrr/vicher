```figure
const N = 64;
const equator = Array.from({ length: N }, (_, i) => {
  const t = (2 * Math.PI * i) / N;
  return [Math.cos(t), Math.sin(t), 0];
});

export default function () {
  return (
    <Plot id="sphere" x={[-1.3, 1.3]} y={[-1.3, 1.3]} z={[-1.3, 1.3]} xLabel="x" yLabel="y" zLabel="z" equal>
      <Fn id="surface" f={(u, v) => [Math.sin(v) * Math.cos(u), Math.sin(v) * Math.sin(u), Math.cos(v)]} u={[0, 2 * Math.PI]} v={[0, Math.PI]} label="Unit sphere" />
      <Shape id="equator" pts={equator} closed label="Equator" />
    </Plot>
  );
}
```

The unit sphere is every point at distance 1 from the origin:

$$x^2+y^2+z^2=1$$

The equator is the circle where the sphere meets the plane $z=0$. Its points satisfy $x^2+y^2=1$ and $z=0$. Drag the figure to turn it.

Not checked: I did not render the figure here. The equator is sampled at 64 points, so it looks slightly polygonal when zoomed in.