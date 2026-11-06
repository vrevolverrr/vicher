A second-order system has two energy stores that pass energy back and forth, like a mass on a spring. Its **step response** is how it moves when you suddenly apply a constant input. The **damping ratio** $\zeta$ sets how quickly that back-and-forth dies out.

The system follows this equation, with input $u(t)$ and output $y(t)$:

$$\ddot{y} + 2\zeta\omega_n\dot{y} + \omega_n^2 y = \omega_n^2\,u(t)$$

Here $\omega_n$ is the natural frequency in rad/s, $\zeta$ is the damping ratio (no units), and dots mean time derivatives. For a unit step from rest with $\zeta<1$, the solution is:

$$y(t) = 1 - e^{-\zeta\omega_n t}\left(\cos\omega_d t + \frac{\zeta}{\sqrt{1-\zeta^2}}\sin\omega_d t\right)$$

where $\omega_d = \omega_n\sqrt{1-\zeta^2}$ is the damped frequency. The three regimes are:

- **$\zeta < 1$, underdamped:** rings and overshoots the final value.
- **$\zeta = 1$, critically damped:** the fastest rise with no overshoot.
- **$\zeta > 1$, overdamped:** no overshoot, but a slow rise.

**Worked example:** $\zeta = 0.5$, $\omega_n = 1$ rad/s. Then $\omega_d = \sqrt{0.75} = 0.866$ rad/s, and the first peak comes at $t = \pi/\omega_d = 3.63$ s. The peak height is set by:

$$M_p = e^{-\pi\zeta/\sqrt{1-\zeta^2}} = e^{-1.81} \approx 0.163$$

So the output peaks at 1.163, which is 16.3% above the final value of 1.

```figure
export const params = { zeta: { label: 'Damping ratio ζ', min: 0, max: 2, step: 0.05, value: 0.5 } };

export default function ({ zeta }) {
  const wn = 1;
  const T = 12;
  const under = zeta < 1 - 1e-6;
  const crit = Math.abs(zeta - 1) <= 1e-6;
  const wd = wn * Math.sqrt(Math.abs(1 - zeta * zeta));
  const r = Math.sqrt(Math.abs(zeta * zeta - 1));
  const s1 = -wn * (zeta - r);
  const s2 = -wn * (zeta + r);
  const y = t => {
    if (under) return 1 - Math.exp(-zeta * wn * t) * (Math.cos(wd * t) + zeta / Math.sqrt(1 - zeta * zeta) * Math.sin(wd * t));
    if (crit) return 1 - Math.exp(-wn * t) * (1 + wn * t);
    return 1 + (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s1 - s2);
  };
  const regime = under ? 'underdamped' : crit ? 'critically damped' : 'overdamped';
  const over = under ? Math.exp(-zeta * Math.PI / Math.sqrt(1 - zeta * zeta)) * 100 : 0;
  const peak = under ? [Math.PI / wd, 1 + over / 100] : null;

  return (
    <Column gap="md">
      <Plot id="plot" x={[0, T]} y={[0, 2.2]} xLabel="$\omega_n t$" yLabel="$y(t)$">
        <Segment id="final" from={[0, 1]} to={[T, 1]} label="$y=1$" state="dim" />
        <Fn id="resp" f={y} label="$y(t)$" />
        {peak && <Points id="peak" pts={[peak]} label="peak" />}
      </Plot>
      <Row gap="md">
        <Node id="regime" label={regime} sub={`ζ = ${zeta.toFixed(2)}`} />
        <Node id="over" label={`${over.toFixed(1)}%`} sub="overshoot" />
      </Row>
    </Column>
  );
}
```

Drag the slider to change $\zeta$. Lower values ring more. Near $\zeta = 1$ the curve settles fastest without overshoot.

Not checked: I did not render the figure, so the slider behavior is untested.