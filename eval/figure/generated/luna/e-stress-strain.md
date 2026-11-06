A mild steel stress–strain curve shows a straight elastic region, a yield plateau, strain hardening, then necking before fracture. Here is a schematic curve; the exact values vary by steel sample.

```figure
export default function () {
  return (
    <Plot id="steel-curve" x={[0, 30]} y={[0, 600]}
      xLabel="Engineering strain (%)" yLabel="Engineering stress (MPa)">
      <Shape id="curve" pts={[
        [0, 0], [0.2, 200], [0.35, 250], [0.5, 300],
        [0.8, 270], [2, 270], [5, 300], [10, 370],
        [15, 450], [20, 420], [25, 360]
      ]} />
      <Points id="key-points" pts={[
        [0.2, 200], [0.35, 250], [0.5, 300],
        [0.8, 270], [15, 450], [25, 360]
      ]} />
      <Label at={[0.2, 200]} text="P" />
      <Label at={[0.35, 250]} text="E" />
      <Label at={[0.5, 300]} text="UY" />
      <Label at={[0.8, 270]} text="LY" />
      <Label at={[15, 450]} text="UTS" />
      <Label at={[25, 360]} text="F" />
    </Plot>
  );
}
```

P is the proportional limit, where stress stops increasing linearly with strain. E is the elastic limit. UY and LY are the upper and lower yield points, where steel begins to deform permanently. After the yield plateau, strain hardening raises the stress to the ultimate tensile strength (UTS). Necking then reduces the engineering stress until fracture (F).

