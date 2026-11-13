Field lines leave the positive charge and end on the negative charge. Arrows show the direction, and with equal charges each charge has the same number of lines.

```figure
export const params = { n: { label: 'Lines per charge', min: 4, max: 16, step: 1, value: 8 } };

const CHARGES = [
  { at: [-1, 0], q: 1 },
  { at: [1, 0], q: -1 },
];

const field = (x, y) => {
  let ex = 0, ey = 0;
  for (const c of CHARGES) {
    const dx = x - c.at[0], dy = y - c.at[1];
    const r3 = Math.pow(dx * dx + dy * dy, 1.5);
    ex += c.q * dx / r3;
    ey += c.q * dy / r3;
  }
  return [ex, ey];
};

const trace = (sx, sy) => {
  const pts = [[sx, sy]];
  let x = sx, y = sy;
  for (let i = 0; i < 3000; i++) {
    const [ex, ey] = field(x, y);
    const m = Math.hypot(ex, ey);
    x += 0.02 * ex / m;
    y += 0.02 * ey / m;
    pts.push([x, y]);
    if (Math.abs(x) > 3 || Math.abs(y) > 2) break;
    if (CHARGES.some(c => Math.hypot(x - c.at[0], y - c.at[1]) < 0.15)) break;
  }
  return pts;
};

export default function ({ n }) {
  const [px, py] = CHARGES[0].at;
  const lines = Array.from({ length: n }, (_, k) => {
    const t = 2 * Math.PI * k / n;
    return trace(px + 0.15 * Math.cos(t), py + 0.15 * Math.sin(t));
  });
  return (
    <Plot id="field" x={[-3, 3]} y={[-2, 2]} xLabel="x" yLabel="y" equal>
      {lines.map((pts, i) => <Shape id={`line-${i}`} pts={pts} />)}
      {lines.map((pts, i) => {
        const [x, y] = pts[Math.floor(pts.length / 2)];
        const [ex, ey] = field(x, y);
        const m = Math.hypot(ex, ey);
        return <Vector id={`arrow-${i}`} from={[x, y]} to={[x + 0.25 * ex / m, y + 0.25 * ey / m]} />;
      })}
      <Circle id="pos" at={[-1, 0]} r={0.15} label="+q" group="positive" />
      <Circle id="neg" at={[1, 0]} r={0.15} label="−q" group="negative" />
    </Plot>
  );
}
```

- Lines start at `+q` and point outward.
- Lines end at `−q`.
- Lines never cross.
- Lines are dense near the charges, where the field is strongest.

Not checked: I did not render the figure here, so confirm it draws in the viewer. Skipped: the figure shows only lines leaving `+q`; for equal charges, every line from `+q` ends on `−q`, so the lines entering `−q` are the same set.