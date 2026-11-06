```figure
const a = [2.5, 2];
const b = [4, 2];
const r = 1.4;
const angle = Math.acos((b[0] - a[0]) / (2 * r));
const points = [];

for (let i = 0; i <= 40; i++) {
  const t = angle + (2 * Math.PI - 2 * angle) * i / 40;
  points.push([a[0] + r * Math.cos(t), a[1] + r * Math.sin(t)]);
}
for (let i = 0; i <= 40; i++) {
  const t = Math.PI - angle - (Math.PI - 2 * angle) * i / 40;
  points.push([b[0] + r * Math.cos(t), b[1] + r * Math.sin(t)]);
}

export default function () {
  return (
    <Diagram width={7} height={4}>
      <Shape pts={points} closed label="A ∩ Bᶜ" group="A only" />
      <Circle at={a} r={r} label="A" />
      <Circle at={b} r={r} label="B" />
      <Label at={[0.5, 3.45]} text="A ∩ Bᶜ" />
    </Diagram>
  );
}
```

