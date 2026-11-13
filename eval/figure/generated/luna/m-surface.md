```figure
export default function () {
  return (
    <Plot id="surface" x={[-Math.PI, Math.PI]} y={[-Math.PI, Math.PI]} z={[-1, 1]} xLabel="x" yLabel="y" zLabel="z">
      <Fn id="wave" f={(x, y) => Math.sin(x) * Math.cos(y)} />
    </Plot>
  );
}
```

