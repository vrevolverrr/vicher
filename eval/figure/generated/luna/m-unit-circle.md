On the unit circle, the point at angle $\theta$ has horizontal coordinate $\cos\theta$ and vertical coordinate $\sin\theta$. The colored segments show those signed coordinate lengths.

$$
(\cos\theta,\ \sin\theta)
$$

```figure
export const params = {
  theta: { label: 'Angle θ', min: 0, max: 360, step: 1, value: 45, unit: '°' }
};

export default function ({ theta }) {
  const rad = theta * Math.PI / 180;
  const x = Math.cos(rad);
  const y = Math.sin(rad);
  const circle = Array.from({ length: 97 }, (_, i) => {
    const a = 2 * Math.PI * i / 96;
    return [Math.cos(a), Math.sin(a)];
  });
  const arc = Array.from({ length: 25 }, (_, i) => {
    const a = rad * i / 24;
    return [0.24 * Math.cos(a), 0.24 * Math.sin(a)];
  });

  return (
    <Row gap="lg" align="center">
      <Diagram width={2.8} height={2.8}>
        <Shape pts={circle} closed label="unit circle" />
        <Shape pts={[[-1.2, 0], [1.2, 0]]} label="x" />
        <Shape pts={[[0, -1.2], [0, 1.2]]} label="y" />
        <Shape pts={arc} label="θ" />
        <Segment from={[0, 0]} to={[x, y]} label="radius 1" />
        <Segment from={[0, 0]} to={[x, 0]} label="cos θ" group="cos" />
        <Segment from={[x, 0]} to={[x, y]} label="sin θ" group="sin" />
        <Points pts={[[x, y], [x, 0]]} />
      </Diagram>
      <Column gap="sm">
        <Node label={x.toFixed(3)} sub="cos θ" group="cos" />
        <Node label={y.toFixed(3)} sub="sin θ" group="sin" />
      </Column>
    </Row>
  );
}
```

