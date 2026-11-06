Field lines leave a positive charge and enter a negative charge. The figure shows each case, then the equal pair.

```figure
const W = 8, H = 6, h = 0.05;
const P = { at: [2.5, 3], q: 1 };
const N = { at: [5.5, 3], q: -1 };

function field(r, cs) {
  let ex = 0, ey = 0;
  for (const c of cs) {
    const dx = r[0] - c.at[0], dy = r[1] - c.at[1];
    const d3 = Math.hypot(dx, dy) ** 3;
    ex += c.q * dx / d3;
    ey += c.q * dy / d3;
  }
  const m = Math.hypot(ex, ey);
  return [ex / m, ey / m];
}

function trace(start, cs, sign) {
  const pts = [start];
  let r = start;
  for (let s = 0; s < 800; s++) {
    const [ux, uy] = field(r, cs);
    r = [r[0] + sign * h * ux, r[1] + sign * h * uy];
    pts.push(r);
    const out = r[0] < 0 || r[0] > W || r[1] < 0 || r[1] > H;
    const hit = cs.some(c => Math.hypot(r[0] - c.at[0], r[1] - c.at[1]) < 0.15);
    if (out || hit) break;
  }
  return sign < 0 ? pts.reverse() : pts;
}

export default function () {
  const steps = [
    { name: 'Positive charge alone', src: P, cs: [P], sign: 1, text: 'Lines leave the positive charge and point **away** from it. Arrows show the direction.' },
    { name: 'Negative charge alone', src: N, cs: [N], sign: -1, text: 'Lines point **toward** the negative charge, so the arrows point inward.' },
    { name: 'Equal pair', src: P, cs: [P, N], sign: 1, text: 'Each line starts on $+q$ and ends on $-q$. Lines that do not reach $-q$ leave the frame.' },
  ];
  return (
    <Figure
      steps={steps}
      heading={s => s.name}
      caption={s => s.text}
      render={s => {
        const lines = [];
        for (let k = 0; k < 8; k++) {
          const a = k * Math.PI / 4;
          lines.push(trace([s.src.at[0] + 0.3 * Math.cos(a), s.src.at[1] + 0.3 * Math.sin(a)], s.cs, s.sign));
        }
        return (
          <Diagram width={W} height={H}>
            {lines.map((pts, k) => {
              const m = Math.floor(pts.length / 2);
              return (
                <>
                  <Shape id={`line${k}`} pts={pts} />
                  {m + 6 < pts.length && <Vector id={`arrow${k}`} from={pts[m]} to={pts[m + 6]} />}
                </>
              );
            })}
            {s.cs.includes(P) && <Circle id="pos" at={P.at} r={0.25} group="Positive charge" />}
            {s.cs.includes(P) && <Label id="pos-label" at={[P.at[0], P.at[1] + 0.5]} text="$+q$" group="Positive charge" />}
            {s.cs.includes(N) && <Circle id="neg" at={N.at} r={0.25} group="Negative charge" />}
            {s.cs.includes(N) && <Label id="neg-label" at={[N.at[0], N.at[1] + 0.5]} text="$-q$" group="Negative charge" />}
          </Diagram>
        );
      }}
    />
  );
}
```

The number of lines is proportional to the charge, so equal charges get equal numbers. Lines that leave the frame still return to $-q$ outside it.

Not checked: I did not render the figure, and I assumed `Diagram` coordinates start at (0, 0) at the lower left. The curves are traced numerically with a fixed step, so they are approximate.