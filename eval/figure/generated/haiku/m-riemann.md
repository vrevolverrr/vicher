```figure
export const params = { n: { label: 'Rectangles', min: 1, max: 20, step: 1, value: 4 } };

export default function ({ n }) {
  const a = 0, b = 2;
  const dx = (b - a) / n;
  const f = x => x * x;
  const rects = [];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x0 = a + i * dx;
    const h = f(x0);
    sum += h * dx;
    rects.push({ x0, h, id: `r${i}` });
  }
  const step = { rects, dx, sum };
  return (
    <Figure
      steps={[step]}
      caption={s => String.raw`Left sum with $n = ${n}$ and $\Delta x = ${dx}$: $L_n = ${s.sum}$. The exact area is $8/3 \approx 2.6667$.`}
      render={s => (
        <Plot id="plot" x={[0, 2]} y={[0, 4.5]} xLabel="x" yLabel="y">
          {s.rects.map(r => (
            <Region id={r.id} top={r.h} base={0} from={r.x0} to={r.x0 + dx} />
          ))}
          <Fn id="curve" f={f} from={0} to={2} label="$y = x^2$" />
        </Plot>
      )}
    />
  );
}
```

Drag the **Rectangles** slider to change the count. Each rectangle's height is $f$ at its left endpoint.

Not checked: I did not render the figure in the app, so the slider behavior is unverified. The sum uses left endpoints only.