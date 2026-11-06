Drag the θ slider. The horizontal segment is cos θ (the x-coordinate of the point on the circle) and the vertical segment is sin θ (the y-coordinate).

```figure
export const params = { theta: { label: 'Angle θ', min: 0, max: 360, step: 1, value: 40, unit: '°' } };

const fmt = v => Number(v.toFixed(3));

export default function ({ theta }) {
  const t = theta * Math.PI / 180;
  const c = Math.cos(t);
  const s = Math.sin(t);
  const arc = [];
  for (let k = 0; k <= 60; k++) {
    const a = t * k / 60;
    arc.push([0.3 * Math.cos(a), 0.3 * Math.sin(a)]);
  }
  const mid = t / 2;

  return (
    <Row gap="lg" align="center">
      <Plot id="plot" x={[-1.5, 1.5]} y={[-1.5, 1.5]} xLabel="x" yLabel="y" equal>
        <Circle id="unit" at={[0, 0]} r={1} />
        <Shape id="arc" pts={arc} group="angle" />
        <Label id="thetaLabel" at={[0.4 * Math.cos(mid), 0.4 * Math.sin(mid)]} text={String.raw`$\theta$`} />
        <Vector id="radius" from={[0, 0]} to={[c, s]} label="r = 1" group="radius" />
        <Segment id="cos" from={[0, 0]} to={[c, 0]} label={String.raw`$\cos\theta = ${fmt(c)}$`} group="cos θ" />
        <Segment id="sin" from={[c, 0]} to={[c, s]} label={String.raw`$\sin\theta = ${fmt(s)}$`} group="sin θ" />
        <Points id="point" pts={[[c, s]]} />
      </Plot>
      <Column gap="md">
        <Text>{`θ = ${theta}°`}</Text>
        <Node id="cosCard" label={`${fmt(c)}`} sub="cos θ" />
        <Node id="sinCard" label={`${fmt(s)}`} sub="sin θ" />
      </Column>
    </Row>
  );
}
```

Skipped: a radians toggle and a labelled arc for angles past 360°. Not checked: I did not render the figure, so confirm the segments and labels appear at θ = 0°, 90° and 180°.