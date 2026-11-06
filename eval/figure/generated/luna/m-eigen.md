The matrix stretches the unit square into a larger parallelogram. Its eigenvectors point in directions that stay the same under the transformation; the corresponding eigenvalue tells how much each direction is scaled.

For a vector $v$, an eigenvector satisfies $Av=\lambda v$, where $\lambda$ is its eigenvalue. Here,

$$
A=\begin{bmatrix}2&1\\1&2\end{bmatrix}
$$

The direction $(1,1)$ has eigenvalue $3$, and $(1,-1)$ has eigenvalue $1$. The square’s vertices map as $(0,0)\mapsto(0,0)$, $(1,0)\mapsto(2,1)$, $(1,1)\mapsto(3,3)$, and $(0,1)\mapsto(1,2)$.

```figure
export default function () {
  return (
    <Plot id="map" x={[-1.5, 3.5]} y={[-1.5, 3.5]} equal xLabel="x" yLabel="y">
      <Shape id="square" pts={[[0, 0], [1, 0], [1, 1], [0, 1]]} closed label="Unit square" group="input square" />
      <Shape id="image" pts={[[0, 0], [2, 1], [3, 3], [1, 2]]} closed label="Transformed square" group="image" />
      <Vector id="eigen3" from={[0, 0]} to={[1, 1]} label="λ = 3" group="eigenvectors" />
      <Vector id="eigen1" from={[0, 0]} to={[1, -1]} label="λ = 1" group="eigenvectors" />
    </Plot>
  );
}
```

