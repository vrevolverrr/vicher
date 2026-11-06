A **level curve** connects points where $f(x,y)$ has the same value. For $f(x,y)=x^2-y^2$, the curve at height $c$ satisfies:

$$x^2-y^2=c$$

The **gradient** points in the direction of greatest increase and is perpendicular to the level curve:

$$\nabla f(x,y)=(2x,-2y)$$

For example, at $(1,1)$, $f=0$ and $\nabla f=(2,-2)$, shown by an arrow on the zero curve.

```figure
const sample = (fn, count = 41) =>
  Array.from({ length: count }, (_, i) => fn(-1.3 + (2.6 * i) / (count - 1)));

const levels = [-4, -1, 0, 1, 4];

export default function () {
  const curves = levels.flatMap(c => {
    if (c === 0) {
      return [
        { id: 'zero-up', c, pts: sample(t => [t, t]) },
        { id: 'zero-down', c, pts: sample(t => [t, -t]) }
      ];
    }
    if (c > 0) {
      const r = Math.sqrt(c);
      return [-1, 1].map((side, i) => ({
        id: `level-${c}-${i}`,
        c,
        pts: sample(t => [side * r * Math.cosh(t), r * Math.sinh(t)])
      }));
    }
    const r = Math.sqrt(-c);
    return [-1, 1].map((side, i) => ({
      id: `level-${Math.abs(c)}-${i}`,
      c,
      pts: sample(t => [r * Math.sinh(t), side * r * Math.cosh(t)])
    }));
  });

  return (
    <Plot x={[-4, 4]} y={[-4, 4]} xLabel="x" yLabel="y" equal>
      {curves.map(curve => (
        <Shape
          key={curve.id}
          id={curve.id}
          pts={curve.pts}
          group={`f = ${curve.c}`}
        />
      ))}
      <Points id="gradient-points" pts={[[1, 0], [0, 1], [1, 1]]} />
      <Vector id="grad-a" from={[1, 0]} to={[3, 0]} label="(2, 0)" group="gradient" />
      <Vector id="grad-b" from={[0, 1]} to={[0, -1]} label="(0, −2)" group="gradient" />
      <Vector id="grad-c" from={[1, 1]} to={[3, -1]} label="(2, −2)" group="gradient" />
    </Plot>
  );
}
```

