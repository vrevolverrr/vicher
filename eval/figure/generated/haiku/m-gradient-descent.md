Gradient descent finds a low point by walking downhill. At each point it measures the slope, then moves a fixed fraction of that slope the opposite way. That fraction is the learning rate.

For a function $f$, the gradient $\nabla f$ is the vector of partial derivatives. Each step is:

$$\mathbf{p}_{k+1} = \mathbf{p}_k - \eta\,\nabla f(\mathbf{p}_k)$$

Here $\mathbf{p}_k$ is the point at step $k$, $\nabla f$ is the gradient, and $\eta > 0$ is the learning rate.

For $f = x^2 + 3y^2$, the gradient is $\nabla f = (2x,\ 6y)$. Each coordinate shrinks by its own factor:

$$x_{k+1} = (1-2\eta)\,x_k$$

$$y_{k+1} = (1-6\eta)\,y_k$$

Example with $\eta = 0.1$ from $(2.5,\ 1.5)$:

1. Gradient: $(2 \cdot 2.5,\ 6 \cdot 1.5) = (5,\ 9)$.
2. Step: $(2.5 - 0.1 \cdot 5,\ 1.5 - 0.1 \cdot 9) = (2.0,\ 0.6)$.
3. Value: $f$ falls from $13$ to $2.0^2 + 3 \cdot 0.6^2 = 5.08$.

The $y$ factor is $0.4$ and the $x$ factor is $0.8$. The steep $y$ direction settles fast, and the flat $x$ direction settles slowly.

The steep direction limits the learning rate. Convergence needs $|1-6\eta| < 1$, so $\eta < 1/3$. At $\eta = 1/3$, $y$ flips sign each step without shrinking. Above it, the path grows and diverges.

```figure
export const params = {
  eta: { label: 'Learning rate η', min: 0.01, max: 0.35, step: 0.01, value: 0.1 },
  n: { label: 'Steps', min: 1, max: 15, step: 1, value: 8 }
};

const fmt = v => String(Number(v.toPrecision(4)));

export default function ({ eta, n }) {
  const ring = c => Array.from({ length: 120 }, (_, i) => {
    const t = (2 * Math.PI * i) / 120;
    return [Math.sqrt(c) * Math.cos(t), Math.sqrt(c / 3) * Math.sin(t)];
  });

  const pts = [[2.5, 1.5]];
  for (let k = 0; k < n; k++) {
    const [x, y] = pts[k];
    pts.push([x - eta * 2 * x, y - eta * 6 * y]);
  }
  const steps = pts.map(([x, y], k) => ({ k, x, y, f: x * x + 3 * y * y }));

  return (
    <Figure
      steps={steps}
      caption={s => `Step ${s.k}: x = ${fmt(s.x)}, y = ${fmt(s.y)}, f = ${fmt(s.f)}`}
      render={s => (
        <Row gap="lg" align="center">
          <Plot id="plot" x={[-4, 4]} y={[-4, 4]} xLabel="x" yLabel="y" equal>
            {[1, 4, 13].map(c => <Shape key={c} pts={ring(c)} closed label={`f = ${c}`} />)}
            <Shape id="path" pts={pts.slice(0, s.k + 1)} />
            <Points id="min" pts={[[0, 0]]} label="minimum" />
            <Points id="cur" pts={[[s.x, s.y]]} label={`k = ${s.k}`} state="active" />
          </Plot>
          <Table
            id="tbl"
            title="Iterates"
            columns={['k', 'x', 'y', 'f']}
            rows={pts.slice(0, s.k + 1).map((p, k) => [k, p[0], p[1], p[0] * p[0] + 3 * p[1] * p[1]])}
          />
        </Row>
      )}
    />
  );
}
```

Change $\eta$ and the step count with the sliders. Above $\eta = 0.33$, the path spirals outward.

Not checked: I did not run the figure code here.