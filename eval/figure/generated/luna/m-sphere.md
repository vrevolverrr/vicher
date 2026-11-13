```figure
const equator = Array.from({ length: 65 }, (_, i) => {
  const u = (2 * Math.PI * i) / 64;
  return [Math.cos(u), Math.sin(u), 0];
});

export default function () {
  return (
    <Plot x={[-1, 1]} y={[-1, 1]} z={[-1, 1]} equal>
      <Fn
        f={(u, v) => [Math.cos(v) * Math.cos(u), Math.cos(v) * Math.sin(u), Math.sin(v)]}
        u={[0, 2 * Math.PI]}
        v={[-Math.PI / 2, Math.PI / 2]}
      />
      <Shape pts={equator} label="Equator" />
    </Plot>
  );
}
```

