Assuming a pin at the left end, a roller at the right, and Pratt diagonals sloping toward the centre, the support reactions are $15$ kN upward at each end. By symmetry, the horizontal reaction is zero. With 3 m panels and a 3 m truss height, each diagonal is at $45^\circ$.

```figure
export default function () {
  return (
    <Diagram width={12} height={4}>
      <Segment from={[0, 0]} to={[3, 0]} label="0" />
      <Segment from={[3, 0]} to={[6, 0]} label="15 T" />
      <Segment from={[6, 0]} to={[9, 0]} label="15 T" />
      <Segment from={[9, 0]} to={[12, 0]} label="0" />

      <Segment from={[0, 3]} to={[3, 3]} label="15 C" />
      <Segment from={[3, 3]} to={[6, 3]} label="20 C" />
      <Segment from={[6, 3]} to={[9, 3]} label="20 C" />
      <Segment from={[9, 3]} to={[12, 3]} label="15 C" />

      <Segment from={[0, 0]} to={[0, 3]} label="15 C" />
      <Segment from={[3, 0]} to={[3, 3]} label="5 C" />
      <Segment from={[6, 0]} to={[6, 3]} label="0" />
      <Segment from={[9, 0]} to={[9, 3]} label="5 C" />
      <Segment from={[12, 0]} to={[12, 3]} label="15 C" />

      <Segment from={[0, 3]} to={[3, 0]} label="21.2 T" />
      <Segment from={[3, 3]} to={[6, 0]} label="7.07 T" />
      <Segment from={[9, 3]} to={[6, 0]} label="7.07 T" />
      <Segment from={[12, 3]} to={[9, 0]} label="21.2 T" />

      <Points pts={[[0, 0], [3, 0], [6, 0], [9, 0], [12, 0], [0, 3], [3, 3], [6, 3], [9, 3], [12, 3]]} />
    </Diagram>
  );
}
```

Member forces, in kN:

| Member | Force |
|---|---:|
| Bottom chord, left end panel | 0 |
| Bottom chord, two middle panels | 15 T each |
| Bottom chord, right end panel | 0 |
| Top chord, two end panels | 15 C each |
| Top chord, two middle panels | 20 C each |
| End verticals | 15 C each |
| Inner verticals beside centre | 5 C each |
| Centre vertical | 0 |
| End diagonals | 21.2 T each |
| Inner diagonals | 7.07 T each |

Here, **T** means tension and **C** means compression. The end diagonal force is $15/\sin 45^\circ = 21.2$ kN; the inner diagonal force is $5/\sin 45^\circ = 7.07$ kN.

