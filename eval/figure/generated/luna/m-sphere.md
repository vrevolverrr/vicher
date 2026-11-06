The unit sphere is the set of points one unit from the origin. Its equator is the circle where the sphere meets the plane $z=0$.

```figure
export default function () {
  return (
    <Figure steps={[{}]} render={() => (
      <Plot id="sphere-plot" x={[-1.2, 1.2]} y={[-1.2, 1.2]} z={[-1.2, 1.2]} equal>
        <Fn id="unit-sphere" u={[0, 2 * Math.PI]} v={[-Math.PI / 2, Math.PI / 2]}
          f={(u, v) => [Math.cos(v) * Math.cos(u), Math.cos(v) * Math.sin(u), Math.sin(v)]}
          group="sphere" />
        <Circle id="equator" at={[0, 0, 0]} r={1} group="equator" />
      </Plot>
    )} />
  );
}
```

