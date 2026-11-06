A matrix moves every point of a shape. Here it turns the unit square into a parallelogram. Two directions keep their line through the origin, and those are the eigenvectors.

```figure
const square = [[0, 0], [1, 0], [1, 1], [0, 1]];
const apply = ([x, y]) => [2 * x + y, x + 2 * y];
const image = square.map(apply);

export default function () {
  return (
    <Diagram id="map" width={4.5} height={4.5}>
      <Shape id="sq" pts={square} closed label="unit square" group="unit square" />
      <Shape id="par" pts={image} closed label="image" group="image of square" />
      <Points id="corners" pts={image} group="image of square" />
      <Vector id="v1" from={[0, 0]} to={[1, 1]} label="v₁ = (1,1)" group="eigenvector" />
      <Vector id="v1img" from={[0, 0]} to={[3, 3]} label="A v₁ = 3v₁" group="eigenvector" />
      <Vector id="v2" from={[0, 0]} to={[1, -1]} label="v₂ = (1,-1)" group="eigenvector" />
      <Label id="l1" at={[2, 1]} text="(2,1)" />
      <Label id="l2" at={[3, 3]} text="(3,3)" />
      <Label id="l3" at={[1, 2]} text="(1,2)" />
    </Diagram>
  );
}
```

An **eigenvector** is a nonzero vector $\mathbf{v}$ that the matrix only scales. Its scale factor is the **eigenvalue** $\lambda$:

$$A\mathbf{v}=\lambda\mathbf{v}$$

To find the eigenvalues, solve $\det(A-\lambda I)=0$:

$$(2-\lambda)^2-1=(\lambda-1)(\lambda-3)=0$$

So $\lambda=1$ or $\lambda=3$. For each value, solve $(A-\lambda I)\mathbf{v}=0$:

- $\lambda=3$: $-x+y=0$, so $\mathbf{v}_1=(1,1)$.
- $\lambda=1$: $x+y=0$, so $\mathbf{v}_2=(1,-1)$.

Check: $A(1,1)=(3,3)=3(1,1)$ and $A(1,-1)=(1,-1)=1(1,-1)$.

The square's corners map as follows: $(1,0)\to(2,1)$, $(0,1)\to(1,2)$, $(1,1)\to(3,3)$, and the origin stays fixed. The image has corners $(0,0)$, $(2,1)$, $(3,3)$, $(1,2)$.

Not verified: how the figure fits in your pane. The layout assumes the host fits the drawing to its bounds.