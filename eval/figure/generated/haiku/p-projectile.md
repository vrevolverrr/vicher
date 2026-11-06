```figure
export const params = {
  angle: { label: 'Launch angle', min: 1, max: 89, step: 1, value: 45, unit: '°' },
};

const v = 20;   // launch speed, m/s
const g = 9.8;  // gravity, m/s²

export default function ({ angle }) {
  const th = angle * Math.PI / 180;
  const vx = v * Math.cos(th);
  const vy = v * Math.sin(th);
  const T = 2 * vy / g;        // flight time
  const R = vx * T;            // range
  const H = vy * vy / (2 * g); // maximum height

  const pts = [];
  for (let i = 0; i <= 80; i++) {
    const t = T * i / 80;
    pts.push([vx * t, vy * t - g * t * t / 2]);
  }

  return (
    <Row gap="lg" align="center">
      <Plot id="plot" x={[0, 45]} y={[0, 25]} xLabel="x (m)" yLabel="y (m)" equal>
        <Shape id="path" pts={pts} />
        <Segment id="range" from={[0, 0]} to={[R, 0]} label={`R = ${R.toFixed(1)} m`} />
        <Segment id="height" from={[R / 2, 0]} to={[R / 2, H]} label={`H = ${H.toFixed(1)} m`} />
        <Points id="apex" pts={[[R / 2, H]]} />
        <Points id="land" pts={[[R, 0]]} />
      </Plot>
      <Column gap="md">
        <Node id="R" label={`${R.toFixed(2)} m`} sub="range" />
        <Node id="H" label={`${H.toFixed(2)} m`} sub="maximum height" />
        <Node id="T" label={`${T.toFixed(2)} s`} sub="flight time" />
      </Column>
    </Row>
  );
}
```

Drag the slider to change the angle. The path, range R, and maximum height H update.

Formulas, with $v = 20$ m/s and $g = 9.8$ m/s² (no air drag):

$$T = \frac{2v\sin\theta}{g}$$

$$R = \frac{v^2\sin 2\theta}{g}$$

$$H = \frac{v^2\sin^2\theta}{2g}$$

Here $T$ is flight time in seconds, $\theta$ is the launch angle, and $R$ and $H$ are in metres. At $\theta = 45°$: $R = 400 \times 1 / 9.8 = 40.8$ m and $H = 400 \times 0.5 / 19.6 = 10.2$ m.

Not done: drag, wind, and launch from a height above the ground. Not checked: the figure was not rendered in the app here, so confirm the layout once in the pane.