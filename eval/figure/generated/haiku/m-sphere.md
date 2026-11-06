The unit sphere is every point at distance 1 from the origin: $x^2+y^2+z^2=1$. Its equator is the circle where $z=0$, the slice by the $xy$-plane. Drag the figure to turn it.

```figure
const N = 64;
const equator = Array.from({ length: N }, (_, k) => {
  const t = (2 * Math.PI * k) / N;
  return [Math.cos(t), Math.sin(t), 0];
});

export default function () {
  return (
    <Plot id="sphere" x={[-1.3, 1.3]} y={[-1.3, 1.3]} z={[-1.3, 1.3]} xLabel="x" yLabel="y" zLabel="z" equal>
      <Fn id="surface" f={(u, v) => [Math.cos(u) * Math.cos(v), Math.sin(u) * Math.cos(v), Math.sin(v)]} u={[0, 2 * Math.PI]} v={[-Math.PI / 2, Math.PI / 2]} label="unit sphere" />
      <Shape id="equator" pts={equator} closed label="equator, z = 0" group="equator" />
    </Plot>
  );
}
```

Not checked: the figure has not been rendered in the app, and the 3D `[x, y, z]` form for `Shape` is taken from the figure spec. If the equator does not show on the sphere, check that form first.