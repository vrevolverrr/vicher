The shear force diagram shows how internal shear changes along the beam; the bending moment diagram shows how the beam bends under the load. For a 6 m simply supported beam with a 12 kN point load at distance \(a\) from the left support:

$$R_A = 12\frac{6-a}{6}, \qquad R_B = 12\frac{a}{6}$$

The shear is \(R_A\) before the load and \(-R_B\) after it, with a 12 kN drop at the load. The bending moment rises to its maximum under the load, then falls to zero at the right support.

With the slider at \(a=3\) m, each support carries 6 kN, and the maximum bending moment is \(6 \times 3 = 18\) kN·m.

```figure
export const params = {
  a: { label: 'Load position from A', min: 0, max: 6, step: 0.1, value: 3, unit: 'm' }
};

export default function ({ a }) {
  const P = 12;
  const L = 6;
  const RA = P * (L - a) / L;
  const RB = P * a / L;
  const Mmax = RA * a;

  return (
    <Column gap="md">
      <Diagram id="beam" width={6} height={1.5}>
        <Segment id="beamline" from={[0, 0]} to={[6, 0]} />
        <Shape id="supportA" pts={[[0, -0.2], [0.25, -0.2], [0.125, 0]]} closed label="A" />
        <Shape id="supportB" pts={[[5.75, -0.2], [6, -0.2], [5.875, 0]]} closed label="B" />
        <Vector id="load" from={[a, 1]} to={[a, 0.1]} label="12 kN" />
      </Diagram>
      <Row gap="md" align="center">
        <Plot id="sfd" x={[0, 6]} y={[-12, 12]} xLabel="Position x (m)" yLabel="Shear V (kN)">
          <Fn id="shearLeft" f={() => RA} from={0} to={a} label="V before load" />
          <Fn id="shearRight" f={() => -RB} from={a} to={6} />
          <Segment id="shearDrop" from={[a, RA]} to={[a, -RB]} />
        </Plot>
        <Plot id="bmd" x={[0, 6]} y={[0, 18]} xLabel="Position x (m)" yLabel="Moment M (kN·m)">
          <Fn id="moment" f={x => x <= a ? RA * x : RB * (6 - x)} label="M(x)" />
        </Plot>
      </Row>
      <Row gap="md">
        <Node id="reactionA" label={`${RA.toFixed(1)} kN`} sub="Reaction at A" />
        <Node id="reactionB" label={`${RB.toFixed(1)} kN`} sub="Reaction at B" />
        <Node id="maximumMoment" label={`${Mmax.toFixed(1)} kN·m`} sub="Maximum moment" />
      </Row>
    </Column>
  );
}
```

