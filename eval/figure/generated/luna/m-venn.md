$A \cap B^{c}$ means the part that is in $A$ and not in $B$.

```figure
const r = 1;
const h = Math.sqrt(3) / 2;
const arc = (cx, start, end, count) =>
  Array.from({ length: count + 1 }, (_, i) => {
    const a = (start + (end - start) * i / count) * Math.PI / 180;
    return [cx + r * Math.cos(a), r * Math.sin(a)];
  });

export default function () {
  const crescent = [
    ...arc(-0.5, 60, 300, 48),
    ...arc(0.5, 240, 120, 24).slice(1)
  ];
  return (
    <Diagram width={3.5} height={2.5}>
      <Shape pts={crescent} closed label="$A \cap B^c$" />
      <Circle at={[-0.5, 0]} r={1} label="A" />
      <Circle at={[0.5, 0]} r={1} label="B" />
    </Diagram>
  );
}
```

