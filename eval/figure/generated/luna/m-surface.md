The surface oscillates in both directions: its height is $z=\sin(x)\cos(y)$.

```figure
export default function () {
  return (
    <Plot x={[-Math.PI, Math.PI]} y={[-Math.PI, Math.PI]} z={[-1, 1]}
      xLabel="x" yLabel="y" zLabel="z">
      <Fn id="surface" f={(x, y) => Math.sin(x) * Math.cos(y)} />
    </Plot>
  );
}
```

