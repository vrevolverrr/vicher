I’ll make the load position adjustable and plot both diagrams from the corresponding support reactions.

The slider moves the 12 kN load along the beam. The diagrams update with it: shear is constant between supports and the load, while bending moment rises to a peak directly under the load.

For a load at distance $a$ metres from the left support, the support reactions are:

$$
R_A = 12 - 2a \text{ kN}, \qquad R_B = 2a \text{ kN}
$$

The bending moment is zero at both supports and reaches $R_Aa = 2a(6-a)$ kN·m under the load. At the starting position $a=2.5$ m, the reactions are 7 kN and 5 kN, and the peak moment is 17.5 kN·m.

```figure
export const params = {
  a: { label: 'Load position from left support', min: 0, max: 6, step: 0.1, value: 2.5, unit: 'm' }
};

export default function ({ a }) {
  const RA = 12 - 2 * a;
  const RB = 2 * a;
  const peak = RA * a;

  return (
    <Column gap="md">
      <Row gap="md">
        <Node label={`${RA.toFixed(1)} kN`} sub="Left reaction $R_A$" />
        <Node label={`${RB.toFixed(1)} kN`} sub="Right reaction $R_B$" />
        <Node label={`${peak.toFixed(1)} kN·m`} sub="Peak moment" />
      </Row>
      <Text>**Shear force diagram**</Text>
      <Plot id="shear" x={[0, 6]} y={[-12, 12]} xLabel="Position along beam (m)" yLabel="Shear force (kN)">
        <Shape id="shear-zero" pts={[[0, 0], [6, 0]]} />
        <Shape id="shear-line" pts={[[0, RA], [a, RA], [a, -RB], [6, -RB]]} label="Shear force" />
        <Label at={[a, 11]} text={`Load at $x=${a.toFixed(1)}$ m`} />
      </Plot>
      <Text>**Bending moment diagram**</Text>
      <Plot id="moment" x={[0, 6]} y={[0, 20]} xLabel="Position along beam (m)" yLabel="Bending moment (kN·m)">
        <Shape id="moment-zero" pts={[[0, 0], [6, 0]]} />
        <Shape id="moment-line" pts={[[0, 0], [a, peak], [6, 0]]} label="Bending moment" />
        <Points id="moment-peak" pts={[[a, peak]]} label={`${peak.toFixed(1)} kN·m`} />
      </Plot>
    </Column>
  );
}
```

The shear jumps down by 12 kN at the load; the moment stays continuous and forms two straight segments.

