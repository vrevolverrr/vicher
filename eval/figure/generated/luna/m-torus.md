A **torus** is a doughnut-shaped surface. With major radius $R=2$ and minor radius $r=0.5$, its tube is centered 2 units from the middle and has radius 0.5.

```figure
export default function () {
  return (
    <Plot id="torus" x={[-2.6, 2.6]} y={[-2.6, 2.6]} z={[-0.6, 0.6]}
      xLabel="x" yLabel="y" zLabel="z">
      <Fn
        id="surface"
        u={[0, 2 * Math.PI]}
        v={[0, 2 * Math.PI]}
        f={(u, v) => [
          (2 + 0.5 * Math.cos(v)) * Math.cos(u),
          (2 + 0.5 * Math.cos(v)) * Math.sin(u),
          0.5 * Math.sin(v)
        ]}
      />
    </Plot>
  );
}
```

