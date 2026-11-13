I’ll add a step-by-step figure to the open note, with a learning-rate control and the iterates plotted on the surface.

Gradient descent moves downhill by subtracting a fraction of the surface’s gradient at each step. On this surface, the gradient is $(2x,6y)$, so the update is:

$$
(x_{n+1},y_{n+1})=(x_n,y_n)-\eta(2x_n,6y_n)
$$

With learning rate $\eta=0.1$, the first step goes from $(2.5,1.5)$ to $(2,0.6)$, where $z=5.08$. Change the learning rate above the figure to see how the path changes.

```figure
export const params = {
  eta: { label: 'Learning rate', min: 0.01, max: 0.32, step: 0.01, value: 0.1 }
};

export default function ({ eta }) {
  const steps = [];
  let x = 2.5;
  let y = 1.5;
  const path = [[x, y, x * x + 3 * y * y]];

  steps.push({
    path: [...path],
    x, y, z: x * x + 3 * y * y,
    text: `Start at $(2.5, 1.5)$ on the surface.`
  });

  for (let n = 1; n <= 6; n++) {
    x -= eta * 2 * x;
    y -= eta * 6 * y;
    const z = x * x + 3 * y * y;
    path.push([x, y, z]);
    steps.push({
      path: [...path],
      x, y, z,
      text: `Step ${n}: $(x,y)=(${x.toFixed(3)}, ${y.toFixed(3)})$, $z=${z.toFixed(3)}$.`
    });
  }

  return (
    <Figure steps={steps} caption={step => step.text} title="Gradient descent on a bowl"
      render={step => (
        <Plot id="surface-plot" x={[-3, 3]} y={[-2, 2]} z={[0, 45]}
          xLabel="x" yLabel="y" zLabel="z">
          <Fn id="bowl" f={(x, y) => x * x + 3 * y * y} state="dim" />
          <Shape id="iterate-path" pts={step.path} />
          <Points id="start" pts={[[2.5, 1.5, 13]]} label="start" />
          <Points id="current" pts={[[step.x, step.y, step.z]]} label="current" state="active" />
        </Plot>
      )} />
  );
}
```

