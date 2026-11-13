Shade the part of circle A that lies outside circle B. That region is $A \cap B^c$.

In simple words, $B^c$ (the complement of B) is everything in the universe $U$ that is not in B. Intersecting that with A keeps only the points that are in A and not in B.

**Example:** $U=\{1,\dots,8\}$, $A=\{1,2,3,4,5\}$, $B=\{4,5,6,7\}$.
- $B^c=\{1,2,3,8\}$
- $A \cap B^c=\{1,2,3\}$

The elements 4 and 5 are in both sets, so they are not shaded.

```figure
const R = 1.6, cA = -0.8, cB = 0.8, h = 0.2;

export default function () {
  const inA = (x, y) => (x - cA) ** 2 + y ** 2 <= R * R;
  const inB = (x, y) => (x - cB) ** 2 + y ** 2 <= R * R;
  const cells = [];
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 16; j++) {
      const x0 = -2.4 + i * h, y0 = -1.6 + j * h;
      const mx = x0 + h / 2, my = y0 + h / 2;
      if (inA(mx, my) && !inB(mx, my)) cells.push({ id: `c${i}-${j}`, x0, x1: x0 + h, y0, y1: y0 + h });
    }
  }
  return (
    <Plot id="venn" x={[-3, 3]} y={[-2.5, 2.5]} equal>
      <Shape pts={[[-3, -2.5], [3, -2.5], [3, 2.5], [-3, 2.5]]} closed />
      {cells.map(c => <Region id={c.id} top={c.y1} base={c.y0} from={c.x0} to={c.x1} group="A ∩ Bᶜ" />)}
      <Circle id="circA" at={[cA, 0]} r={R} />
      <Circle id="circB" at={[cB, 0]} r={R} />
      <Label id="lblU" at={[-2.7, 2.1]} text="$U$" />
      <Label id="lblA" at={[-2.2, 1.85]} text="$A$" />
      <Label id="lblB" at={[2.2, 1.85]} text="$B$" />
    </Plot>
  );
}
```

Steps:
1. Draw the universe box $U$.
2. Draw circles A and B so they overlap.
3. Shade the part inside A and outside B. Leave the overlap unshaded.

The shading is built from small squares, so its edges look stepped.