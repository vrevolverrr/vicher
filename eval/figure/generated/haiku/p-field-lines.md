Field lines for equal and opposite charges, +q on the left and −q on the right:

```figure
const Q = [{ at: [-1.5, 0], q: 1 }, { at: [1.5, 0], q: -1 }];  // equal size, opposite sign
const N = 8;      // start points per charge
const h = 0.05;   // step length

// Total field: sum of Coulomb fields, constant k dropped
const field = p => Q.reduce((E, c) => {
  const dx = p[0] - c.at[0], dy = p[1] - c.at[1];
  const r3 = Math.pow(dx * dx + dy * dy, 1.5);
  return [E[0] + c.q * dx / r3, E[1] + c.q * dy / r3];
}, [0, 0]);

const unit = p => {
  const E = field(p), m = Math.hypot(E[0], E[1]);
  return [E[0] / m, E[1] / m];
};

// Follow the field (dir = 1) or against it (dir = -1) until a charge or the box edge
function trace(start, dir) {
  const pts = [start];
  let p = start, end = 'out';
  for (let i = 0; i < 800; i++) {
    const d1 = unit(p);
    const mid = [p[0] + dir * h / 2 * d1[0], p[1] + dir * h / 2 * d1[1]];
    const d2 = unit(mid);
    p = [p[0] + dir * h * d2[0], p[1] + dir * h * d2[1]];
    pts.push(p);
    const hit = Q.find(c => Math.hypot(p[0] - c.at[0], p[1] - c.at[1]) < 0.12);
    if (hit) { end = hit.q > 0 ? 'pos' : 'neg'; break; }
    if (Math.abs(p[0]) > 3 || Math.abs(p[1]) > 2) break;
  }
  return { pts, end };
}

const lines = [];
for (let k = 0; k < N; k++) {
  const a = 2 * Math.PI * k / N;
  lines.push(trace([Q[0].at[0] + 0.2 * Math.cos(a), Q[0].at[1] + 0.2 * Math.sin(a)], 1));
  const back = trace([Q[1].at[0] + 0.2 * Math.cos(a), Q[1].at[1] + 0.2 * Math.sin(a)], -1);
  if (back.end === 'out') lines.push(back);   // skip lines that duplicate the +q lines
}

export default function () {
  return (
    <Diagram width={6} height={4}>
      {lines.map((L, i) => {
        const p = L.pts[Math.floor(L.pts.length / 2)], u = unit(p);
        return (
          <>
            <Shape key={i} pts={L.pts} />
            <Vector key={`a${i}`} from={p} to={[p[0] + 0.3 * u[0], p[1] + 0.3 * u[1]]} />
          </>
        );
      })}
      <Circle at={Q[0].at} r={0.2} group="positive charge" label="+" />
      <Circle at={Q[1].at} r={0.2} group="negative charge" label="−" />
    </Diagram>
  );
}
```

- Lines start on the positive charge and end on the negative charge, or leave the box. Arrows show the direction a positive test charge would move.
- Equal sizes give equal numbers of start points: 8 per charge. The lines from −q that would end on +q are the same lines as those from +q, so they are not drawn twice.
- Lines never cross. They are densest near each charge, where the field is strongest.
- The direction follows the total field, the sum of both Coulomb fields:

$$\vec E = \sum_i \frac{q_i(\vec r-\vec r_i)}{|\vec r-\vec r_i|^3}$$

Not shown: the field strength scale. The lines show direction and density only.