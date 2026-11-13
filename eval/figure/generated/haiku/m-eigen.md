Eigenvalues are **3** and **1**. Eigenvectors: $v_1=(1,1)$ with $\lambda_1=3$, and $v_2=(1,-1)$ with $\lambda_2=1$. Check: $A(1,1)=(3,3)=3(1,1)$ and $A(1,-1)=(1,-1)$.

The square's corners map to $(0,0)$, $(2,1)$, $(3,3)$, $(1,2)$, so it becomes a parallelogram with area $\det A = 3$. Step through the figure to see it.

```figure
export const params = {};

export default function () {
  const square = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const apply = ([x, y]) => [2 * x + y, x + 2 * y];   // A = [[2,1],[1,2]]
  const steps = [
    {
      name: 'unit square', pts: square,
      e1: [1, 1], l1: 'v₁ = (1,1)',
      e2: [1, -1], l2: 'v₂ = (1,−1)',
      text: 'The unit square with eigenvectors $v_1=(1,1)$ and $v_2=(1,-1)$ drawn from the origin.'
    },
    {
      name: 'image under A', pts: square.map(apply),
      e1: apply([1, 1]), l1: '3v₁ = (3,3)',
      e2: apply([1, -1]), l2: 'v₂ = (1,−1)',
      text: 'After $A$ the corners sit at $(0,0), (2,1), (3,3), (1,2)$. Area goes from $1$ to $3$. $v_1$ stretches by $3$, and $v_2$ keeps its length, so its eigenvalue is $1$.'
    }
  ];
  return (
    <Figure steps={steps} caption={step => step.text} render={step => (
      <Plot id="plot" x={[-1.5, 3.5]} y={[-1.5, 3.5]} xLabel="x" yLabel="y" equal>
        <Shape id="shape" pts={step.pts} closed label={step.name} group="shape" />
        <Vector id="e1" from={[0, 0]} to={step.e1} label={step.l1} group="eigen" />
        <Vector id="e2" from={[0, 0]} to={step.e2} label={step.l2} group="eigen" />
      </Plot>
    )} />
  );
}
```

Eigenvectors that stay on their own line are the key idea: $A$ only stretches them, so they never turn.

Not checked: I did not render the figure, so the layout is untested. No code was changed.