Drag the θ slider above the figure. The radius is 1, so cos θ is the x-coordinate and sin θ is the y-coordinate of the point on the circle.

```figure
export const params = {
  theta: { label: 'θ', min: 0, max: 360, step: 1, value: 45, unit: '°' },
};

export default function ({ theta }) {
  const t = theta * Math.PI / 180;
  const c = Math.cos(t);
  const s = Math.sin(t);
  const fmt = v => (Math.abs(v) < 1e-9 ? 0 : v).toFixed(3);
  const arc = [];
  for (let k = 0; k <= 40; k++) {
    const a = t * k / 40;
    arc.push([0.25 * Math.cos(a), 0.25 * Math.sin(a)]);
  }
  const mid = t / 2;

  return (
    <Row gap="lg" align="center">
      <Plot id="circle" x={[-1.3, 1.3]} y={[-1.3, 1.3]} equal xLabel="x" yLabel="y">
        <Circle at={[0, 0]} r={1} />
        <Shape pts={arc} />
        <Segment id="radius" from={[0, 0]} to={[c, s]} label="1" group="radius" />
        <Segment id="cos" from={[0, 0]} to={[c, 0]} label={String.raw`$\cos\theta$`} group="cosine" />
        <Segment id="sin" from={[c, 0]} to={[c, s]} label={String.raw`$\sin\theta$`} group="sine" />
        <Points pts={[[c, s]]} />
        <Label at={[0.32 * Math.cos(mid), 0.32 * Math.sin(mid)]} text={String.raw`$\theta$`} />
      </Plot>
      <Column gap="md">
        <Node label={fmt(c)} sub="$\cos\theta$ (x)" />
        <Node label={fmt(s)} sub="$\sin\theta$ (y)" />
      </Column>
    </Row>
  );
}
```

Not checked: the layout at a narrow pane width.