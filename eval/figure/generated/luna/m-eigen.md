The matrix stretches the square along the diagonal direction and leaves the other eigenvector direction unchanged. Each eigenvector keeps its direction after the transformation; its eigenvalue tells how much it is scaled.

$$
\begin{bmatrix}2&1\\1&2\end{bmatrix}
\begin{bmatrix}x\\y\end{bmatrix}
=
\begin{bmatrix}2x+y\\x+2y\end{bmatrix}
$$

The unit square becomes the parallelogram with corners $(0,0)$, $(2,1)$, $(3,3)$, and $(1,2)$. The eigenvectors point along $(1,1)$, with eigenvalue $3$, and $(1,-1)$, with eigenvalue $1$.

```figure
export default function () {
  return (
    <Plot x={[-1.5, 3.5]} y={[-1.5, 3.5]} xLabel="x" yLabel="y" equal>
      <Shape pts={[[0, 0], [1, 0], [1, 1], [0, 1]]} closed label="Unit square" group="original" />
      <Shape pts={[[0, 0], [2, 1], [3, 3], [1, 2]]} closed label="Transformed square" group="image" />
      <Vector from={[0, 0]} to={[1, 1]} label="Eigenvector $(1,1)$, $\lambda=3$" group="eigenvector" />
      <Vector from={[0, 0]} to={[1, -1]} label="Eigenvector $(1,-1)$, $\lambda=1$" group="eigenvector" />
    </Plot>
  );
}
```

