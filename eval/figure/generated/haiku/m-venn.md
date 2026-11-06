$A \cap B^c$ is the part of $A$ that is outside $B$: the elements in $A$ that are not in $B$. The shaded crescent is that region.

For example, with $A = \{1, 2, 3, 4\}$ and $B = \{3, 4, 5\}$, the elements of $A$ that are not in $B$ are $1$ and $2$, so $A \cap B^c = \{1, 2\}$.

```figure
const inA = (x, y) => (x - 1.4) ** 2 + (y - 1.5) ** 2 <= 1;
const inB = (x, y) => (x - 2.6) ** 2 + (y - 1.5) ** 2 <= 1;

export default function () {
  const pts = [];
  for (let x = 0; x <= 4.001; x += 0.1)
    for (let y = 0; y <= 3.001; y += 0.1)
      if (inA(x, y) && !inB(x, y)) pts.push([x, y]);
  return (
    <Diagram id="venn" width={4} height={3}>
      <Circle id="A" at={[1.4, 1.5]} r={1} label="A" />
      <Circle id="B" at={[2.6, 1.5]} r={1} label="B" />
      <Points id="shade" pts={pts} />
      <Label id="name" at={[1.0, 2.75]} text="$A \cap B^c$" />
    </Diagram>
  );
}
```

Not run here: the figure renders only in the Vicher pane.