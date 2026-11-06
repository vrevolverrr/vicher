I’ll show a schematic engineering stress–strain curve and label the standard points; the exact values vary by steel grade and test conditions.

A mild-steel curve starts with a straight elastic region, then reaches a yield plateau, rises through strain hardening to its maximum stress, and falls as the specimen necks before fracture. The points below are schematic; actual values vary by steel grade and test conditions.

Engineering stress is load divided by the specimen’s original cross-sectional area:

$$\sigma = \frac{F}{A_0}$$

Engineering strain is extension divided by the original gauge length:

$$\varepsilon = \frac{\Delta L}{L_0}$$

Here, $F$ is the applied load, $A_0$ is original area, $\Delta L$ is the extension, and $L_0$ is original gauge length. The curve shows that after the lower yield point, strain can increase at nearly constant stress; later, stress rises to the ultimate tensile strength (UTS), then drops during necking.

```figure
const data = [
  [0, 0],
  [0.12, 200],
  [0.15, 225],
  [0.2, 250],
  [0.3, 230],
  [2, 230],
  [5, 260],
  [10, 320],
  [18, 420],
  [22, 390],
  [28, 330]
];

function stress(x) {
  for (let i = 1; i < data.length; i++) {
    const [x1, y1] = data[i - 1];
    const [x2, y2] = data[i];
    if (x <= x2) return y1 + (y2 - y1) * (x - x1) / (x2 - x1);
  }
  return data[data.length - 1][1];
}

export default function () {
  const points = [
    [0.12, 200],
    [0.15, 225],
    [0.2, 250],
    [0.3, 230],
    [18, 420],
    [28, 330]
  ];

  return (
    <Plot x={[0, 30]} y={[0, 450]} xLabel="Engineering strain (%)" yLabel="Engineering stress (MPa)">
      <Fn f={x => stress(x)} from={0} to={28} label="Mild steel (schematic)" />
      <Points pts={points} />
      <Label at={[2, 185]} text="Proportional limit" />
      <Label at={[2, 215]} text="Elastic limit" />
      <Label at={[2, 270]} text="Upper yield point" />
      <Label at={[3.5, 205]} text="Lower yield point" />
      <Label at={[8, 245]} text="Yield plateau" />
      <Label at={[18, 435]} text="UTS" />
      <Label at={[27, 345]} text="Fracture" />
    </Plot>
  );
}
```

