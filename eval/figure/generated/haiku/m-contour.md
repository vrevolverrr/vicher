A level curve joins the points where $f$ has one fixed value, like a contour line on a map. The gradient points in the direction $f$ grows fastest, and it is perpendicular to the level curve through that point.

For a value $c$, the level curve is

$$\{(x,y) : f(x,y) = c\}$$

and the gradient is the vector of partial derivatives:

$$\nabla f = \left(\frac{\partial f}{\partial x},\ \frac{\partial f}{\partial y}\right)$$

For $f(x,y) = x^2 - y^2$, the gradient is $\nabla f = (2x,\ -2y)$. The level curves satisfy $x^2 - y^2 = c$:

- $c = 0$: the lines $y = x$ and $y = -x$ cross at the origin.
- $c > 0$: hyperbolas that open left and right.
- $c < 0$: hyperbolas that open up and down.

```figure
const L = 3;   // the box runs from -3 to 3 on both axes
const N = 60;  // samples per curve

// The level curve x^2 - y^2 = c, as one or two polylines.
function branches(c) {
  if (c === 0) return [[[-L, -L], [L, L]], [[-L, L], [L, -L]]];
  if (c > 0) {
    const ymax = Math.sqrt(L * L - c);
    const right = [], left = [];
    for (let i = 0; i <= N; i++) {
      const y = -ymax + (2 * ymax * i) / N;
      const x = Math.sqrt(c + y * y);
      right.push([x, y]);
      left.push([-x, y]);
    }
    return [right, left];
  }
  const k = -c;
  const xmax = Math.sqrt(L * L - k);
  const top = [], bottom = [];
  for (let i = 0; i <= N; i++) {
    const x = -xmax + (2 * xmax * i) / N;
    const y = Math.sqrt(x * x + k);
    top.push([x, y]);
    bottom.push([x, -y]);
  }
  return [top, bottom];
}

const signGroup = c => (c > 0 ? 'f > 0' : c < 0 ? 'f < 0' : 'f = 0');

export default function () {
  const levels = [-4, -2, -1, 0, 1, 2, 4];
  const points = [[1, 0], [2, 1], [0, 2], [-2, -1]];
  const s = 0.25;   // arrows drawn at one quarter of true length

  return (
    <Plot x={[-L, L]} y={[-L, L]} xLabel="$x$" yLabel="$y$" equal>
      {levels.flatMap(c => branches(c).map((pts, j) => (
        <Shape pts={pts} group={signGroup(c)} label={j === 0 ? String.raw`$f=${c}$` : undefined} />
      )))}
      {points.map(([x, y]) => {
        const gx = 2 * x, gy = -2 * y;   // grad f = (2x, -2y)
        return (
          <>
            <Points pts={[[x, y]]} label={String.raw`$(${x},${y})$`} />
            <Vector from={[x, y]} to={[x + s * gx, y + s * gy]} group="gradient"
              label={String.raw`$\nabla f=(${gx},${gy})$`} />
          </>
        );
      })}
    </Plot>
  );
}
```

The curves are coloured by the sign of $c$. The four arrows show $\nabla f$ at $(1,0)$, $(2,1)$, $(0,2)$ and $(-2,-1)$.

**Worked example at $(2,1)$**

The height there is $f(2,1) = 2^2 - 1^2 = 3$, so the level curve through the point is $x^2 - y^2 = 3$. The gradient is

$$\nabla f(2,1) = (2\cdot 2,\ -2\cdot 1) = (4,\ -2)$$

To check it is perpendicular to the curve, differentiate $x^2 - y^2 = 3$ implicitly: $2x\,dx - 2y\,dy = 0$. The tangent direction is therefore $(y, x) = (1, 2)$. The dot product is $(4,-2)\cdot(1,2) = 4 - 4 = 0$.

The gradient fails to give a direction at the origin, where $\nabla f = (0,0)$. There the curves cross, and the origin is a saddle point.