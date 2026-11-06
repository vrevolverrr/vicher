Drag the learning rate slider to change the path.

Gradient descent moves a point downhill. Each step subtracts the gradient, scaled by the learning rate $\eta$:

$$x_{k+1} = x_k - \eta \nabla f(x_k)$$

Here $x_k$ is the point at step $k$, $\nabla f$ is the gradient (the direction of steepest rise), and $\eta$ is the step size. For $f = x^2 + 3y^2$, $\nabla f = (2x, 6y)$, so each coordinate scales on its own: $x$ by $1 - 2\eta$ and $y$ by $1 - 6\eta$. The steep $y$ direction limits $\eta$. Both factors must be between $-1$ and $1$, so the path converges only when $0 < \eta < 1/3$. At $\eta = 1/3$, $y$ flips sign forever. Above $1/3$, $y$ grows and the point leaves the plot.

```figure
export const params = {
  eta: { label: 'Learning rate', min: 0.01, max: 0.5, step: 0.01, value: 0.2 }
};

export default function ({ eta }) {
  const N = 8;
  const height = (x, y) => x * x + 3 * y * y;
  const onPlot = q => Math.abs(q.x) <= 3 && Math.abs(q.y) <= 3;
  const lift = q => [q.x, q.y, height(q.x, q.y)];
  const r = v => Math.round(v * 10000) / 10000;

  // grad f = (2x, 6y), so x scales by (1 - 2 eta) and y by (1 - 6 eta)
  const its = [{ x: 2.5, y: 1.5 }];
  for (let k = 0; k < N; k++) {
    const p = its[k];
    its.push({ x: p.x - eta * 2 * p.x, y: p.y - eta * 6 * p.y });
  }

  const steps = its.map((q, k) => {
    let text = k === 0
      ? 'Start at $(2.5, 1.5)$, where the height is $z = 13$.'
      : `Step ${k}: $x$ is multiplied by ${(1 - 2 * eta).toFixed(2)} and $y$ by ${(1 - 6 * eta).toFixed(2)}, so $(x, y) = (${r(q.x)}, ${r(q.y)})$.`;
    if (!onPlot(q)) text += ' This point is off the plot, so it is not drawn.';
    return { heading: k === 0 ? 'Start' : `Step ${k}`, text };
  });

  return (
    <Figure
      steps={steps}
      heading={step => step.heading}
      caption={step => step.text}
      render={(step, i) => {
        const path = its.slice(0, i + 1).filter(onPlot).map(lift);
        const prev = its.slice(0, i).filter(onPlot).map(lift);
        const now = onPlot(its[i]) ? [lift(its[i])] : [];
        const rows = its.slice(0, i + 1).map((q, k) => [k, r(q.x), r(q.y), r(height(q.x, q.y))]);
        return (
          <Row gap="lg" align="start">
            <Plot id="plot" x={[-3, 3]} y={[-3, 3]} z={[0, 36]} xLabel="x" yLabel="y" zLabel="z" equal={false}>
              <Fn id="surface" f={(x, y) => x * x + 3 * y * y} label="$z = x^2 + 3y^2$" state="dim" />
              <Shape id="path" pts={path} />
              {prev.length > 0 && <Points id="prev" pts={prev} state="done" />}
              {now.length > 0 && <Points id="now" pts={now} label={`k = ${i}`} state="active" />}
            </Plot>
            <Table id="tbl" title="Iterates" columns={['k', 'x', 'y', 'z']} rows={rows} />
          </Row>
        );
      }}
    />
  );
}
```

At the default $\eta = 0.2$, $x$ shrinks by 0.6 per step, and $y$ flips sign and shrinks by 0.2, so the path zigzags across the valley toward the minimum at $(0, 0)$.

Not checked: I did not render the figure, so the layout and the off-plot handling are checked by reading the code only.