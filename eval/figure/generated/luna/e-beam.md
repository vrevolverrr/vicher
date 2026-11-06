For a load at distance $a$ from the left support, the support reactions are $R_A=12(6-a)/6$ and $R_B=12a/6$ kN. The diagrams below update as you move the load. Positive shear is plotted upward; the bending moment is sagging.

```figure
export const params = {
  a: { label: 'Load position from left support', min: 0, max: 6, step: 0.1, value: 3, unit: 'm' }
};

export default function ({ a }) {
  const ra = 12 * (6 - a) / 6;
  const rb = 12 * a / 6;
  const m = ra * a;

  return (
    <Row gap="lg" align="center">
      <Plot x={[0, 6]} y={[-12, 12]} xLabel="Position along beam (m)" yLabel="Shear force (kN)" equal={false}>
        <Shape pts={[[0, ra], [a, ra], [a, -rb], [6, -rb]]} label="Shear force" />
      </Plot>
      <Plot x={[0, 6]} y={[0, 18]} xLabel="Position along beam (m)" yLabel="Bending moment (kN·m)" equal={false}>
        <Shape pts={[[0, 0], [a, m], [6, 0]]} label="Bending moment" />
      </Plot>
    </Row>
  );
}
```

At the starting position of 3 m, each reaction is 6 kN and the peak moment is 18 kN·m.

