Assuming a pin at **A**, a roller at **E**, and Pratt diagonals sloping toward the center, the member forces are below. **T** means tension and **C** means compression. Zero-force members are marked 0.

```figure
export default function () {
  return (
    <Diagram width={12} height={3}>
      <Segment from={[0, 0]} to={[3, 0]} />
      <Segment from={[3, 0]} to={[6, 0]} />
      <Segment from={[6, 0]} to={[9, 0]} />
      <Segment from={[9, 0]} to={[12, 0]} />
      <Segment from={[0, 3]} to={[3, 3]} />
      <Segment from={[3, 3]} to={[6, 3]} />
      <Segment from={[6, 3]} to={[9, 3]} />
      <Segment from={[9, 3]} to={[12, 3]} />
      <Segment from={[0, 0]} to={[0, 3]} />
      <Segment from={[3, 0]} to={[3, 3]} />
      <Segment from={[6, 0]} to={[6, 3]} />
      <Segment from={[9, 0]} to={[9, 3]} />
      <Segment from={[12, 0]} to={[12, 3]} />
      <Segment from={[0, 3]} to={[3, 0]} />
      <Segment from={[3, 3]} to={[6, 0]} />
      <Segment from={[9, 3]} to={[6, 0]} />
      <Segment from={[12, 3]} to={[9, 0]} />
      <Label at={[0, -0.25]} text="A" />
      <Label at={[3, -0.25]} text="B" />
      <Label at={[6, -0.25]} text="C" />
      <Label at={[9, -0.25]} text="D" />
      <Label at={[12, -0.25]} text="E" />
      <Label at={[0, 3.2]} text="a" />
      <Label at={[3, 3.2]} text="b" />
      <Label at={[6, 3.2]} text="c" />
      <Label at={[9, 3.2]} text="d" />
      <Label at={[12, 3.2]} text="e" />
    </Diagram>
  );
}
```

By symmetry and vertical equilibrium, the support reactions are $A_y=E_y=15$ kN; the horizontal reaction is zero. The diagonals are at $45^\circ$, so their horizontal and vertical components are equal.

| Members | Force |
|---|---:|
| Bottom chord AB, DE | 0 |
| Bottom chord BC, CD | 15 kN T |
| Top chord ab, de | 15 kN C |
| Top chord bc, cd | 20 kN C |
| Verticals Aa, Ee | 15 kN C |
| Verticals Bb, Dd | 5 kN C |
| Vertical Cc | 0 |
| Diagonals aB, eD | $15\sqrt{2}=21.21$ kN T |
| Diagonals bC, dC | $5\sqrt{2}=7.07$ kN T |

