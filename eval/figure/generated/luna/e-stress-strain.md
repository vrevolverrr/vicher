A mild-steel curve rises elastically, reaches an upper yield point, drops to a lower yield point, then hardens until its maximum stress. After that, necking lowers the stress until fracture. This is a schematic; exact values vary.

```figure
export default function () {
  return (
    <Plot id="curve" x={[0, 25]} y={[0, 500]} xLabel="Strain (%)" yLabel="Stress (MPa)">
      <Shape
        id="steel-curve"
        label="Mild steel"
        pts={[
          [0, 0], [0.12, 240], [0.16, 310], [0.2, 260],
          [0.7, 260], [1.5, 260], [4, 285], [8, 350],
          [12, 415], [15, 460], [18, 445], [22, 400], [25, 350]
        ]}
      />
      <Points id="proportional-point" pts={[[0.12, 240]]} />
      <Label at={[0.12, 240]} text="Proportional limit" />
      <Points id="upper-yield-point" pts={[[0.16, 310]]} />
      <Label at={[0.16, 310]} text="Upper yield" />
      <Points id="lower-yield-point" pts={[[0.2, 260]]} />
      <Label at={[0.2, 260]} text="Lower yield" />
      <Points id="uts-point" pts={[[15, 460]]} />
      <Label at={[15, 460]} text="Ultimate tensile strength" />
      <Points id="fracture-point" pts={[[25, 350]]} />
      <Label at={[25, 350]} text="Fracture" />
    </Plot>
  );
}
```

The initial straight section is elastic; the near-flat section is yielding. The curve then rises through strain hardening to the ultimate tensile strength, before necking leads to fracture.

