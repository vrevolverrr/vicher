Gradient descent moves a point downhill by stepping against the slope, over and over. The gradient is the vector of slopes, and it points uphill.

For a function $f(x, y)$, each step applies this update:

$$\theta_{k+1} = \theta_k - \eta \, \nabla f(\theta_k)$$

- $\theta_k = (x_k, y_k)$ is the position at step $k$.
- $\eta$ is the learning rate, which sets the step size.
- $\nabla f = \left(\frac{\partial f}{\partial x}, \frac{\partial f}{\partial y}\right)$ is the gradient.

For $f = x^2 + 3y^2$, the gradient is $\nabla f = (2x, 6y)$.

```figure
export const params = {
  eta: { label: 'Learning rate η', min: 0.01, max: 0.4, step: 0.01, value: 0.1 },
  n: { label: 'Steps', min: 1, max: 30, step: 1, value: 12 }
};

export default function ({ eta, n }) {
  const height = (x, y) => x * x + 3 * y * y;
  const r = v => Number(v.toPrecision(4));
  const pts = [[2.5, 1.5]];
  for (let k = 0; k < n; k++) {
    const [x, y] = pts[pts.length - 1];
    pts.push([x - eta * 2 * x, y - eta * 6 * y]);
  }
  const lift = ([x, y]) => [x, y, height(x, y)];
  const steps = pts.map(([x, y], i) => {
    const z = height(x, y);
    return {
      path: pts.slice(0, i + 1).map(lift),
      now: [x, y, z],
      move: i > 0 ? [lift(pts[i - 1]), [x, y, z]] : null,
      rows: pts.slice(0, i + 1).map(([a, b], k) => [k, r(a), r(b), r(height(a, b))]),
      text: i === 0
        ? `Start at $(${r(x)}, ${r(y)})$. The height is $f = ${r(z)}$.`
        : `Step ${i}: move to $(${r(x)}, ${r(y)})$. The height is $f = ${r(z)}$.`
    };
  });
  return (
    <Figure steps={steps} caption={s => s.text} render={s => (
      <Row gap="lg" align="center">
        <Plot id="plot" x={[-3, 3]} y={[-3, 3]} z={[0, 36]} xLabel="x" yLabel="y" zLabel="f" equal={false} view={{ azimuth: 35, elevation: 25 }}>
          <Fn id="surface" f={(x, y) => x * x + 3 * y * y} label="$f = x^2 + 3y^2$" state="dim" />
          <Shape id="path" pts={s.path} />
          <Points id="iters" pts={s.path} state="done" />
          <Points id="now" pts={[s.now]} label="current" state="active" />
          {s.move && <Segment id="move" from={s.move[0]} to={s.move[1]} label="$-\eta \nabla f$" state="active" />}
        </Plot>
        <Table id="tab" title="Iterates" columns={['k', 'x', 'y', 'f']} rows={s.rows} />
      </Row>
    )} />
  );
}
```

**Worked example**, with $\eta = 0.1$ from $(2.5, 1.5)$:

1. Gradient: $(2 \cdot 2.5,\ 6 \cdot 1.5) = (5, 9)$.
2. Step: $(2.5 - 0.1 \cdot 5,\ 1.5 - 0.1 \cdot 9) = (2.0, 0.6)$.
3. Height: $f$ falls from $13$ to $2^2 + 3(0.6)^2 = 5.08$.

The learning rate decides whether the steps settle. Each step multiplies $x$ by $(1 - 2\eta)$ and $y$ by $(1 - 6\eta)$. The path converges only when $|1 - 6\eta| < 1$, which means $0 < \eta < \frac{1}{3}$. At $\eta = \frac{1}{3}$, $y$ flips sign each step and never shrinks. Above $\frac{1}{3}$, the path diverges. Set $\eta$ to $0.34$ in the slider to see it.

Not checked: I did not render the figure, so the layout is unverified. Risk: at high $\eta$ the points leave the plot box and may be clipped.