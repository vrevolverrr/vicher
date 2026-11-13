A projectile’s **range** is how far it travels horizontally before landing. Its **maximum height** is the highest point on its path. Assuming it lands at launch height and ignoring air resistance, both depend on the launch angle $\theta$:

$$
R = \frac{v^2 \sin(2\theta)}{g}
$$

$$
H = \frac{v^2 \sin^2(\theta)}{2g}
$$

Here $v$ is launch speed and $g = 9.8\ \text{m/s}^2$ is gravitational acceleration. At $v = 20\ \text{m/s}$ and $\theta = 45^\circ$, the range is about $40.8\ \text{m}$ and the maximum height is about $10.2\ \text{m}$.

```figure
export const params = {
  angle: { label: 'Launch angle', min: 10, max: 80, step: 1, value: 45, unit: '°' }
};

export default function ({ angle }) {
  const v = 20;
  const g = 9.8;
  const radians = angle * Math.PI / 180;
  const range = v * v * Math.sin(2 * radians) / g;
  const height = v * v * Math.sin(radians) ** 2 / (2 * g);
  const apexX = range / 2;
  const pathY = x => x * Math.tan(radians) - g * x * x / (2 * v * v * Math.cos(radians) ** 2);

  return (
    <Plot
      id="flight"
      x={[0, range * 1.12]}
      y={[0, height * 1.35]}
      xLabel="Horizontal distance (m)"
      yLabel="Height (m)"
    >
      <Fn id="trajectory" f={pathY} from={0} to={range} label="Flight path" />
      <Segment from={[0, 0]} to={[range, 0]} label={`Range: ${range.toFixed(1)} m`} />
      <Segment from={[apexX, 0]} to={[apexX, height]} label={`Max height: ${height.toFixed(1)} m`} />
      <Points pts={[[apexX, height]]} label="Peak" />
    </Plot>
  );
}
```

