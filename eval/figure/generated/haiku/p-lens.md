Drag the slider to move the object. The lens has f = 10 cm.

```figure
export const params = {
  u: { label: 'Object distance u', min: 12, max: 45, step: 1, value: 30, unit: 'cm' },
};

const f = 10;    // focal length (cm)
const h = 4;     // object height (cm)
const X0 = 50;   // lens position in the drawing (cm)
const Y0 = 30;   // principal axis height in the drawing (cm)
const W = 120;
const H = 60;

export default function ({ u }) {
  const v = (u * f) / (u - f);   // image distance, from 1/f = 1/u + 1/v
  const m = -v / u;              // magnification, negative means inverted
  const hi = m * h;              // signed image height
  const P = [X0 - u, Y0 + h];    // object tip
  const I = [X0 + v, Y0 + hi];   // image tip
  const T = [X0, Y0 + h];        // parallel ray meets lens
  const B = [X0, Y0 + hi];       // focal ray meets lens

  return (
    <Column gap="md">
      <Row gap="lg" align="center">
        <Diagram id="optics" width={W} height={H}>
          <Segment from={[0, Y0]} to={[W, Y0]} state="dim" />
          <Segment id="lens" from={[X0, Y0 - 14]} to={[X0, Y0 + 14]} group="lens" />
          <Points pts={[[X0 - f, Y0], [X0 + f, Y0]]} />
          <Label at={[X0 - f, Y0 - 3]} text="$F$" />
          <Label at={[X0 + f, Y0 - 3]} text="$F'$" />
          <Vector id="object" from={[X0 - u, Y0]} to={P} label="$O$" group="object" />
          <Segment from={P} to={T} group="parallel" />
          <Segment from={T} to={I} group="parallel" />
          <Segment from={P} to={I} group="central" />
          <Segment from={P} to={B} group="focal" />
          <Segment from={B} to={I} group="focal" />
          <Vector id="image" from={[X0 + v, Y0]} to={I} label="$I$" group="image" />
        </Diagram>
        <Column gap="md">
          <Node label={`${v.toFixed(1)} cm`} sub="image distance v" />
          <Node label={m.toFixed(2)} sub="magnification m" />
          <Node label="Real, inverted" sub="image type" />
        </Column>
      </Row>
      <Tex tex={String.raw`\frac{1}{${f}} = \frac{1}{${u}} + \frac{1}{${v.toFixed(1)}}`} />
    </Column>
  );
}
```

The three rays from the object tip: the parallel ray bends through $F'$, the central ray goes straight through the lens centre, and the focal ray leaves the lens parallel to the axis. All three meet at the image tip.

Not checked: how the pane places the Diagram origin. I assumed it starts at bottom-left, so the lens sits at x = 50 cm. Skipped: an object-height slider and 2F markers. The slider starts at 12 cm, because at u = 10 cm the image is at infinity.