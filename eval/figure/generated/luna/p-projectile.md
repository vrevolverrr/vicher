With no air resistance and level launch and landing ground, a projectile follows a curved path. Changing the launch angle changes how far it travels and how high it rises.

For launch speed $v$ and angle $\theta$, the range $R$ and maximum height $H$ are:

$$R = \frac{v^2\sin(2\theta)}{g}$$

$$H = \frac{v^2\sin^2(\theta)}{2g}$$

Here $g = 9.8\ \text{m/s}^2$. At $20\ \text{m/s}$ and $45^\circ$, the range is about $40.8\ \text{m}$ and the maximum height is about $10.2\ \text{m}$.

```figure
export const params = {
  angle: { label: 'Launch angle', min: 10, max: 80, step: 1, value: 45, unit: '°' }
};

export default function ({ angle }) {
  const speed = 20;
  const gravity = 9.8;
  const radians = angle * Math.PI / 180;
  const range = speed * speed * Math.sin(2 * radians) / gravity;
  const height = speed * speed * Math.sin(radians) ** 2 / (2 * gravity);
  const apexX = range / 2;

  return (
    <Figure
      steps={[{ range, height, apexX }]}
      title="Projectile path"
      render={step => (
        <Column gap="md">
          <Plot id="trajectory" x={[0, 42]} y={[0, 22]} xLabel="Horizontal distance (m)" yLabel="Height (m)">
            <Fn id="path" f={x => x * Math.tan(radians) - gravity * x * x / (2 * speed * speed * Math.cos(radians) ** 2)} from={0} to={step.range} label="Path" />
            <Segment id="range-mark" from={[0, 0]} to={[step.range, 0]} label={`Range: ${step.range.toFixed(1)} m`} />
            <Segment id="height-mark" from={[step.apexX, 0]} to={[step.apexX, step.height]} label={`Max height: ${step.height.toFixed(1)} m`} />
            <Points id="key-points" pts={[[step.range, 0], [step.apexX, step.height]]} />
            <Label id="apex-label" at={[step.apexX, step.height]} text="Peak" />
          </Plot>
          <Row gap="md">
            <Node id="angle-card" label={`${angle}°`} sub="Launch angle" />
            <Node id="range-card" label={`${step.range.toFixed(1)} m`} sub="Range" />
            <Node id="height-card" label={`${step.height.toFixed(1)} m`} sub="Maximum height" />
          </Row>
        </Column>
      )}
    />
  );
}
```

