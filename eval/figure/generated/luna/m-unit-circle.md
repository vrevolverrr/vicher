On the unit circle, the point at angle $\theta$ has horizontal coordinate $\cos\theta$ and vertical coordinate $\sin\theta$. The radius is 1, and the two coordinates are the signed lengths of its projections onto the axes.

```figure
export const params = {
  theta: { label: 'Angle θ', min: 0, max: 360, step: 1, value: 40, unit: '°' }
};

export default function ({ theta }) {
  const rad = theta * Math.PI / 180;
  const x = Math.cos(rad);
  const y = Math.sin(rad);
  const point = [x, y];
  const arc = Array.from({ length: 25 }, (_, i) => {
    const a = rad * i / 24;
    return [0.24 * Math.cos(a), 0.24 * Math.sin(a)];
  });
  const mid = rad / 2;
  const fmt = n => n.toFixed(2);

  return (
    <Column gap="md">
      <Row gap="lg" align="center">
        <Diagram width={2.8} height={2.8}>
          <Segment from={[-1.2, 0]} to={[1.2, 0]} group="axis" />
          <Segment from={[0, -1.2]} to={[0, 1.2]} group="axis" />
          <Circle at={[0, 0]} r={1} group="circle" />
          <Shape pts={arc} group="angle" />
          <Label at={[0.34 * Math.cos(mid), 0.34 * Math.sin(mid)]} text="θ" group="angle" />
          <Segment from={[0, 0]} to={point} label="radius = 1" group="radius" />
          <Segment from={[0, 0]} to={[x, 0]} label="cos θ" group="cosine" />
          <Segment from={[x, 0]} to={point} label="sin θ" group="sine" />
          <Points pts={[point]} label="(cos θ, sin θ)" />
        </Diagram>
        <Column gap="sm">
          <Node label={fmt(x)} sub="cos θ" group="cosine" />
          <Node label={fmt(y)} sub="sin θ" group="sine" />
        </Column>
      </Row>
      <Text>Move the angle slider. The signed projections give the coordinates; a negative value points left or down.</Text>
    </Column>
  );
}
```

At the starting angle, $40^\circ$, the point is about $(0.77, 0.64)$, so $\cos 40^\circ \approx 0.77$ and $\sin 40^\circ \approx 0.64$.

  
