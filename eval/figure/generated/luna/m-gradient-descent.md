I’ll show the update rule, calculate the first step from your starting point, and add a learning-rate slider to the trajectory.

**Gradient descent** repeatedly moves downhill by subtracting a fraction of the function’s slope. For a learning rate $\eta$, each step is:

$$
(x_{\text{new}}, y_{\text{new}})
=
(x, y) - \eta \nabla f(x,y)
$$

Here $\nabla f$ is the gradient, the pair of slopes in the $x$ and $y$ directions. For $f(x,y)=x^2+3y^2$, it is $(2x,6y)$. Starting at $(2.5,1.5)$ with $\eta=0.1$, the gradient is $(5,9)$, so the next point is $(2,0.6)$. The function value falls from $13$ to $5.08$.

Change the learning rate below to see how it affects the path. For this function, rates between $0$ and $\frac{1}{3}$ converge; closer to $\frac{1}{3}$, the path in the $y$ direction zigzags and shrinks more slowly.

```figure
export const params = {
  eta: { label: 'Learning rate', min: 0.01, max: 0.32, step: 0.01, value: 0.1 }
};

export default function ({ eta }) {
  const path = [];
  let x = 2.5;
  let y = 1.5;

  for (let k = 0; k <= 8; k++) {
    path.push([x, y, x * x + 3 * y * y]);
    x = x - eta * 2 * x;
    y = y - eta * 6 * y;
  }

  const steps = path.map((point, i) => ({
    path: path.slice(0, i + 1),
    point,
    text: `Step ${i}: $(x,y)=(${point[0].toFixed(3)}, ${point[1].toFixed(3)})$, $f=${point[2].toFixed(3)}$.`
  }));

  return (
    <Figure steps={steps} caption={step => step.text} title="Gradient descent on $x^2+3y^2$" render={step => (
      <Plot id="descent" x={[-3, 3]} y={[-2, 2]} z={[0, 20]} xLabel="x" yLabel="y" zLabel="f(x,y)">
        <Fn id="surface" f={(x, y) => x * x + 3 * y * y} state="dim" />
        <Shape id="path" pts={step.path} />
        <Points id="current" pts={[step.point]} label="Current point" state="active" />
      </Plot>
    )} />
  );
}
```

