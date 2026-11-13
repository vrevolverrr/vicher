Drag the slider to move the 12 kN load. Both diagrams and the reactions update.

```figure
export const params = {
  a: { label: 'Load position from support A', min: 0, max: 6, step: 0.1, value: 3, unit: 'm' }
};

export default function ({ a }) {
  const L = 6, P = 12, b = L - a;
  const RA = P * b / L, RB = P * a / L, Mmax = P * a * b / L;
  return (
    <Column gap="md">
      <Diagram id="beam" width={6} height={1.6}>
        <Segment id="span" from={[0, 0.6]} to={[6, 0.6]} />
        <Shape id="supA" pts={[[0, 0.6], [-0.25, 0.2], [0.25, 0.2]]} closed />
        <Shape id="supB" pts={[[6, 0.6], [5.75, 0.2], [6.25, 0.2]]} closed />
        <Label at={[0, 0.05]} text="A" />
        <Label at={[6, 0.05]} text="B" />
        <Vector id="load" from={[a, 1.5]} to={[a, 0.6]} label="12 kN" />
      </Diagram>
      <Row gap="lg" align="start">
        <Panel title="Shear force V (kN)">
          <Plot id="sfd" x={[0, 6]} y={[-14, 14]} xLabel="x (m)" yLabel="V">
            <Segment id="zero" from={[0, 0]} to={[6, 0]} />
            <Shape id="V" pts={[[0, RA], [a, RA], [a, -RB], [6, -RB]]} />
            <Label at={[0, RA]} text={`${RA.toFixed(1)} kN`} />
            <Label at={[6, -RB]} text={`-${RB.toFixed(1)} kN`} />
          </Plot>
        </Panel>
        <Panel title="Bending moment M (kN·m)">
          <Plot id="bmd" x={[0, 6]} y={[0, 20]} xLabel="x (m)" yLabel="M">
            <Shape id="M" pts={[[0, 0], [a, Mmax], [6, 0]]} />
            <Points id="peak" pts={[[a, Mmax]]} label={`${Mmax.toFixed(1)} kN·m`} />
          </Plot>
        </Panel>
      </Row>
      <Text>{`Reactions: $R_A = Pb/L = ${RA.toFixed(2)}$ kN and $R_B = Pa/L = ${RB.toFixed(2)}$ kN, with $a = ${a.toFixed(1)}$ m and $b = ${b.toFixed(1)}$ m. Peak moment: $M_{max} = Pab/L = ${Mmax.toFixed(2)}$ kN·m, always under the load.`}</Text>
    </Column>
  );
}
```

At midspan (a = 3 m): R_A = R_B = 6 kN. V jumps from +6 kN to -6 kN at the load. M_max = 18 kN·m under the load.

Sign convention: M is plotted positive up (sagging). V is positive when the left part has an upward force.

Not checked: I did not render the figure here, so the layout is untested. The peak moment formula holds only for a single point load on a simply supported span.