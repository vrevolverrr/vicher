Gradient descent finds the lowest point of a function by walking downhill. At each point it reads the slope, then moves a small step the opposite way. The **learning rate** $\eta$ sets how large each step is.

## The update rule

The **gradient** $\nabla f$ is the vector of slopes, and it points uphill. Gradient descent moves against it. For a point $\mathbf{p}_k = (x_k, y_k)$ at step $k$:

$$\mathbf{p}_{k+1} = \mathbf{p}_k - \eta\,\nabla f(\mathbf{p}_k)$$

The rule needs $\eta > 0$ and a small enough value, or the steps overshoot.

For $f(x, y) = x^2 + 3y^2$, the gradient is $(2x,\ 6y)$, so each coordinate updates on its own:

$$\begin{aligned} x_{k+1} &= (1 - 2\eta)\,x_k \\ y_{k+1} &= (1 - 6\eta)\,y_k \end{aligned}$$

## Worked step with $\eta = 0.1$

Start at $(2.5,\ 1.5)$, where $f = 6.25 + 6.75 = 13$.

1. Gradient: $\nabla f = (2 \cdot 2.5,\ 6 \cdot 1.5) = (5,\ 9)$.
2. Move: $x_1 = 2.5 - 0.1 \cdot 5 = 2.0$ and $y_1 = 1.5 - 0.1 \cdot 9 = 0.6$.
3. New height: $f = 4 + 3(0.36) = 5.08$.

The height drops from 13 to 5.08 in one step.

## The learning rate limit

Each step multiplies $x$ by $1 - 2\eta$ and $y$ by $1 - 6\eta$. A factor smaller than 1 in size shrinks that coordinate. The steep direction $y$ sets the limit: $|1 - 6\eta| < 1$ needs $\eta < \tfrac{1}{3}$. At $\eta = \tfrac{1}{3}$, $y$ flips sign each step without shrinking. Above $\tfrac{1}{3}$, $y$ grows and the steps diverge.

Use the **Learning rate** slider above the figure. Try 0.05, 0.1, 0.3 and 0.5.

Not checked: I did not run the figure. The $\tfrac{1}{3}$ limit comes from hand derivation.

```figure
export const params = { lr: { label: 'Learning rate', min: 0.01, max: 0.6, step: 0.01, value: 0.1 } };

export default function ({ lr }) {
  const r = v => Number(v.toFixed(4));
  const height = (x, y) => x * x + 3 * y * y;
  const ellipse = c => Array.from({ length: 121 }, (_, i) => {
    const t = (i / 120) * 2 * Math.PI;
    return [Math.sqrt(c) * Math.cos(t), Math.sqrt(c / 3) * Math.sin(t)];
  });
  const pts = [[2.5, 1.5]];
  for (let k = 0; k < 8; k++) {
    const [x, y] = pts[k];
    pts.push([r(x - lr * 2 * x), r(y - lr * 6 * y)]);
  }
  const steps = pts.map((p, k) => ({ k, p, path: pts.slice(0, k + 1), h: r(height(p[0], p[1])) }));

  return (
    <Figure
      steps={steps}
      caption={step => `Step ${step.k}: $x = ${step.p[0]}$, $y = ${step.p[1]}$, height $f = ${step.h}$.`}
      render={step => {
        const states = {};
        pts.forEach((_, i) => { states[`r${i}`] = i < step.k ? 'done' : i === step.k ? 'active' : 'dim'; });
        return (
          <Row gap="lg" align="center">
            <Plot id="plot" xLabel="x" yLabel="y">
              <Shape pts={ellipse(1)} closed state="dim" />
              <Shape pts={ellipse(4)} closed state="dim" />
              <Shape pts={ellipse(13)} closed state="dim" />
              <Points pts={[[0, 0]]} label="minimum" />
              <Shape pts={step.path} />
              <Points pts={[step.p]} state="active" />
            </Plot>
            <Table id="tbl" columns={['k', 'x', 'y', 'f(x, y)']} rows={pts.map((p, i) => [i, p[0], p[1], r(height(p[0], p[1]))])} rowIds={pts.map((_, i) => `r${i}`)} states={states} />
          </Row>
        );
      }}
    />
  );
}
```