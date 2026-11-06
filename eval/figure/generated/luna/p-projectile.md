Projectile motion combines steady horizontal motion with vertical motion accelerated by gravity. With a launch speed of $20\text{ m/s}$, the angle slider shows how the path, range, and maximum height change. The figure assumes level ground and ignores air resistance.

For launch angle $\theta$, speed $v$, and gravitational acceleration $g=9.8\text{ m/s}^2$, the range and maximum height are:

$$R = \frac{v^2\sin(2\theta)}{g}$$

$$H = \frac{v^2\sin^2(\theta)}{2g}$$

At $45^\circ$, the range is $400/9.8 \approx 40.8\text{ m}$. The maximum height is $400(0.5)/19.6 \approx 10.2\text{ m}$.

```figure
export const params = {
  angle: { label: 'Launch angle', min: 5, max: 85, step: 1, value: 45, unit: '°' }
};

export default function ({ angle }) {
  const v = 20;
  const g = 9.8;
  const theta = angle * Math.PI / 180;
  const range = v * v * Math.sin(2 * theta) / g;
  const height = v * v * Math.sin(theta) ** 2 / (2 * g);
  const apexX = range / 2;
  const yMax = Math.max(height * 1.3, 1);
  const xMax = Math.max(range * 1.12, 1);
  const yMin = -yMax * 0.12;
  const steps = [{
    angle,
    range,
    height,
    apexX,
    xMax,
    yMax,
    yMin
  }];

  return (
    <Figure steps={steps} render={step => (
      <Plot id="projectile-plot" x={[0, step.xMax]} y={[step.yMin, step.yMax]}
        xLabel="Horizontal distance (m)" yLabel="Height (m)">
        <Fn id="trajectory"
          f={x => x * Math.tan(theta) - g * x * x / (2 * v * v * Math.cos(theta) ** 2)}
          from={0} to={step.range} label="trajectory" />
        <Segment id="range" from={[0, 0]} to={[step.range, 0]}
          label={`Range: ${step.range.toFixed(1)} m`} />
        <Segment id="height" from={[step.apexX, 0]} to={[step.apexX, step.height]}
          label={`Maximum height: ${step.height.toFixed(1)} m`} />
        <Points id="apex-point" pts={[[step.apexX, step.height]]} label="apex" />
      </Plot>
    )} />
  );
}
```

