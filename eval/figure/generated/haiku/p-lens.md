Drag the slider to move the object. Focal length is 10 cm. Object height is fixed at 3 cm.

```figure
export const params = {
  u: { label: 'Object distance', min: 5, max: 30, step: 1, value: 20, unit: 'cm' },
};

const f = 10;   // focal length, cm
const h = 3;    // object height, cm
const PAR = 'Parallel ray';
const CEN = 'Central ray';
const FOC = 'Focal ray';

export default function ({ u }) {
  const atF = u === f;                        // object at F: refracted rays are parallel
  const v = atF ? NaN : (u * f) / (u - f);    // image distance, from 1/u + 1/v = 1/f
  const real = v > 0;
  const hi = atF ? NaN : -(v / u) * h;        // image height, negative means inverted
  const m = -v / u;                            // magnification
  const hMax = atF ? h : Math.max(h, Math.abs(hi));

  const xs = [-u, 0, f, ...(atF ? [] : [v])];
  const L = Math.min(...xs) - 5;
  const R = Math.max(...xs) + 5;
  const W = R - L;
  const A = 1.15 * hMax;                      // lens half-height
  const T = A + 2;                            // vertical margin
  const H = 2 * T;
  const P = (x, y) => [x - L, y + T];         // shift so the drawing sits in [0, W] x [0, H]

  const parY = x => h * (1 - x / f);          // parallel ray after the lens, aimed at F'
  const cenY = x => -(h / u) * x;             // central ray, undeviated

  const S = [];
  const add = (x0, y0, x1, y1, g, s) => S.push({ x0, y0, x1, y1, g, s });

  // Parallel ray: object to lens, then through F'
  add(-u, h, 0, h, PAR);
  if (atF) add(0, h, R, parY(R), PAR);
  else if (real) { add(0, h, v, hi, PAR); add(v, hi, R, parY(R), PAR, 'dim'); }
  else { add(0, h, R, parY(R), PAR); add(v, hi, 0, h, PAR, 'dim'); }

  // Central ray: straight through the lens centre
  add(-u, h, 0, 0, CEN);
  if (real && !atF) { add(0, 0, v, hi, CEN); add(v, hi, R, cenY(R), CEN, 'dim'); }
  else { add(0, 0, R, cenY(R), CEN); if (!atF) add(v, hi, 0, 0, CEN, 'dim'); }

  // Focal ray: through F on the object side, leaves parallel to the axis
  if (real && !atF) {
    add(-u, h, 0, hi, FOC);
    add(0, hi, v, hi, FOC);
    add(v, hi, R, hi, FOC, 'dim');
  }

  const w = 0.03 * W;                         // half-thickness of the lens
  const lens = [];
  for (let k = 0; k <= 20; k++) { const q = -1 + k / 10; lens.push(P(w * (1 - q * q), q * A)); }
  for (let k = 20; k >= 0; k--) { const q = -1 + k / 10; lens.push(P(-w * (1 - q * q), q * A)); }

  const nature = atF ? 'at infinity' : real ? 'real, inverted' : 'virtual, upright';

  return (
    <Column gap="md">
      <Diagram width={W} height={H}>
        <Segment from={P(L, 0)} to={P(R, 0)} state="dim" />
        <Shape pts={lens} closed />
        {S.map((s, i) => <Segment id={`ray-${i}`} from={P(s.x0, s.y0)} to={P(s.x1, s.y1)} group={s.g} state={s.s} />)}
        <Points pts={[P(-f, 0), P(f, 0)]} />
        <Label at={P(-f, -1.2)} text="$F$" />
        <Label at={P(f, -1.2)} text="$F'$" />
        <Label at={P(0, A + 0.8)} text="lens" />
        <Vector from={P(-u, 0)} to={P(-u, h)} label="object" />
        {!atF && <Vector from={P(v, 0)} to={P(v, hi)} label={real ? 'real image' : 'virtual image'} state={real ? 'active' : 'dim'} />}
      </Diagram>
      <Tex tex={String.raw`\frac{1}{${u}}+\frac{1}{v}=\frac{1}{${f}}`} />
      <Row gap="md" align="start">
        <Node label={atF ? '∞' : v.toFixed(1) + ' cm'} sub="image distance" />
        <Node label={atF ? '∞' : m.toFixed(2)} sub="magnification" />
        <Node label={nature} sub="image" />
      </Row>
    </Column>
  );
}
```

Three rays leave the top of the object:

1. Parallel to the axis. After the lens it passes through F′.
2. Through the centre of the lens. It goes straight on.
3. Through F on the object side (only when u > 10 cm). After the lens it leaves parallel to the axis.

Where the rays meet is the image. Dim lines are continuations past a real image, or backward extensions to a virtual image.

Not checked: the figure has not been rendered in the host, so the layout and label placement are unverified. Object height is fixed at 3 cm, not a slider.