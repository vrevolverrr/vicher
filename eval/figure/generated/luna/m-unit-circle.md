On the unit circle, the point at angle $\theta$ has coordinates $(\cos\theta,\sin\theta)$. The horizontal and vertical sides of the triangle show those components; their signs indicate direction.

For example, at $\theta=60^\circ$, the horizontal component is $\cos\theta=0.5$ and the vertical component is $\sin\theta\approx0.87$.

```figure
export const params = {
  theta: { label: 'θ', min: 0, max: 360, step: 5, value: 60, unit: '°' }
};

export default function ({ theta }) {
  const radians = theta * Math.PI / 180;
  const x = Math.cos(radians);
  const y = Math.sin(radians);
  const arc = Array.from({ length: Math.max(2, Math.ceil(theta / 5) + 1) }, (_, i) => {
    const a = radians * i / Math.max(1, Math.ceil(theta / 5));
    return [0.38 * Math.cos(a), 0.38 * Math.sin(a)];
  });

  return (
    <Diagram width={3} height={3}>
      <Circle id="circle" at={[0, 0]} r={1} />
      <Segment id="x-axis" from={[-1.3, 0]} to={[1.3, 0]} />
      <Segment id="y-axis" from={[0, -1.3]} to={[0, 1.3]} />
      <Shape id="angle-arc" pts={arc} />
      <Segment id="radius" from={[0, 0]} to={[x, y]} />
      <Segment id="cos-length" from={[0, 0]} to={[x, 0]} label="$\\cos\\theta$" />
      <Segment id="sin-length" from={[x, 0]} to={[x, y]} label="$\\sin\\theta$" />
      <Points id="point" pts={[[x, y]]} label={`(${x.toFixed(2)}, ${y.toFixed(2)})`} />
      <Label id="theta-label" at={[0.53 * Math.cos(radians / 2), 0.53 * Math.sin(radians / 2)]} text="$\\theta$" />
    </Diagram>
  );
}
```

