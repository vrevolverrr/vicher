```figure
export default function () {
  return (
    <Plot x={[-Math.PI, Math.PI]} y={[-Math.PI, Math.PI]} z={[-1, 1]} xLabel="x" yLabel="y" zLabel="z" view={{ azimuth: 30, elevation: 25 }}>
      <Fn id="surface" f={(x, y) => Math.sin(x) * Math.cos(y)} />
    </Plot>
  );
}
```

Drag the figure to turn it. The maximum, $z = 1$, is at $(\pi/2, 0)$. The minimum, $z = -1$, is at $(-\pi/2, 0)$ and $(\pi/2, \pm\pi)$.