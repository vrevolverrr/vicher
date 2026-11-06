I’ll show each gradient descent update on the surface, with a learning-rate control and the iterates kept on the surface.

**Gradient descent** repeatedly moves opposite the surface’s steepest uphill direction, aiming for its minimum. Here the surface is lowest at $(0,0,0)$. The gradient gives the uphill direction at each point; the learning rate controls how far each step moves.

For $f(x,y)=x^2+3y^2$, the update rule is:

$$
(x_{k+1},y_{k+1})=(x_k,y_k)-\eta(2x_k,6y_k)
$$

Here $\eta$ is the learning rate and $(x_k,y_k)$ is the current point. Starting at $(2.5,1.5)$ with $\eta=0.1$, the gradient is $(5,9)$, so the next point is $(2,0.6)$. Its height is $2^2+3(0.6)^2=5.08$. Use the slider and step controls to follow the iterates on the surface.

```figure
export const params = {
  eta: { label: 'Learning rate', min: 0.01, max: 0.32, step: 0.01, value: 0.1 }
};

export default function ({ eta }) {
  const steps = [];
  let x = 2.5;
  let y = 1.5;

  for (let k = 0; k <= 8; k++) {
    const points = [];
    let px = 2.5;
    let py = 1.5;

    for (let j = 0; j <= k; j++) {
      points.push([px, py, px * px + 3 * py * py]);
      px = px * (1 - 2 * eta);
      py = py * (1 - 6 * eta);
    }

    steps.push({
      points,
      text: `Step ${k}: (${
        x.toFixed(3)
      }, ${
        y.toFixed(3)
      }), height ${
        (x * x + 3 * y * y).toFixed(3)
      }`
    });

    x = x * (1 - 2 * eta);
    y = y * (1 - 6 * eta);
  }

  return (
    <Figure
      steps={steps}
      caption={step => step.text}
      render={step => (
        <Plot
          id="surface-plot"
          x={[-3, 3]}
          y={[-2, 2]}
          z={[0, 16]}
          xLabel="x"
          yLabel="y"
          zLabel="z"
          equal
        >
          <Fn
            id="surface"
            f={(x, y) => x * x + 3 * y * y}
            group="surface"
            state="dim"
          />
          <Shape
            id="descent-path"
            pts={step.points}
            label="Iterates"
            group="iterates"
          />
          <Points
            id="iterate-points"
            pts={step.points}
            label="Iterates"
            group="iterates"
          />
          <Points
            id="minimum"
            pts={[[0, 0, 0]]}
            label="Minimum"
            group="minimum"
          />
        </Plot>
      )}
    />
  );
}
```

