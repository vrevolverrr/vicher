```figure
const equator = Array.from({ length: 65 }, (_, i) => {
  const angle = (2 * Math.PI * i) / 64;
  return [Math.cos(angle), Math.sin(angle), 0];
});

export default function () {
  return (
    <Plot x={[-1.2, 1.2]} y={[-1.2, 1.2]} z={[-1.2, 1.2]} equal>
      <Fn
        id="sphere"
        f={(u, v) => [
          Math.cos(u) * Math.cos(v),
          Math.sin(u) * Math.cos(v),
          Math.sin(v),
        ]}
        u={[0, 2 * Math.PI]}
        v={[-Math.PI / 2, Math.PI / 2]}
        label="Unit sphere"
      />
      <Shape pts={equator} closed label="Equator" />
    </Plot>
  );
}
```

