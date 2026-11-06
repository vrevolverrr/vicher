I’ll show the square and its image in one coordinate drawing, with arrows along the two eigenvector directions.

The matrix sends each point $(x,y)$ to $(2x+y,\;x+2y)$. An **eigenvector** keeps its direction under this transformation; its eigenvalue gives the scale factor. Here, $(1,1)$ is scaled by $3$, while $(1,-1)$ keeps its length.

```figure
export default function () {
  return (
    <Diagram width={4} height={4}>
      <Shape pts={[[0, 0], [1, 0], [1, 1], [0, 1]]} closed label="Unit square" group="unit square" />
      <Shape pts={[[0, 0], [2, 1], [3, 3], [1, 2]]} closed label="Transformed square" group="image" />
      <Vector from={[0, 0]} to={[1, 1]} label="(1, 1), λ = 3" group="eigenvectors" />
      <Vector from={[0, 0]} to={[1, -1]} label="(1, −1), λ = 1" group="eigenvectors" />
    </Diagram>
  );
}
```

