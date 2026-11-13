Gradient descent finds a low point of a function by walking downhill. At each point it measures the slope, then steps against the slope. The **learning rate** $\eta$ sets how big each step is. Too small and progress is slow. Too large and the steps overshoot. Change $\eta$ with the slider in the figure.

```figure
export const params = {
  lr: { label: 'Learning rate η', min: 0.05, max: 0.6, step: 0.05, value: 0.1 }
};

const N = 6;

export default function ({ lr }) {
  const grad = (x, y) => [2 * x, 6 * y];
  const r = v => +v.toPrecision(4);
  const pts = [[2.5, 1.5]];
  for (let t = 0; t < N; t++) {
    const [x, y] = pts[t];
    const [gx, gy] = grad(x, y);
    pts.push([x - lr * gx, y - lr * gy]);
  }
  const ellipse = c => Array.from({ length: 72 }, (_, k) => {
    const th = (2 * Math.PI * k) / 72;
    return [Math.sqrt(c) * Math.cos(th), Math.sqrt(c / 3) * Math.sin(th)];
  });
  const steps = pts.map((p, t) => {
    const [x, y] = p;
    const [gx, gy] = grad(x, y);
    const fv = x * x + 3 * y * y;
    const next = pts[t + 1];
    const off = Math.abs(x) > 4 || Math.abs(y) > 2.5;
    let text = String.raw`At step ${t}, $(x, y) = (${r(x)}, ${r(y)})$ and $f = ${r(fv)}$. The gradient is $\nabla f = (${r(gx)}, ${r(gy)})$.`;
    if (next) text += String.raw` With $\eta = ${lr}$ the next point is $(${r(next[0])}, ${r(next[1])})$.`;
    if (off) text += ' This point is off the plot: the steps diverge.';
    return { t, next, text };
  });

  return (
    <Figure
      title="Gradient descent on f(x, y) = x² + 3y²"
      steps={steps}
      caption={step => step.text}
      heading={step => `Step ${step.t}`}
      render={step => {
        const states = {};
        pts.forEach((_, i) => {
          states[`r${i}`] = i < step.t ? 'done' : i === step.t ? 'active' : 'dim';
        });
        return (
          <Row gap="lg" align="start">
            <Plot id="plot" x={[-4, 4]} y={[-2.5, 2.5]} xLabel="x" yLabel="y" equal>
              {[1, 4, 9, 13].map(c => <Shape key={c} pts={ellipse(c)} closed state="dim" />)}
              <Shape pts={pts.slice(0, step.t + 1)} />
              {step.t > 0 && <Points pts={pts.slice(0, step.t)} state="done" />}
              <Points pts={[pts[step.t]]} label="now" state="active" />
              {step.next && <Vector from={pts[step.t]} to={step.next} label={String.raw`$-\eta\nabla f$`} />}
            </Plot>
            <Table
              id="iter"
              title="Iterates"
              columns={['Step', 'x', 'y', 'f(x, y)']}
              rows={pts.map((p, i) => [i, r(p[0]), r(p[1]), r(p[0] ** 2 + 3 * p[1] ** 2)])}
              rowIds={pts.map((_, i) => `r${i}`)}
              states={states}
            />
          </Row>
        );
      }}
    />
  );
}
```

The contour lines are places where $f$ is equal. The steps move across them toward the centre $(0, 0)$.

Gradient descent repeats this update:

$$\nabla f = (2x,\ 6y), \qquad (x, y) \leftarrow (x, y) - \eta\,\nabla f(x, y)$$

Here $\nabla f$ is the gradient, the vector of partial derivatives, and $\eta > 0$ is the learning rate.

With $\eta = 0.1$ from $(2.5, 1.5)$:

1. Gradient: $\nabla f = (2 \cdot 2.5,\ 6 \cdot 1.5) = (5, 9)$.
2. Step: $x = 2.5 - 0.1 \cdot 5 = 2.0$ and $y = 1.5 - 0.1 \cdot 9 = 0.6$.
3. Check: $f$ drops from $13$ to $2^2 + 3(0.6)^2 = 5.08$.

Each step multiplies $x$ by $1 - 2\eta$ and $y$ by $1 - 6\eta$. These factors set the behaviour:

| $\eta$ | $x$ factor $1-2\eta$ | $y$ factor $1-6\eta$ | Result |
|---|---|---|---|
| 0.1 | 0.8 | 0.4 | Converges, slowly in $x$ |
| 0.25 | 0.5 | −0.5 | Fastest: both factors have size 0.5 |
| 1/3 | 1/3 | −1 | $y$ flips sign forever |
| 0.6 | −0.2 | −2.6 | Diverges |

Try 0.25 for the fastest run and 0.6 to see divergence. The steps converge only while $|1 - 6\eta| < 1$, so $\eta$ must stay below $1/3$.