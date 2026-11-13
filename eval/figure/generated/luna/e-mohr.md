Using positive shear upward, the two stress points are \(A=(\sigma_x,\tau_{xy})=(80,30)\) and \(B=(\sigma_y,-\tau_{xy})=(-20,-30)\), in MPa. The circle’s center is at \((30,0)\), and its radius is about \(58.3\) MPa.

```figure
const cx = 30;
const R = Math.sqrt(50 ** 2 + 30 ** 2);

export default function () {
  return (
    <Plot id="mohr" x={[-40, 100]} y={[-70, 70]}
      xLabel="Normal stress, σ (MPa)" yLabel="Shear stress, τ (MPa)">
      <Fn id="upper" f={x => Math.sqrt(Math.max(0, R ** 2 - (x - cx) ** 2))}
        from={cx - R} to={cx + R} label="Mohr circle" />
      <Fn id="lower" f={x => -Math.sqrt(Math.max(0, R ** 2 - (x - cx) ** 2))}
        from={cx - R} to={cx + R} />
      <Points id="xpoint" pts={[[80, 30]]} label="A: (80, 30)" />
      <Points id="ypoint" pts={[[-20, -30]]} label="B: (−20, −30)" />
      <Points id="center" pts={[[30, 0]]} label="C: (30, 0)" />
    </Plot>
  );
}
```

The principal stresses are the circle’s horizontal intercepts, approximately \(88.3\) MPa and \(-28.3\) MPa. The maximum shear stress is the radius, approximately \(58.3\) MPa.

