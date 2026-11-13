Each level curve is the set of points where $f$ has one fixed value $c$. For $f(x, y) = x^2 - y^2$, the curves $x^2 - y^2 = c$ are hyperbolas, and the arrows show the gradient at four points.

```figure
export default function () {
  const B = 3;                                    // plot box is [-B, B] on both axes
  const grad = (x, y) => [2 * x, -2 * y];         // gradient of f = x^2 - y^2
  const inBox = ([x, y]) => Math.abs(x) <= B && Math.abs(y) <= B;
  const trace = fn => Array.from({ length: 241 }, (_, i) => fn(-4 + i * 8 / 240)).filter(inBox);
  const group = c => (c > 0 ? 'c > 0' : c < 0 ? 'c < 0' : 'c = 0');

  // Each level c is a set of branches. Each branch is a parametric curve clipped to the box.
  const levels = [-4, -2, -1, 0, 1, 2, 4].map(c => {
    if (c === 0) return { c, branches: [trace(t => [t, t]), trace(t => [t, -t])] };
    if (c > 0) {
      const a = Math.sqrt(c);
      return { c, branches: [trace(t => [a * Math.cosh(t), a * Math.sinh(t)]), trace(t => [-a * Math.cosh(t), a * Math.sinh(t)])] };
    }
    const s = Math.sqrt(-c);
    return { c, branches: [trace(t => [s * Math.sinh(t), s * Math.cosh(t)]), trace(t => [s * Math.sinh(t), -s * Math.cosh(t)])] };
  });

  const P = [[1, 0], [2, 1], [0, 2], [-1, 1]];    // points where the gradient is drawn
  const k = 0.2;                                  // arrow length per unit of gradient

  return (
    <Figure title="Level curves of x^2 - y^2 with gradient arrows (arrows scaled by 0.2)" steps={[0]} render={() => (
      <Plot id="plot" x={[-B, B]} y={[-B, B]} xLabel="x" yLabel="y" equal>
        {levels.flatMap(({ c, branches }, i) => branches.map((b, j) => (
          <>
            <Shape key={`${i}-${j}`} id={`lvl${i}-${j}`} pts={b} group={group(c)} label={j === 0 ? `$c=${c}$` : undefined} />
            {j === 0 && <Label at={b[b.length - 1]} text={`$c=${c}$`} />}
          </>
        )))}
        {P.map((p, i) => {
          const [gx, gy] = grad(p[0], p[1]);
          return (
            <>
              <Points id={`pt${i}`} pts={[p]} label={`(${p[0]}, ${p[1]})`} />
              <Vector id={`g${i}`} from={p} to={[p[0] + k * gx, p[1] + k * gy]} label={i === 0 ? String.raw`$\nabla f$` : undefined} group="gradient" />
            </>
          );
        })}
      </Plot>
    )} />
  );
}
```

The gradient is

$$\nabla f = \left(\frac{\partial f}{\partial x}, \frac{\partial f}{\partial y}\right) = (2x,\ -2y)$$

It points uphill, and it is perpendicular to the level curve through its point.

**Worked example at (2, 1).** $f = 4 - 1 = 3$, so the point lies on the $c = 3$ hyperbola. $\nabla f = (4, -2)$. Differentiate $x^2 - y^2 = 3$ implicitly: $2x - 2y\,y' = 0$, so $y' = x/y = 2$ and a tangent vector is $(1, 2)$. The dot product is $(4)(1) + (-2)(2) = 0$, so the gradient is perpendicular to the curve.

The curves with $c > 0$ open left and right. The curves with $c < 0$ open up and down. The $c = 0$ level is the two lines $y = \pm x$, which cross at the origin, where $\nabla f = (0, 0)$.