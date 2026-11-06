Gradient descent repeatedly moves opposite the surface’s steepest uphill direction. Here the gradient is $(2x,6y)$, so each step updates both coordinates:

$$
(x_{\text{new}},y_{\text{new}})=(x-2\eta x,\ y-6\eta y)
$$

Here $\eta$ is the learning rate. Starting at $(2.5,1.5)$ with $\eta=0.15$, the gradient is $(5,9)$, so the next point is $(1.75,0.15)$. The figure traces the iterates on $z=x^2+3y^2$; use the slider to change the learning rate.

```figure
export const params = {
  eta: { label: 'Learning rate', min: 0.02, max: 0.30, step: 0.01, value: 0.15 }
};

export default function ({ eta }) {
  let x = 2.5;
  let y = 1.5;
  const path = [[x, y, x * x + 3 * y * y]];
  const steps = [{ path: [...path], x, y, z: path[0][2], text: `Start at $(2.5, 1.5)$; $z=${path[0][2].toFixed(3)}$.` }];

  for (let k = 1; k <= 8; k++) {
    x = x - eta * 2 * x;
    y = y - eta * 6 * y;
    const z = x * x + 3 * y * y;
    path.push([x, y, z]);
    steps.push({
      path: [...path],
      x, y, z,
      text: `Step ${k}: $(x,y)=(${x.toFixed(3)}, ${y.toFixed(3)})$, so $z=${z.toFixed(3)}$.`
    });
  }

  return (
    <Figure
      steps={steps}
      caption={step => step.text}
      title="Gradient descent on an elliptic bowl"
      render={step => (
        <Plot
          id="bowl"
          x={[-0.2, 2.8]}
          y={[-1.7, 1.7]}
          z={[0, 14]}
          xLabel="x"
          yLabel="y"
          zLabel="z"
          view={{ azimuth: 35, elevation: 28 }}
        >
          <Fn
            id="surface"
            f={(x, y) => x * x + 3 * y * y}
            group="surface"
            state="dim"
          />
          <Shape
            id="path"
            pts={step.path}
            group="iterates"
          />
          <Points
            id="current"
            pts={[[step.x, step.y, step.z]]}
            label="Current iterate"
            group="iterate"
            state="active"
          />
        </Plot>
      )}
    />
  );
}
```

