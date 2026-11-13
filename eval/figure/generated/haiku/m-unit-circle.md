```figure
export const params = { theta: { label: 'Angle', min: 0, max: 360, step: 1, value: 40, unit: '°' } };

export default function ({ theta }) {
  const rad = theta * Math.PI / 180;
  const ox = 1.4, oy = 1.3;
  const px = ox + Math.cos(rad), py = oy + Math.sin(rad);
  const s = Math.sin(rad), c = Math.cos(rad);
  const arc = [];
  for (let i = 0; i <= 60; i++) {
    const t = rad * i / 60;
    arc.push([ox + 0.3 * Math.cos(t), oy + 0.3 * Math.sin(t)]);
  }
  const mid = rad / 2;
  return (
    <Row gap="lg" align="center">
      <Diagram id="unit" width={2.8} height={2.6}>
        <Segment id="x-axis" from={[0.1, oy]} to={[2.7, oy]} />
        <Segment id="y-axis" from={[ox, 0.1]} to={[ox, 2.5]} />
        <Circle id="circle" at={[ox, oy]} r={1} />
        <Segment id="radius" from={[ox, oy]} to={[px, py]} />
        <Segment id="cos" from={[ox, oy]} to={[px, oy]} group="cos θ" label="$\cos\theta$" />
        <Segment id="sin" from={[px, oy]} to={[px, py]} group="sin θ" label="$\sin\theta$" />
        <Shape id="arc" pts={arc} />
        <Label id="angle-label" at={[ox + 0.45 * Math.cos(mid), oy + 0.45 * Math.sin(mid)]} text="$\theta$" />
        <Points id="P" pts={[[px, py]]} label="P" />
      </Diagram>
      <Column gap="md">
        <Node id="cos-node" label={c.toFixed(3)} sub={String.raw`$\cos\theta$`} />
        <Node id="sin-node" label={s.toFixed(3)} sub={String.raw`$\sin\theta$`} />
      </Column>
    </Row>
  );
}
```

Drag the Angle slider. The vertical segment is sin θ and the horizontal segment is cos θ. The cards show their values.

Not checked: I did not render the figure. I assumed `Diagram` coordinates run from 0 to `width` and 0 to `height`, with the origin at the bottom left. If the circle sits off-centre, that assumption is wrong. The arc is a `Shape` I compute, not the `Angle` element, so it does not depend on which side `Angle` measures.