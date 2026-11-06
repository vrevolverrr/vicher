```figure
export default function () {
  return (
    <Plot id="torus" x={[-2.5, 2.5]} y={[-2.5, 2.5]} z={[-0.5, 0.5]} equal view={{ azimuth: 35, elevation: 25 }}>
      <Fn
        id="surface"
        f={(u, v) => [(2 + 0.5 * Math.cos(v)) * Math.cos(u), (2 + 0.5 * Math.cos(v)) * Math.sin(u), 0.5 * Math.sin(v)]}
        u={[0, 2 * Math.PI]}
        v={[0, 2 * Math.PI]}
        label="Torus ($R=2$, $r=0.5$)"
      />
    </Plot>
  );
}
```

