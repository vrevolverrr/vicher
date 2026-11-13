```figure
function arc(cx, cy, r, start, end, count) {
  return Array.from({ length: count + 1 }, (_, i) => {
    const angle = (start + (end - start) * i / count) * Math.PI / 180;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  });
}

export default function () {
  const r = 1.25;
  const d = 0.65;
  const y = Math.sqrt(r * r - d * d);
  const top = Math.atan2(y, d) * 180 / Math.PI;
  const bottom = 360 - top;
  const leftOnly = [
    ...arc(-d, 0, r, top, bottom, 48),
    ...arc(d, 0, r, 360 - top, 360 - bottom, 24)
  ];

  return (
    <Diagram width={4.2} height={3.2}>
      <Shape pts={leftOnly} closed />
      <Circle at={[-d, 0]} r={r} />
      <Circle at={[d, 0]} r={r} />
      <Label at={[-1.35, 0.15]} text="A" />
      <Label at={[1.15, 0.15]} text="B" />
      <Label at={[-0.72, -0.48]} text="$A \\cap B^c$" />
    </Diagram>
  );
}
```

