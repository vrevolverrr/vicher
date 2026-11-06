```figure
export const params = {
  angle: { label: 'Incline angle', min: 5, max: 60, step: 1, value: 30, unit: '°' },
};

export default function ({ angle }) {
  const th = angle * Math.PI / 180;
  const c = Math.cos(th), s = Math.sin(th);
  const m = 5, g = 9.8;                 // mass (kg), gravity (m/s²)
  const k = 0.06;                       // drawing units per newton
  const wt = m * g;                     // weight (N)
  const nf = wt * c;                    // normal force, block at rest (N)
  const ff = wt * s;                    // static friction, block at rest (N)
  const A = [2, 1], B = [2 + 10 * c, 1], C = [2 + 10 * c, 1 + 10 * s];  // ramp; θ sits at A
  const u = [c, s], n = [-s, c];        // up the slope, out of the surface
  const at = (p, a, d) => [p[0] + a * u[0] + d * n[0], p[1] + a * u[1] + d * n[1]];
  const S = at(A, 5, 0);                // contact point on the slope
  const b = 1.6, h = b / 2;             // block side
  const cen = at(S, 0, h);              // centre of the block
  const wTip = [cen[0], cen[1] - wt * k];
  const nTip = [cen[0] + n[0] * nf * k, cen[1] + n[1] * nf * k];
  const fTip = [cen[0] + u[0] * ff * k, cen[1] + u[1] * ff * k];

  return (
    <Row gap="md" align="center">
      <Diagram width={14} height={11}>
        <Shape pts={[A, B, C]} closed />
        <Segment from={[A[0] - 1, A[1]]} to={[B[0] + 1, A[1]]} />
        <Shape pts={[at(S, -h, 0), at(S, h, 0), at(S, h, b), at(S, -h, b)]} closed state="dim" />
        <Points pts={[cen]} />
        <Vector from={cen} to={wTip} label="$mg$" />
        <Vector from={cen} to={nTip} label="$N$" />
        <Vector from={cen} to={fTip} label="$f_s$" />
        <Angle at={A} from={B} to={C} label="$\theta$" />
        <Label at={at(A, 7, -0.8)} text="rough" />
      </Diagram>
      <Column gap="sm">
        <Node label={`${wt.toFixed(1)} N`} sub="weight, $mg$" />
        <Node label={`${nf.toFixed(1)} N`} sub="normal, $N$" />
        <Node label={`${ff.toFixed(1)} N`} sub="friction, $f_s$" />
        <Tex tex="N = mg\cos\theta" />
        <Tex tex="f_s = mg\sin\theta" />
      </Column>
    </Row>
  );
}
```

Drag the slider to change $\theta$. The arrows are to scale with each other.

- Weight $mg$ acts straight down.
- Normal $N$ acts perpendicular to the surface.
- Friction $f_s$ acts up the slope and stops the block from sliding.

The values use $m = 5$ kg and $g = 9.8$ m/s². The friction formula holds only while the block stays at rest, that is while $\tan\theta \le \mu_s$. Past that angle the block slides, and friction becomes kinetic.

Not checked: the figure was not rendered in this session. The coefficient of friction is not in the figure, so the slip angle is not shown.