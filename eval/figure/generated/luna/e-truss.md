Assume pin and roller supports at the end bottom joints, and Pratt diagonals slant toward the center at the bottom. By symmetry, the vertical reactions are 15 kN each; the horizontal reaction is zero.

```figure
export default function () {
  const bottom = [[0, 0], [3, 0], [6, 0], [9, 0], [12, 0]];
  const top = [[0, 3], [3, 3], [6, 3], [9, 3], [12, 3]];
  return (
    <Diagram width={12} height={3.5}>
      {bottom.slice(0, 4).map((p, i) => <Segment id={`bc${i}`} from={p} to={bottom[i + 1]} />)}
      {top.slice(0, 4).map((p, i) => <Segment id={`tc${i}`} from={p} to={top[i + 1]} />)}
      {bottom.map((p, i) => <Segment id={`v${i}`} from={p} to={top[i]} />)}
      {[[0, 1], [1, 2], [4, 3], [3, 2]].map(([u, b], i) =>
        <Segment id={`d${i}`} from={top[u]} to={bottom[b]} />
      )}
      {bottom.map((p, i) => <Label at={[p[0], -0.25]} text={`$B_${i}$`} />)}
      {top.map((p, i) => <Label at={[p[0], 3.25]} text={`$U_${i}$`} />)}
      {[1, 2, 3].map(i => <Label at={[bottom[i][0], -0.65]} text="10 kN ↓" />)}
    </Diagram>
  );
}
```

**Member forces** (T = tension, C = compression; forces in kN):

| Member family | Members and forces |
|---|---|
| Top chord | $U_0U_1$: 15 C; $U_1U_2$: 20 C; $U_2U_3$: 20 C; $U_3U_4$: 15 C |
| Bottom chord | $B_0B_1$: 0; $B_1B_2$: 15 T; $B_2B_3$: 15 T; $B_3B_4$: 0 |
| Verticals | $B_0U_0$: 15 C; $B_1U_1$: 5 C; $B_2U_2$: 0; $B_3U_3$: 5 C; $B_4U_4$: 15 C |
| Diagonals | $U_0B_1$: $15\sqrt2 \approx 21.21$ T; $U_1B_2$: $5\sqrt2 \approx 7.07$ T; $U_3B_2$: $5\sqrt2 \approx 7.07$ T; $U_4B_3$: $15\sqrt2 \approx 21.21$ T |

The zero-force members carry no axial force for this loading.

