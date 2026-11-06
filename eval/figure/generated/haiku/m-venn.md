Shade the part of circle A that lies outside circle B. That is the left crescent below.

$$A \cap B^c = \{x : x \in A \text{ and } x \notin B\}$$

$B^c$ is every element outside $B$. Intersecting with $A$ keeps only the elements that are in $A$ and not in $B$. This is the same as $A \setminus B$.

Example: $A = \{1, 2, 3, 4\}$ and $B = \{3, 4, 5\}$. $B^c$ holds every element except 3, 4 and 5, so $A \cap B^c = \{1, 2\}$. Shade 1 and 2 only.

```figure
const cA = [3.6, 3], cB = [6.4, 3], r = 2.6;
const inCircle = (p, c) => Math.hypot(p[0] - c[0], p[1] - c[1]) <= r;
const pts = [];
for (let x = 0.6; x <= 9.4; x += 0.25)
  for (let y = 0.4; y <= 5.6; y += 0.25) {
    const p = [x, y];
    if (inCircle(p, cA) && !inCircle(p, cB)) pts.push(p);
  }

export default function () {
  return (
    <Diagram id="venn" width={10} height={6}>
      <Circle id="A" at={cA} r={r} label="A" />
      <Circle id="B" at={cB} r={r} label="B" />
      <Points id="shade" pts={pts} label="A ∩ Bᶜ" />
    </Diagram>
  );
}
```

Not checked: the shading is a grid of dots, so it shows the region at this spacing, not a solid fill. I did not run the figure.