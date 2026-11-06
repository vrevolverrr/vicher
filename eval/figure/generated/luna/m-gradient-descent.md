**Gradient descent** repeatedly moves downhill by subtracting a fraction of the function’s gradient. The gradient points uphill, and the learning rate $\eta$ sets the step size.

For this function, the gradient gives the direction of steepest increase:

$$
\nabla f(x,y) = (2x, 6y)
$$

Gradient descent updates both coordinates by subtracting the learning rate times the corresponding gradient component:

$$
x_{\text{next}} = x - 2\eta x,\qquad
y_{\text{next}} = y - 6\eta y
$$

Starting at $(2.5, 1.5)$ with $\eta=0.1$, the gradient is $(5,9)$. The first step is $(2.5-0.1\cdot5,\;1.5-0.1\cdot9)=(2,0.6)$. The function value falls from $13$ to $5.08$. The figure lets you adjust $\eta$ and step through the path. For this function, rates below $1/3$ converge; rates closer to that limit can make the path zigzag.

```figure
export const params = {
  eta: { label: 'Learning rate', min: 0.01, max: 0.32, step: 0.01, value: 0.1 }
};

export default function ({ eta }) {
  const path = [[2.5, 1.5, 13]];
  let x = 2.5;
  let y = 1.5;

  for (let i = 0; i < 8; i++) {
    x = x - eta * 2 * x;
    y = y - eta * 6 * y;
    path.push([x, y, x * x + 3 * y * y]);
  }

  const steps = path.map((point, i) => ({
    path: path.slice(0, i + 1),
    current: point,
    text: i === 0
      ? `Start at $(2.5, 1.5)$, where $f = 13$.`
      : `After ${i} steps: $(x, y) \\approx (${point[0].toFixed(3)}, ${point[1].toFixed(3)})$, with $f \\approx ${point[2].toFixed(3)}$.`
  }));

  return (
    <Figure steps={steps} caption={step => step.text} render={step => (
      <Plot id="bowl" x={[-2.7, 2.7]} y={[-1.7, 1.7]} z={[0, 20]}
        xLabel="x" yLabel="y" zLabel="f(x, y)">
        <Fn id="surface" f={(x, y) => x * x + 3 * y * y} state="dim" />
        <Shape id="path" pts={step.path} />
        <Points id="current" pts={[step.current]} label="current point" />
      </Plot>
    )} />
  );
}
```

