Drag the **load position a** slider in the figure. The shear force and bending moment diagrams update with it.

**Shear force** $V$ is the net vertical force on one side of a cut. **Bending moment** $M$ is the net turning effect of those forces about the cut. Both change along the beam.

A simply supported beam has a pin at A and a roller at B, so both supports push up. For a point load $P$ at distance $a$ from A on a span $L$:

$$R_A = \frac{P(L-a)}{L}$$

$$R_B = \frac{Pa}{L}$$

For a cut at distance $x$ from A:

$$V(x) = \begin{cases} R_A & 0 \le x < a \\ -R_B & a < x \le L \end{cases}$$

$$M(x) = \begin{cases} R_A\,x & 0 \le x \le a \\ R_B\,(L-x) & a \le x \le L \end{cases}$$

The shear jumps by $P$ at the load, and the moment peaks there: $M_{max} = Pa(L-a)/L$. With $P = 12$ kN and $L = 6$ m, the peak is largest at midspan: 18 kN·m when $a = 3$ m.

**Worked example, $a = 2$ m:**

1. Reactions: $R_A = 12 \cdot 4/6 = 8$ kN and $R_B = 12 \cdot 2/6 = 4$ kN. Check: $8 + 4 = 12$ kN.
2. Shear: $V = +8$ kN from 0 to 2 m, then $8 - 12 = -4$ kN from 2 to 6 m.
3. Moment: $M(2) = 8 \cdot 2 = 16$ kN·m. From the right: $4 \cdot 4 = 16$ kN·m. Both sides agree, and $M = 0$ at both supports.

The figure draws moment upward. Many texts draw it below the axis, so follow your course's convention.

These formulas assume one vertical point load. A distributed load changes both curves.

Not covered: beam self-weight and a second load. I did not render the figure, so the slider is untested here.

```figure
export const params = { a: { label: 'Load position a', min: 0, max: 6, step: 0.1, value: 2, unit: 'm' } };

export default function ({ a }) {
  const L = 6, P = 12;
  const RA = P * (L - a) / L;
  const RB = P * a / L;
  const M = P * a * (L - a) / L;
  const fmt = v => String(Math.round(v * 100) / 100);
  const bx = x => x + 0.5;

  return (
    <Column gap="md">
      <Diagram id="beam" width={7} height={2.4}>
        <Segment id="span" from={[bx(0), 1]} to={[bx(L), 1]} />
        <Shape id="supA" pts={[[bx(0) - 0.3, 0.2], [bx(0) + 0.3, 0.2], [bx(0), 1]]} closed />
        <Shape id="supB" pts={[[bx(L) - 0.3, 0.2], [bx(L) + 0.3, 0.2], [bx(L), 1]]} closed />
        <Vector id="load" from={[bx(a), 2.2]} to={[bx(a), 1.1]} label={`${fmt(P)} kN`} />
      </Diagram>
      <Row gap="md">
        <Node id="ra" label={`${fmt(RA)} kN`} sub="$R_A$, left support" />
        <Node id="rb" label={`${fmt(RB)} kN`} sub="$R_B$, right support" />
        <Node id="mm" label={`${fmt(M)} kN·m`} sub="peak moment" />
      </Row>
      <Plot id="sf" x={[0, L]} y={[-13, 13]} xLabel="$x$ (m)" yLabel="$V$ (kN)">
        <Shape id="v" pts={[[0, RA], [a, RA], [a, -RB], [L, -RB]]} label="$V$" />
      </Plot>
      <Plot id="bm" x={[0, L]} y={[0, 20]} xLabel="$x$ (m)" yLabel="$M$ (kN·m)">
        <Shape id="m" pts={[[0, 0], [a, M], [L, 0]]} label="$M$" />
        <Points id="peak" pts={[[a, M]]} label={`${fmt(M)} kN·m`} />
      </Plot>
    </Column>
  );
}
```