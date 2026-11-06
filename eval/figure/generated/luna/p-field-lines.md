Electric field lines show the direction a positive test charge would move: they leave the positive charge and end at the negative charge. For equal-sized charges, the pattern is symmetric.

```figure
export default function () {
  const positive = [-1, 0];
  const negative = [1, 0];

  const field = ([x, y]) => {
    const from = (charge, center) => {
      const dx = x - center[0], dy = y - center[1];
      const r2 = dx * dx + dy * dy;
      return [charge * dx / (r2 * Math.sqrt(r2)), charge * dy / (r2 * Math.sqrt(r2))];
    };
    const a = from(1, positive), b = from(-1, negative);
    return [a[0] + b[0], a[1] + b[1]];
  };

  const paths = [];
  for (let i = 0; i < 16; i++) {
    const angle = 2 * Math.PI * i / 16;
    let p = [positive[0] + 0.14 * Math.cos(angle), 0.14 * Math.sin(angle)];
    const pts = [p];
    for (let j = 0; j < 700; j++) {
      const e = field(p), mag = Math.hypot(e[0], e[1]);
      if (!mag) break;
      const next = [p[0] + 0.025 * e[0] / mag, p[1] + 0.025 * e[1] / mag];
      p = next;
      pts.push(p);
      if (Math.hypot(p[0] - negative[0], p[1] - negative[1]) < 0.15) break;
    }
    paths.push(pts);
  }

  return (
    <Diagram width={4.4} height={3.2}>
      {paths.map((pts, i) => <Shape key={i} pts={pts} />)}
      {paths.map((pts, i) => {
        const p = pts[Math.floor(pts.length * 0.58)];
        if (!p) return null;
        const e = field(p), mag = Math.hypot(e[0], e[1]);
        return <Vector key={`arrow${i}`} from={p} to={[p[0] + 0.18 * e[0] / mag, p[1] + 0.18 * e[1] / mag]} />;
      })}
      <Circle at={positive} r={0.12} label="+" />
      <Circle at={negative} r={0.12} label="−" />
      <Label at={[-1, -0.35]} text="positive" />
      <Label at={[0.55, -0.35]} text="negative" />
    </Diagram>
  );
}
```

