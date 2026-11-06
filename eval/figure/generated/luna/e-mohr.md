I’ll plot normal stress horizontally and shear stress vertically, using the convention that the two face points are \((\sigma_x,\tau_{xy})\) and \((\sigma_y,-\tau_{xy})\).

The circle has center \(C=30\) MPa and radius \(R=\sqrt{50^2+30^2}\approx58.31\) MPa. Its principal stresses are approximately \(-28.31\) MPa and \(88.31\) MPa.

```figure
export default function () {
  return (
    <Plot id="mohr" x={[-40, 100]} y={[-65, 65]} equal
      xLabel="Normal stress, $\sigma$ (MPa)" yLabel="Shear stress, $\tau$ (MPa)">
      <Circle id="circle" at={[30, 0]} r={Math.sqrt(50 ** 2 + 30 ** 2)} />
      <Points id="x-face" pts={[[80, 30]]} label="x face: $(80, 30)$" />
      <Points id="y-face" pts={[[-20, -30]]} label="y face: $(-20, -30)$" />
      <Points id="center" pts={[[30, 0]]} label="center: $(30, 0)$" />
      <Points id="principal" pts={[[-28.31, 0], [88.31, 0]]} label="principal stresses" />
    </Plot>
  );
}
```

