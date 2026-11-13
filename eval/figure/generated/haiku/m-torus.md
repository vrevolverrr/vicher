Torus with $R = 2$ and $r = 0.5$:

```figure
const R = 2;     // major radius: centre of the tube to centre of the hole
const r = 0.5;   // minor radius: radius of the tube

export default function () {
  return (
    <Plot id="torus" x={[-3, 3]} y={[-3, 3]} z={[-1, 1]} xLabel="x" yLabel="y" zLabel="z" equal>
      <Fn id="surface" f={(u, v) => [(R + r * Math.cos(v)) * Math.cos(u), (R + r * Math.cos(v)) * Math.sin(u), r * Math.sin(v)]} u={[0, 2 * Math.PI]} v={[0, 2 * Math.PI]} />
    </Plot>
  );
}
```

The surface uses these parametric equations, where $u$ goes around the hole and $v$ goes around the tube:

$$\begin{aligned} x &= (R + r\cos v)\cos u \\ y &= (R + r\cos v)\sin u \\ z &= r\sin v \end{aligned}$$

Skipped: sliders for $R$ and $r$, since you gave fixed values. Not checked: the figure has not been rendered in the viewer.