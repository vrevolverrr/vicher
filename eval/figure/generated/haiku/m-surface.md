```figure
export default function () {
  return (
    <Plot id="surf" x={[-Math.PI, Math.PI]} y={[-Math.PI, Math.PI]} z={[-1.2, 1.2]} xLabel="x" yLabel="y" zLabel="z" view={{ azimuth: 35, elevation: 30 }}>
      <Fn id="s" f={(x, y) => Math.sin(x) * Math.cos(y)} label="$z = \sin x \cos y$" />
    </Plot>
  );
}
```

The surface is drawn over $x, y \in [-\pi, \pi]$. Drag to turn it. It has peaks and troughs of height ±1 in a grid pattern.