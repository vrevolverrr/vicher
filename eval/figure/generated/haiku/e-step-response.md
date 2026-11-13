The plot shows the output $y(t)$ when the input steps from 0 to 1. The damping ratio $\zeta$ sets whether the output rings, settles fast, or creeps. Move the slider above the plot to change $\zeta$. The plot redraws on each change.

With natural frequency $\omega_n = 1$, the system is

$$G(s)=\frac{\omega_n^2}{s^2+2\zeta\omega_n s+\omega_n^2}$$

For $\zeta < 1$ (underdamped), the output overshoots its final value of 1 by

$$M_p = e^{-\pi\zeta/\sqrt{1-\zeta^2}}$$

Worked example at $\zeta = 0.3$: $\sqrt{1-0.09} = 0.954$, so $M_p = e^{-0.988} \approx 0.372$. The output peaks at 1.37, which is 37 % above the final value.

At $\zeta = 1$ (critically damped) the output reaches 1 fastest with no overshoot. Above 1 (overdamped) it is slower still.

```figure
export const params = { zeta: { label: 'Damping ratio ζ', min: 0, max: 2, step: 0.05, value: 0.3 } };

// unit step response of G(s) = 1/(s² + 2ζs + 1), ωn = 1
function stepResponse(t, z) {
  if (Math.abs(z - 1) < 1e-3) return 1 - Math.exp(-t) * (1 + t);
  if (z < 1) {
    const wd = Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * t) * (Math.cos(wd * t) + (z / wd) * Math.sin(wd * t));
  }
  const r = Math.sqrt(z * z - 1);
  const s1 = -z + r, s2 = -z - r;
  return 1 + (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s1 - s2);
}

export default function ({ zeta }) {
  const z = zeta;
  const under = z < 1 - 1e-3;
  const overshoot = under ? 100 * Math.exp(-Math.PI * z / Math.sqrt(1 - z * z)) : 0;
  const regime = Math.abs(z - 1) < 1e-3 ? 'Critically damped' : under ? 'Underdamped' : 'Overdamped';
  return (
    <Row gap="lg" align="center">
      <Plot id="plot" x={[0, 15]} y={[0, 2.5]} xLabel="t" yLabel="y(t)">
        <Fn id="resp" f={t => stepResponse(t, z)} label="y(t)" />
        <Segment id="target" from={[0, 1]} to={[15, 1]} label="steady state" state="dim" />
      </Plot>
      <Column gap="md">
        <Node id="regime" label={regime} sub={`ζ = ${z.toFixed(2)}`} />
        <Node id="os" label={`${overshoot.toFixed(1)} %`} sub="overshoot" />
      </Column>
    </Row>
  );
}
```

Not checked: I did not render the figure, so the slider is untested in the app. Risk: none known; the y-axis range of 0 to 2.5 covers every peak for $\zeta \ge 0$.