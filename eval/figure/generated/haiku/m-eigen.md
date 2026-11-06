The matrix turns the unit square into a parallelogram of area 3. Two directions stay on their own line: $v_1 = (1,1)$, stretched by 3, and $v_2 = (1,-1)$, unchanged.

```figure
const S = 1.5;                                   // shift so every point sits inside the drawing
const P = ([x, y]) => [x + S, y + S];
const A = ([x, y]) => [2 * x + y, x + 2 * y];    // the map (x, y) to A(x, y)
const square = [[0, 0], [1, 0], [1, 1], [0, 1]];

export default function () {
  const steps = [
    { on: ['sq'], text: String.raw`The unit square has corners $(0,0)$, $(1,0)$, $(1,1)$ and $(0,1)$. Its area is $1$.` },
    { on: ['img'], text: String.raw`$A$ sends the corners to $(0,0)$, $(2,1)$, $(3,3)$ and $(1,2)$. The square becomes a parallelogram of area $3$.` },
    { on: ['img', 'v1'], text: String.raw`The corner $(1,1)$ goes to $(3,3)$. The direction $v_1 = (1,1)$ keeps its line and is stretched by $\lambda = 3$.` },
    { on: ['v2'], text: String.raw`The direction $v_2 = (1,-1)$ keeps its line and is not stretched: $\lambda = 1$.` },
  ];
  return (
    <Figure steps={steps} caption={step => step.text} render={(step, i) => {
      const st = id => (step.on.includes(id) ? 'active' : 'dim');
      return (
        <Diagram id="plane" width={5} height={5}>
          <Shape id="sq" pts={square.map(P)} closed group="input" state={st('sq')} />
          <Shape id="img" pts={i >= 1 ? square.map(A).map(P) : []} closed group="output" state={st('img')} />
          <Segment id="e1" from={P([-1.5, -1.5])} to={P([3.5, 3.5])} group="eigenvector" state={st('v1')} />
          <Segment id="e2" from={P([-1.5, 1.5])} to={P([1.5, -1.5])} group="eigenvector" state={st('v2')} />
          <Vector id="v1" from={P([0, 0])} to={P([3, 3])} label="$3v_1$" group="eigenvector" state={st('v1')} />
          <Vector id="v2" from={P([0, 0])} to={P([1, -1])} label="$v_2$" group="eigenvector" state={st('v2')} />
          <Label id="lab" at={P([3, 3])} text={i >= 1 ? '$(3,3)$' : ''} state={st('img')} />
        </Diagram>
      );
    }} />
  );
}
```

An **eigenvector** is a direction that a matrix only stretches or flips. It does not turn. Formally, a nonzero vector $\mathbf{v}$ is an eigenvector of $A$ when

$$A\mathbf{v} = \lambda\mathbf{v}$$

for some number $\lambda$, the **eigenvalue**. Here $A$ is the matrix, and $\lambda$ is the factor by which $\mathbf{v}$ is scaled.

Find the eigenvalues of $A = \begin{pmatrix}2&1\\1&2\end{pmatrix}$ first. They solve $\det(A - \lambda I) = 0$:

$$\begin{aligned} (2-\lambda)^2 - 1 &= 0 \\ (\lambda-1)(\lambda-3) &= 0 \end{aligned}$$

So $\lambda = 1$ or $\lambda = 3$.

- For $\lambda = 3$: $(A - 3I)\mathbf{v} = 0$ gives $-x + y = 0$, so $y = x$. Take $\mathbf{v} = (1,1)$. Check: $A(1,1) = (3,3) = 3(1,1)$.
- For $\lambda = 1$: $(A - I)\mathbf{v} = 0$ gives $x + y = 0$, so $y = -x$. Take $\mathbf{v} = (1,-1)$. Check: $A(1,-1) = (1,-1)$.

The concept stops at some matrices. A 90° rotation, $\begin{pmatrix}0&-1\\1&0\end{pmatrix}$, keeps no real direction, so it has no real eigenvectors.