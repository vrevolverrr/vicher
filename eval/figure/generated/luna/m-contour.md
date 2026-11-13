I’ll show several hyperbolas for constant values of \(f\), then mark three points with gradient arrows.

A **level curve** joins points where $f$ has the same value. The **gradient** points in the direction of fastest increase and is perpendicular to the level curve at that point.

$$
\nabla f(x,y)=\left(\frac{\partial f}{\partial x},\frac{\partial f}{\partial y}\right)=(2x,-2y)
$$

At $(2,1)$, $f=3$ and $\nabla f=(4,-2)$, so the gradient points right and down, across the curve $f=3$. The arrows below are shortened to fit the plot.

```figure
const t = Array.from({ length: 81 }, (_, i) => -3 + 6 * i / 80);
const levels = [-8, -4, 0, 4, 8];

export default function () {
  return (
    <Plot x={[-4, 4]} y={[-4, 4]} xLabel="x" yLabel="y">
      {levels.filter(c => c > 0).flatMap(c =>
        [-1, 1].map((sign, i) => (
          <Shape
            id={`pos${c}${i}`}
            group="level curves"
            pts={t.map(y => [sign * Math.sqrt(c + y * y), y])}
          />
        ))
      )}
      {levels.filter(c => c < 0).flatMap(c =>
        [-1, 1].map((sign, i) => (
          <Shape
            id={`neg${-c}${i}`}
            group="level curves"
            pts={t.map(x => [x, sign * Math.sqrt(-c + x * x)])}
          />
        ))
      )}
      <Shape id="zeroA" group="level curves" pts={t.map(v => [v, v])} />
      <Shape id="zeroB" group="level curves" pts={t.map(v => [v, -v])} />

      <Label at={[1.5, 3.25]} text="$f=-8$" />
      <Label at={[2.2, 2.7]} text="$f=-4$" />
      <Label at={[2.8, 2.8]} text="$f=0$" />
      <Label at={[2.7, 2.15]} text="$f=4$" />
      <Label at={[3.25, 1.65]} text="$f=8$" />

      <Points id="p1" pts={[[2, 1]]} label="(2, 1)" group="sample points" />
      <Points id="p2" pts={[[1, 2]]} label="(1, 2)" group="sample points" />
      <Points id="p3" pts={[[-2, -1]]} label="(−2, −1)" group="sample points" />
      <Vector id="g1" from={[2, 1]} to={[3.4, 0.3]} label="$\\nabla f$" group="gradients" />
      <Vector id="g2" from={[1, 2]} to={[1.7, 0.6]} label="$\\nabla f$" group="gradients" />
      <Vector id="g3" from={[-2, -1]} to={[-3.4, -0.3]} label="$\\nabla f$" group="gradients" />
    </Plot>
  );
}
```

