```figure
const R = 2;     // major radius: distance from the centre of the hole to the centre of the tube
const r = 0.5;   // minor radius: radius of the tube

export default function () {
  return (
    <Plot id="torus" x={[-3, 3]} y={[-3, 3]} z={[-1, 1]} xLabel="x" yLabel="y" zLabel="z" equal>
      <Fn id="surface"
        f={(u, v) => [(R + r * Math.cos(v)) * Math.cos(u), (R + r * Math.cos(v)) * Math.sin(u), r * Math.sin(v)]}
        u={[0, 2 * Math.PI]} v={[0, 2 * Math.PI]} />
    </Plot>
  );
}
```

Parametric form, with $u$ going around the ring and $v$ around the tube:

$$\begin{aligned} x &= (R + r\cos v)\cos u \\ y &= (R + r\cos v)\sin u \\ z &= r\sin v \end{aligned}$$

With $R = 2$ and $r = 0.5$, the surface spans $1.5 \le \sqrt{x^2+y^2} \le 2.5$ and $|z| \le 0.5$.

Not checked: I did not render the figure here, so confirm it draws in the Vicher pane. Risk: none known.