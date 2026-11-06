Drag the **Launch angle** slider. The plot marks the range R, the max height H, and the flight time T for a launch at 20 m/s.

```figure
export const params = { angle: { label: 'Launch angle', min: 5, max: 85, step: 5, value: 45, unit: '°' } };

export default function ({ angle }) {
  const g = 9.8;                       // m/s², gravity
  const v = 20;                        // m/s, launch speed
  const th = angle * Math.PI / 180;
  const vx = v * Math.cos(th);
  const vy = v * Math.sin(th);
  const T = 2 * vy / g;                // flight time
  const R = vx * T;                    // range on flat ground
  const H = vy * vy / (2 * g);         // max height
  const xa = R / 2;                    // x where the peak occurs
  const traj = x => x * Math.tan(th) - g * x * x / (2 * vx * vx);

  return (
    <Column gap="md">
      <Plot id="plot" x={[0, 45]} y={[0, 25]} xLabel="$x$ (m)" yLabel="$y$ (m)" equal>
        <Fn id="path" f={traj} from={0} to={R} />
        <Segment id="ground" from={[0, 0]} to={[R, 0]} state="active" />
        <Segment id="height" from={[xa, 0]} to={[xa, H]} state="done" />
        <Points id="land" pts={[[R, 0]]} label={`$R = ${R.toFixed(1)}$ m`} />
        <Points id="apex" pts={[[xa, H]]} label={`$H = ${H.toFixed(1)}$ m`} />
      </Plot>
      <Row gap="md">
        <Node id="n-range" label={`${R.toFixed(1)} m`} sub="Range R" />
        <Node id="n-height" label={`${H.toFixed(1)} m`} sub="Max height H" />
        <Node id="n-time" label={`${T.toFixed(2)} s`} sub="Flight time T" />
      </Row>
    </Column>
  );
}
```

At 45° the range is 40.8 m and the max height is 10.2 m. The range is largest at 45°.

Formulas for flat ground, launch from ground level, no air drag, $g = 9.8$ m/s²:

$$R = \frac{v^2 \sin 2\theta}{g}$$

$$H = \frac{v^2 \sin^2 \theta}{2g}$$

Here $v$ is the launch speed and $\theta$ is the launch angle.

Skipped: air drag, a launch height above ground, and a speed slider (fixed at 20 m/s as requested).