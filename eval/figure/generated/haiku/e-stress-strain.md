A stress-strain curve shows how hard a steel bar pulls back as you stretch it, from the first load to the break. You get it from a tensile test: pull a standard bar and record the force and the length.

The curve plots two ratios:

$$\sigma = \frac{F}{A_0}$$

$$\varepsilon = \frac{\Delta L}{L_0}$$

Here $\sigma$ is stress in MPa (N/mm²), $F$ is force in N, and $A_0$ is the original cross-section in mm². $\varepsilon$ is strain, the extension $\Delta L$ over the original length $L_0$. It has no unit, but is often shown as a percentage.

In the elastic part of the curve, stress and strain follow Hooke's law:

$$\sigma = E\varepsilon$$

$E$ is Young's modulus, the stiffness of the steel. For mild steel, $E \approx 200$ GPa.

```figure
const pts = [[0, 0], [0.125, 250], [0.15, 280], [0.2, 250], [2, 250]];
const hard = Array.from({ length: 27 }, (_, i) => 2 + i * 0.5).map(x => [x, 400 - 150 * ((15 - x) / 13) ** 2]);
const neck = Array.from({ length: 15 }, (_, i) => 15 + (i + 1) * 0.5).map(x => [x, 400 - 70 * ((x - 15) / 7) ** 2]);
const curve = [...pts, ...hard, ...neck];
const key = [[0.125, 250], [0.15, 280], [0.2, 250], [2, 250], [15, 400], [22, 330]];

export default function () {
  return (
    <Plot id="ss" x={[0, 25]} y={[0, 450]} xLabel="Strain $\varepsilon$ (%)" yLabel="Stress $\sigma$ (MPa)">
      <Shape pts={curve} label="Mild steel" />
      <Points pts={key} />
      <Label at={[1.0, 300]} text="**1, 2, 3** at 0.1 to 0.2 %" />
      <Label at={[0.6, 140]} text="Elastic: $\sigma = E\varepsilon$" />
      <Label at={[2.3, 215]} text="**4** hardening starts" />
      <Label at={[15, 420]} text="**5** UTS, 400 MPa" />
      <Label at={[19, 350]} text="Necking" />
      <Label at={[22, 305]} text="**6** fracture" />
    </Plot>
  );
}
```

| # | Point | Strain (%) | Stress (MPa) | What happens |
|---|---|---|---|---|
| 1 | Proportional limit | 0.125 | 250 | Hooke's law fails above this |
| 2 | Upper yield point | 0.15 | 280 | Peak stress as yielding starts |
| 3 | Lower yield point | 0.2 | 250 | Stress drops, then stays nearly flat |
| 4 | Start of strain hardening | 2 | 250 | Plateau ends; stress rises again |
| 5 | Ultimate tensile strength | 15 | 400 | Highest engineering stress |
| 6 | Fracture | 22 | 330 | Bar breaks after necking |

Points 1 to 3 sit so close that they overlap on the plot. The elastic limit is also close to point 1, so treat them as one for this sketch.

**Worked example.** A bar has $A_0 = 100$ mm² and $L_0 = 200$ mm. Load it to $F = 25$ kN.

1. Stress: $\sigma = \dfrac{25\,000}{100} = 250$ MPa
2. Strain: $\varepsilon = \dfrac{\sigma}{E} = \dfrac{250}{200\,000} = 0.00125$, which is 0.125 %
3. Extension: $\Delta L = \varepsilon L_0 = 0.00125 \times 200 = 0.25$ mm

This bar sits at point 1. Past point 1, the line bends and Hooke's law no longer holds.

Not checked: how the labels sit in your viewer. The numbers are typical textbook values, not those of a specific steel grade.