```figure
const pts = [[0, 0], [0.00125, 250], [0.0018, 285], [0.0022, 250]];
for (let i = 1; i <= 20; i++) pts.push([0.0022 + (0.012 - 0.0022) * i / 20, 250]);
for (let i = 1; i <= 60; i++) {
  const e = 0.012 + (0.18 - 0.012) * i / 60;
  pts.push([e, 250 + 150 * (1 - Math.exp(-(e - 0.012) / 0.05))]);
}
for (let i = 1; i <= 20; i++) pts.push([0.18 + 0.07 * i / 20, 395 - 65 * i / 20]);

const marks = [
  { id: 'A', name: 'Proportional limit', e: 0.00125, s: 250 },
  { id: 'B', name: 'Upper yield point', e: 0.0018, s: 285 },
  { id: 'C', name: 'Lower yield point', e: 0.0022, s: 250 },
  { id: 'D', name: 'Start of strain hardening', e: 0.012, s: 250 },
  { id: 'E', name: 'Ultimate tensile strength', e: 0.18, s: 395 },
  { id: 'F', name: 'Fracture', e: 0.25, s: 330 }
];

export default function () {
  return (
    <Row gap="lg" align="center">
      <Plot id="curve" x={[0, 0.28]} y={[0, 450]} xLabel="Strain, ε" yLabel="Stress, σ (MPa)">
        <Shape id="curve-line" pts={pts} label="Mild steel" />
        {marks.map(m => <Points id={m.id} pts={[[m.e, m.s]]} label={m.id} />)}
      </Plot>
      <Table id="marks" columns={['Point', 'Key point', 'Strain ε', 'Stress σ (MPa)']}
        rows={marks.map(m => [m.id, m.name, m.e, m.s])} />
    </Row>
  );
}
```

Regions, left to right:
- 0 to A: elastic. Stress and strain are proportional. Slope is E ≈ 200 GPa.
- A to C: yield. Stress peaks at B, then drops to C.
- C to D: yield plateau. Strain grows at constant stress.
- D to E: strain hardening. Stress rises to the UTS.
- E to F: necking. Stress falls until fracture.

The values are typical for low-carbon structural steel. The exact numbers change with grade.