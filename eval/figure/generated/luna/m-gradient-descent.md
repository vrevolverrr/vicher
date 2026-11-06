Gradient descent repeatedly moves opposite the gradient, which points uphill. For $f(x,y)=x^2+3y^2$, the gradient is $(2x,6y)$, so the update rule is

$$
\begin{aligned}
x_{\text{new}} &= x - 2\eta x \\
y_{\text{new}} &= y - 6\eta y
\end{aligned}
$$

Here $\eta$ is the learning rate: it controls the size of each step. Starting at $(2.5,1.5)$, the gradient is $(5,9)$. With $\eta=0.1$, the next point is $(2,0.6)$, where $f=5.08$; the starting value was $13$. The figure shows the path on the bowl. Change the learning rate with the slider to see how it affects the steps. For this function, rates below $1/3$ converge toward the minimum at $(0,0)$.

```figure
export const params = {
  rate: { label: 'Learning rate', min: 0.01, max: 0.30, step: 0.01, value: 0.10 }
};

export default function ({ rate }) {
  const steps = [];
  let x = 2.5;
  let y = 1.5;
  let path = [[x, y, x * x + 3 * y * y]];

  steps.push({
    x, y, path,
    text: `Start at $(${x.toFixed(3)}, ${y.toFixed(3)})$.`
  });

  for (let i = 0; i < 8; i++) {
    x = x - rate * 2 * x;
    y = y - rate * 6 * y;
    path = [...path, [x, y, x * x + 3 * y * y]];
    steps.push({
      x, y, path,
      text: `Step ${i + 1}: $(x,y)=(${x.toFixed(3)}, ${y.toFixed(3)})$, with $f=${(x * x + 3 * y * y).toFixed(3)}$.`
    });
  }

  return (
    <Figure
      steps={steps}
      caption={step => step.text}
      render={step => (
        <Plot x={[-3, 3]} y={[-2, 2]} z={[0, 32]} xLabel="x" yLabel="y" zLabel="f(x,y)">
          <Fn id="bowl" f={(x, y) => x * x + 3 * y * y} />
          <Shape id="trail" pts={step.path} />
          <Points id="current" pts={[[step.x, step.y, step.x * step.x + 3 * step.y * step.y]]} />
        </Plot>
      )}
    />
  );
}
```

