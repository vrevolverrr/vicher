```figure
export default function () {
  return (
    <Plot
      id="torus"
      x={[-2.6, 2.6]}
      y={[-2.6, 2.6]}
      z={[-0.6, 0.6]}
      equal
    >
      <Fn
        id="surface"
        f={(u, v) => [
          (2 + 0.5 * Math.cos(v)) * Math.cos(u),
          (2 + 0.5 * Math.cos(v)) * Math.sin(u),
          0.5 * Math.sin(v)
        ]}
        u={[0, 2 * Math.PI]}
        v={[0, 2 * Math.PI]}
        label="Torus: major radius $2$, minor radius $0.5$"
      />
    </Plot>
  );
}
```

