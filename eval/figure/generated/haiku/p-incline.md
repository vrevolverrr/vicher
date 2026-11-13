Drag the slider to change the angle θ. The arrows are drawn to scale against the weight W, so the normal force shrinks and the friction grows as the incline steepens.

```figure
export const params = { angle: { label: 'Incline angle', min: 5, max: 60, step: 1, value: 30, unit: '°' } };

export default function ({ angle }) {
  const t = angle * Math.PI / 180;
  const c = Math.cos(t), s = Math.sin(t);
  const O = [1, 1];                        // bottom-left corner of the incline
  const L = 9;                             // length of the slope
  const b = L * c, h = L * s;              // base and height of the incline
  const u = [c, s], n = [-s, c];           // unit vectors: up the slope, and out of the surface
  const at = (p, d, k) => [p[0] + d[0] * k, p[1] + d[1] * k];
  const C = at(at(O, u, 4.5), n, 0.5);     // centre of a 1 x 1 block resting mid-slope
  const sq = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, k]) => at(at(C, u, a * 0.5), n, k * 0.5));
  const W = [0, -3];                       // weight, drawn 3 units long
  const N = [3 * c * n[0], 3 * c * n[1]];  // normal, length 3 cos θ
  const F = [3 * s * u[0], 3 * s * u[1]];  // friction, length 3 sin θ
  const tip = (p, v) => [p[0] + v[0], p[1] + v[1]];
  const top = [O[0] + b, O[1] + h], foot = [O[0] + b, O[1]];

  return (
    <Figure steps={[{ angle }]} render={() => (
      <Row gap="lg" align="center">
        <Diagram width={11} height={10}>
          <Shape pts={[O, foot, top]} closed group="Incline" />
          <Shape pts={sq} closed group="Block" />
          <Angle at={O} from={foot} to={top} label="$\theta$" />
          <RightAngle at={foot} from={O} to={top} />
          <Vector from={C} to={tip(C, W)} label="$W = mg$" group="Weight" />
          <Vector from={C} to={tip(C, N)} label="$N = mg\cos\theta$" group="Normal" />
          <Vector from={C} to={tip(C, F)} label="$f = mg\sin\theta$" group="Friction" />
        </Diagram>
        <Column gap="md">
          <Node label={`N = ${c.toFixed(2)} W`} sub="$mg\cos\theta$" />
          <Node label={`f = ${s.toFixed(2)} W`} sub="$mg\sin\theta$" />
        </Column>
      </Row>
    )} />
  );
}
```

With the block at rest, the forces balance along and across the slope:

$$f = mg\sin\theta$$

$$N = mg\cos\theta$$

Here $W = mg$ is the weight, $N$ is the normal force from the surface, and $f$ is the static friction up the slope. The block stays at rest only if $\mu_s \ge \tan\theta$. Above that angle it slides, and the balance above no longer holds.