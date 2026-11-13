```figure
export const params = {
  u: { label: 'Object distance u', min: 4, max: 40, step: 1, value: 25, unit: 'cm' },
};

const f = 10;   // focal length, cm
const h = 3;    // object height, cm
const XE = 40;  // drawing edge left and right, cm
const YE = 12;  // drawing edge top and bottom, cm
const H = 8;    // lens half-height, cm
const a = 1.2;  // lens half-thickness at the axis, cm

// End of a ray that leaves E with slope s, going right (dir 1) or left (dir -1), stopped at the drawing edge.
function edge(E, s, dir = 1) {
  let x = dir * XE, y = E[1] + s * (x - E[0]);
  if (Math.abs(y) > YE) { y = Math.sign(y) * YE; x = E[0] + (y - E[1]) / s; }
  return [x, y];
}

// Biconvex lens outline: two arcs meeting at the top and bottom.
const lens = [];
for (let i = 0; i <= 16; i++) { const y = -H + (2 * H * i) / 16; lens.push([-a * (1 - (y / H) ** 2), y]); }
for (let i = 16; i >= 0; i--) { const y = -H + (2 * H * i) / 16; lens.push([a * (1 - (y / H) ** 2), y]); }

export default function ({ u }) {
  const atF = Math.abs(u - f) < 1e-9;           // object at F: no image, rays leave parallel
  const real = u > f;
  const v = atF ? 0 : (u * f) / (u - f);        // image distance; negative means virtual
  const m = atF ? 0 : -v / u;                   // magnification
  const hi = m * h;                             // image height; negative means inverted
  const show = !atF && Math.abs(v) <= XE;       // image inside drawing

  const rays = [
    { g: 'ray 1: parallel to axis', E: [0, h], s: -h / f },
    { g: 'ray 2: through centre', E: [0, 0], s: -h / u },
  ];
  if (real) rays.push({ g: 'ray 3: through F', E: [0, (-h * f) / (u - f)], s: 0 });

  const fmt = x => x.toFixed(1);

  return (
    <Figure
      title="Converging lens, f = 10 cm"
      steps={[0]}
      render={() => (
        <Column gap="md">
          <Diagram width={2 * XE + 4} height={2 * YE + 4}>
            <Segment from={[-XE, 0]} to={[XE, 0]} state="dim" />
            <Shape pts={lens} closed group="lens" />
            <Points pts={[[-f, 0], [f, 0]]} />
            <Label at={[-f, -1.4]} text="$F$" />
            <Label at={[f, -1.4]} text="$F'$" />
            <Vector from={[-u, 0]} to={[-u, h]} group="object" label="object" />
            {show && <Vector from={[v, 0]} to={[v, hi]} group="image" label={real ? 'image' : 'virtual image'} />}
            {rays.map(r => (
              <>
                <Segment from={[-u, h]} to={r.E} group={r.g} />
                <Segment from={r.E} to={edge(r.E, r.s)} group={r.g} />
                {!real && !atF && <Segment from={r.E} to={edge(r.E, r.s, -1)} state="dim" />}
              </>
            ))}
          </Diagram>
          <Table
            columns={['Quantity', 'Value']}
            rows={[
              ['Object distance u', `${fmt(u)} cm`],
              ['Image distance v', atF ? 'infinity' : `${fmt(v)} cm`],
              ['Magnification m', atF ? 'infinity' : fmt(m)],
              ['Image', atF ? 'none, rays leave parallel' : `${real ? 'real, inverted' : 'virtual, upright'}${show ? '' : ', off the drawing'}`],
            ]}
          />
        </Column>
      )}
    />
  );
}
```

Drag the slider to move the object. The three rays from the object tip:

- **Ray 1:** parallel to the axis, then through F′ (real and virtual cases).
- **Ray 2:** through the optical centre, undeviated (real and virtual cases).
- **Ray 3:** through F on the object side, then parallel to the axis (real image only).

Dashed lines are the virtual extensions for u < f. At u = 10 cm the image is at infinity, so no image is drawn.

Not checked: I did not render the figure. The code assumes the Diagram origin is centred on the lens. If the host places the origin at a corner, the lens and rays will be off-centre.