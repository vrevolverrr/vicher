Drag the slider to move the 12 kN load. The default is a = 2 m from support A.

```figure
export const params = { a: { label: 'Load position a', min: 0, max: 6, step: 0.1, value: 2, unit: 'm' } };

export default function ({ a }) {
  const L = 6;          // span, m
  const P = 12;         // point load, kN
  const RA = P * (L - a) / L;
  const RB = P * a / L;
  const Mmax = P * a * (L - a) / L;
  const x0 = 0.5;       // left end of the beam in the sketch
  const X = x0 + a;     // load position in the sketch

  return (
    <Figure
      steps={[{ a }]}
      title="Simply supported beam, 12 kN point load at distance a from A"
      render={() => (
        <Column gap="md">
          <Diagram id="beam" width={7} height={3}>
            <Segment id="span" from={[x0, 1.2]} to={[x0 + L, 1.2]} />
            <Shape id="pinA" pts={[[x0, 1.2], [x0 - 0.3, 0.7], [x0 + 0.3, 0.7]]} closed />
            <Shape id="rollerB" pts={[[x0 + L, 1.2], [x0 + L - 0.3, 0.7], [x0 + L + 0.3, 0.7]]} closed />
            <Vector id="load" from={[X, 2.6]} to={[X, 1.2]} label={`$P = ${P}$ kN`} />
            <Label at={[x0, 0.3]} text={`$R_A = ${RA}$ kN`} />
            <Label at={[x0 + L, 0.3]} text={`$R_B = ${RB}$ kN`} />
          </Diagram>
          <Plot id="shear" x={[0, L]} y={[-P, P]} xLabel="$x$ (m)" yLabel="$V$ (kN)">
            <Shape id="V" pts={[[0, RA], [a, RA], [a, RA - P], [L, RA - P]]} label="V" />
          </Plot>
          <Plot id="moment" x={[0, L]} y={[0, 20]} xLabel="$x$ (m)" yLabel="$M$ (kN m)">
            <Shape id="M" pts={[[0, 0], [a, Mmax], [L, 0]]} label="M" />
            <Points id="peak" pts={[[a, Mmax]]} />
            <Label at={[a, Mmax + 1]} text={`$${Mmax}$ kN m`} />
          </Plot>
        </Column>
      )}
    />
  );
}
```

Shear force $V$ is the internal force across a section, in kN. Bending moment $M$ is the internal turning effect at a section, in kN m. Both come from cutting the beam at a point and summing the forces on one side. Here $V$ is positive when the left-hand reaction pushes up on the left part.

Let the load $P$ sit at distance $a$ from support A, and $b = L - a$ from B. The reactions are:

$$R_A = \frac{Pb}{L}$$

$$R_B = \frac{Pa}{L}$$

Shear is $V = R_A$ from A to the load. At the load it drops by $P$, so $V = -R_B$ from the load to B. Moment rises in a straight line from zero at A to a peak under the load, then falls in a straight line to zero at B:

$$M_{max} = \frac{Pab}{L}$$

Worked example, with $a = 2$ m, $b = 4$ m, $P = 12$ kN:

- $R_A = 12 \times 4 / 6 = 8$ kN and $R_B = 12 \times 2 / 6 = 4$ kN. Check: $8 + 4 = 12$ kN.
- Shear: $+8$ kN from A to the load, then $8 - 12 = -4$ kN to B.
- Moment under the load: $M = 8 \times 2 = 16$ kN m. At B: $4 \times 0 = 0$. Check with $Pab/L = 12 \times 2 \times 4 / 6 = 16$ kN m.

The peak moment is largest when the load is at midspan. At $a = 3$ m, $M_{max} = 12 \times 3 \times 3 / 6 = 18$ kN m.

These rules hold for one point load and no other loads on the beam.

Not checked: the figure has not been rendered here. Skipped: distributed loads and overhangs.