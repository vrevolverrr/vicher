```figure
export const params = { angle: { label: 'Incline angle θ', min: 0, max: 60, step: 1, value: 30, unit: '°' } };

const m = 5, g = 9.8;            // block mass (kg), gravity (m/s²)
const W = m * g;                 // weight (N)
const k = 0.02;                  // drawn arrow length per newton
const L = 4.5, a = 1.0, s = 2.2; // slope length, block side, block position up the slope
const O = [0.8, 0.8];            // foot of the slope

const add = (p, q, k2 = 1) => [p[0] + k2 * q[0], p[1] + k2 * q[1]];

export default function ({ angle }) {
  const th = angle * Math.PI / 180;
  const t = [Math.cos(th), Math.sin(th)];     // up the slope
  const n = [-Math.sin(th), Math.cos(th)];    // out of the surface
  const top = add(O, t, L);
  const base = [top[0], O[1]];
  const P = add(O, t, s);                     // surface point under the block
  const c = add(P, n, a / 2);                 // block centre
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
    .map(([i, j]) => add(add(c, t, i * a / 2), n, j * a / 2));
  const N = W * Math.cos(th);                 // normal force
  const f = W * Math.sin(th);                 // static friction, up the slope
  const steps = [{ th: angle }];

  return (
    <Figure steps={steps} title="Block on a rough incline" caption={() => String.raw`Block of mass $m = 5$ kg at rest, $\theta = ${angle}^\circ$. Arrow lengths are proportional to force. Friction $f$ acts up the slope because gravity pulls the block down it.`} render={() => (
      <Row gap="lg" align="center">
        <Diagram id="fbd" width={6} height={5.5}>
          <Shape id="ramp" pts={[O, top, base]} closed />
          <Shape id="block" pts={corners} closed label="$m$" />
          <Vector id="W" from={c} to={add(c, [0, -1], W * k)} label="$W$" />
          <Vector id="N" from={c} to={add(c, n, N * k)} label="$N$" />
          <Vector id="f" from={c} to={add(c, t, f * k)} label="$f$" />
          <Angle id="theta" at={O} from={[O[0] + 1.2, O[1]]} to={top} label="$\theta$" />
        </Diagram>
        <Column gap="md">
          <Node id="cardW" label={`${W.toFixed(1)} N`} sub="$W = mg$, weight, down" />
          <Node id="cardN" label={`${N.toFixed(1)} N`} sub="$N = mg\cos\theta$, normal" />
          <Node id="cardF" label={`${f.toFixed(1)} N`} sub="$f = mg\sin\theta$, friction" />
        </Column>
      </Row>
    )} />
  );
}
```

Drag the θ slider to change the angle. Not modeled: the friction coefficient μs and sliding. The figure assumes the block stays at rest.