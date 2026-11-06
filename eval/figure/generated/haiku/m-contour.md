Level curves: $c=0$ gives the lines $y=\pm x$, $c\neq 0$ gives hyperbolas. Gradient: $\nabla f=(2x,\,-2y)$.

```figure
const levels = [-4, -1, 0, 1, 4];
const pts = [[1, 0], [0, 1], [2, 1], [1, 2]];
const k = 0.25;                       // arrow length per unit of gradient
const grad = (x, y) => [2 * x, -2 * y];

export default function () {
  return (
    <Plot id="plot" x={[-3, 3]} y={[-3, 3]} xLabel="x" yLabel="y">
      {levels.map(c => {
        const g = c < 0 ? 'f < 0' : c === 0 ? 'f = 0' : 'f > 0';
        return (
          <>
            <Fn id={`up${c}`} f={x => Math.sqrt(x * x - c)} label={`$f=${c}$`} group={g} />
            <Fn id={`down${c}`} f={x => -Math.sqrt(x * x - c)} group={g} />
          </>
        );
      })}
      <Points id="base" pts={pts} />
      {pts.map(([x, y], i) => {
        const [gx, gy] = grad(x, y);
        return <Vector id={`g${i}`} from={[x, y]} to={[x + k * gx, y + k * gy]} label="$\nabla f$" group="gradient" />;
      })}
    </Plot>
  );
}
```

**Level curves.** A level curve is the set of points where $f(x,y)=c$ for one fixed value $c$. Different level curves never cross. For this $f$:

$$x^2-y^2=c$$

- $c=0$: the lines $y=x$ and $y=-x$, which cross at the origin.
- $c>0$: two branches opening left and right, with vertices at $(\pm\sqrt{c},\,0)$.
- $c<0$: two branches opening up and down, with vertices at $(0,\,\pm\sqrt{-c})$.

**Gradient.** The gradient collects the partial derivatives. It points in the direction in which $f$ increases fastest:

$$\nabla f=\left(\frac{\partial f}{\partial x},\ \frac{\partial f}{\partial y}\right)$$

Here $\partial f/\partial x=2x$ and $\partial f/\partial y=-2y$, so $\nabla f=(2x,\,-2y)$.

Worked example at $(2,1)$: $f(2,1)=4-1=3$, so the point lies on the curve $c=3$. The gradient is $\nabla f(2,1)=(4,\,-2)$. The tangent to that curve has slope $y'=x/y=2$, so the tangent direction is $(1,2)$. Check: $(4,-2)\cdot(1,2)=4-4=0$. The gradient is perpendicular to the level curve.

| Point | $f$ | $\nabla f$ |
|---|---|---|
| $(1,0)$ | $1$ | $(2,\,0)$ |
| $(0,1)$ | $-1$ | $(0,\,-2)$ |
| $(2,1)$ | $3$ | $(4,\,-2)$ |
| $(1,2)$ | $-3$ | $(2,\,-4)$ |

The gradient is zero only at the origin. There the level curves cross, so the perpendicular rule gives no direction.

Not checked: the figure has not been rendered in the pane. I did not verify the Fn branch joins at $c=0$ visually.