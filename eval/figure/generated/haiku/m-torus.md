Torus with $R = 2$ and $r = 0.5$, as a parametric surface: $x=(R+r\cos v)\cos u$, $y=(R+r\cos v)\sin u$, $z=r\sin v$, with $u,v\in[0,2\pi]$.

```figure
export default function () {
  const R = 2, r = 0.5;
  return (
    <Plot id="torus" x={[-2.5, 2.5]} y={[-2.5, 2.5]} z={[-0.6, 0.6]}
      xLabel="x" yLabel="y" zLabel="z" equal view={{ azimuth: 30, elevation: 25 }}>
      <Fn id="surface" label="torus" u={[0, 2 * Math.PI]} v={[0, 2 * Math.PI]}
        f={(u, v) => [(R + r * Math.cos(v)) * Math.cos(u), (R + r * Math.cos(v)) * Math.sin(u), r * Math.sin(v)]} />
    </Plot>
  );
}
```

Not checked: I did not render the figure, so confirm the pane shows a ring with a round hole.