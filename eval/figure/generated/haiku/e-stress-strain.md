```figure
const KEY = [
  { id: 'A', e: 0.00125, s: 250 },
  { id: 'B', e: 0.0018, s: 300 },
  { id: 'C', e: 0.002, s: 250 },
  { id: 'D', e: 0.012, s: 250 },
  { id: 'E', e: 0.15, s: 450 },
  { id: 'F', e: 0.22, s: 400 },
];

const curve = [[0, 0], [0.00125, 250], [0.0018, 300], [0.002, 250], [0.012, 250]];
for (let i = 1; i <= 40; i++) {
  const t = i / 40;
  curve.push([0.012 + 0.138 * t, 250 + 200 * (1 - Math.exp(-3 * t)) / (1 - Math.exp(-3))]);
}
for (let i = 1; i <= 20; i++) {
  const d = 0.07 * i / 20;
  curve.push([0.15 + d, 450 - 50 * (d / 0.07) ** 2]);
}

export default function () {
  return (
    <Row gap="lg" align="start">
      <Panel title="Full curve">
        <Plot id="full" x={[0, 0.25]} y={[0, 500]} xLabel="Strain ε" yLabel="Stress σ (MPa)">
          <Shape id="curve" pts={curve} />
          <Points id="pts-full" pts={KEY.map(k => [k.e, k.s])} />
          <Label id="lbl-D" at={[0.012, 215]} text="D" />
          <Label id="lbl-E" at={[0.085, 485]} text="E  UTS, 450 MPa" />
          <Label id="lbl-F" at={[0.19, 360]} text="F  fracture" />
        </Plot>
      </Panel>
      <Panel title="Zoom: elastic and yield region">
        <Plot id="zoom" x={[0, 0.025]} y={[0, 350]} xLabel="Strain ε" yLabel="Stress σ (MPa)">
          <Shape id="curve-z" pts={curve.filter(p => p[0] <= 0.025)} />
          <Points id="pts-zoom" pts={KEY.map(k => [k.e, k.s])} />
          <Label id="z-A" at={[0.0006, 265]} text="A" />
          <Label id="z-B" at={[0.0014, 322]} text="B" />
          <Label id="z-C" at={[0.0024, 240]} text="C" />
          <Label id="z-lB" at={[0.003, 335]} text="B  upper yield, 300 MPa" />
          <Label id="z-lC" at={[0.003, 315]} text="C  lower yield, 250 MPa" />
          <Label id="z-lA" at={[0.003, 295]} text="A  proportional limit, 250 MPa" />
          <Label id="z-lD" at={[0.0125, 225]} text="D  hardening starts" />
        </Plot>
      </Panel>
    </Row>
  );
}
```

A stress-strain curve plots how hard a bar pulls back, the **stress** σ, against how far it stretches, the **strain** ε. Mild steel has a straight start, a flat yield, a climb, a neck, then a break.

The straight start obeys Hooke's law, σ = Eε, where E is Young's modulus, the slope of the line from O to A:

$$\sigma = E\,\varepsilon$$

Worked example at point A: E = 250 / 0.00125 = 200 000 MPa = 200 GPa, the usual value for steel.

| Point | Key point | Strain ε | Stress σ (MPa) | What happens |
|---|---|---|---|---|
| A | Proportional limit | 0.00125 | 250 | Stress and strain stop being proportional above this point. |
| B | Upper yield point | 0.0018 | 300 | Yielding starts. Stress peaks. |
| C | Lower yield point | 0.002 | 250 | Stress drops to a steady level. The yield plateau begins. |
| D | Start of strain hardening | 0.012 | 250 | The steel resists more, and stress rises again. |
| E | Ultimate tensile strength | 0.15 | 450 | Highest stress. Necking starts. |
| F | Fracture | 0.22 | 400 | The bar breaks. |

The elastic limit lies just above A, so this figure treats the two as one point. These are typical textbook values. Exact numbers vary by steel grade.