```figure
export const params = {
  angle: { label: 'Launch angle', min: 5, max: 85, step: 1, value: 45, unit: '°' }
};

export default function ({ angle }) {
  const v = 20;
  const g = 9.8;
  const th = angle * Math.PI / 180;
  const vx = v * Math.cos(th);
  const vy = v * Math.sin(th);
  const R = v * v * Math.sin(2 * th) / g;
  const H = vy * vy / (2 * g);
  const xApex = vx * vy / g;
  const path = x => x * Math.tan(th) - g * x * x / (2 * vx * vx);

  return (
    <Column gap="md">
      <Plot id="plot" x={[0, 50]} y={[0, 25]} xLabel="x (m)" yLabel="y (m)" equal>
        <Fn id="path" f={path} from={0} to={R} label="trajectory" />
        <Segment id="range" from={[0, 0]} to={[R, 0]} label={`R = ${R.toFixed(1)} m`} />
        <Segment id="h" from={[xApex, 0]} to={[xApex, H]} label={`H = ${H.toFixed(1)} m`} />
        <Points id="apex" pts={[[xApex, H]]} label="max height" />
        <Points id="land" pts={[[R, 0]]} label="landing" />
      </Plot>
      <Row gap="md">
        <Node id="rangeNode" label={`${R.toFixed(1)} m`} sub="range R" />
        <Node id="hNode" label={`${H.toFixed(1)} m`} sub="max height H" />
      </Row>
    </Column>
  );
}
```

Move the **Launch angle** slider to change the path. The range $R$ is the horizontal distance to landing. The height $H$ is the peak above the ground.

$$R = \frac{v_0^2 \sin 2\theta}{g}$$

$$H = \frac{v_0^2 \sin^2\theta}{2g}$$

Here $v_0 = 20$ m/s is the launch speed, $\theta$ is the launch angle, and $g = 9.8$ m/s² is gravity. At 45°, $R \approx 40.8$ m and $H \approx 10.2$ m.

Not checked: I did not render the figure in the pane. The model ignores air resistance and assumes flat ground.