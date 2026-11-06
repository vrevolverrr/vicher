```figure
export default function () {
  const eq = [];
  for (let k = 0; k < 120; k++) {
    const t = 2 * Math.PI * k / 120;
    eq.push([Math.cos(t), Math.sin(t), 0]);
  }
  return (
    <Plot id="sphere" x={[-1.2, 1.2]} y={[-1.2, 1.2]} z={[-1.2, 1.2]} xLabel="x" yLabel="y" zLabel="z" equal>
      <Fn id="surface" f={(u, v) => [Math.cos(u) * Math.sin(v), Math.sin(u) * Math.sin(v), Math.cos(v)]} u={[0, 2 * Math.PI]} v={[0, Math.PI]} label="unit sphere" />
      <Shape id="equator" pts={eq} closed label="equator: z = 0" />
    </Plot>
  );
}
```

The equator is where the sphere meets the plane $z = 0$, so its points satisfy $x^2 + y^2 = 1$ and $z = 0$.

Not checked: the figure was not rendered here. The equator is a closed polyline of 120 points, so it looks round but is not an exact circle.