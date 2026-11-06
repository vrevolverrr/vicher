Drag the ζ slider. The plot redraws the unit step response of $\dfrac{\omega_n^2}{s^2+2\zeta\omega_n s+\omega_n^2}$ with $\omega_n = 1$ rad/s.

```figure
export const params = { z: { label: 'Damping ratio ζ', min: 0, max: 2, step: 0.01, value: 0.3 } };

const wn = 1; // natural frequency, rad/s

// Unit step response, t >= 0
function resp(t, z) {
  if (Math.abs(z - 1) < 1e-6) return 1 - Math.exp(-wn * t) * (1 + wn * t);
  if (z < 1) {
    const wd = wn * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * wn * t) * (Math.cos(wd * t) + (z / Math.sqrt(1 - z * z)) * Math.sin(wd * t));
  }
  const r = Math.sqrt(z * z - 1);
  const s1 = wn * (-z + r), s2 = wn * (-z - r);
  return 1 + (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s1 - s2);
}

export default function ({ z }) {
  // Scan 0 to 200 s for the peak and the last time outside the 2 % band
  let peak = 0, peakT = 0, last = 0;
  for (let t = 0; t <= 200; t += 0.05) {
    const v = resp(t, z);
    if (v > peak) { peak = v; peakT = t; }
    if (Math.abs(v - 1) > 0.02) last = t;
  }
  const overshoot = Math.max(0, peak - 1) * 100;
  const hasOvershoot = overshoot > 0.05;
  const settle = last > 199 ? '> 200 s' : `${last.toFixed(1)} s`;
  const peakText = hasOvershoot ? `${peakT.toFixed(2)} s` : 'none';

  let regime;
  if (z < 1e-9) regime = 'Undamped: it rings forever.';
  else if (Math.abs(z - 1) < 1e-6) regime = 'Critically damped: fastest rise with no overshoot.';
  else if (z < 1) regime = 'Underdamped: it overshoots, then rings down.';
  else regime = 'Overdamped: no overshoot, but slower.';

  return (
    <Column gap="md">
      <Row gap="lg" align="center">
        <Plot id="plot" x={[0, 40]} y={[0, 2.2]} xLabel="$t$ (s)" yLabel="$y(t)$">
          <Fn id="resp" f={t => resp(t, z)} from={0} to={40} label="$y(t)$" />
          <Segment id="final" from={[0, 1]} to={[40, 1]} label="final value" />
        </Plot>
        <Column gap="sm">
          <Node id="os" label={`${overshoot.toFixed(1)} %`} sub="overshoot" />
          <Node id="tp" label={peakText} sub="peak time" />
          <Node id="ts" label={settle} sub="settling time, 2 %" />
        </Column>
      </Row>
      <Text>{`**ζ = ${z.toFixed(2)}**: ${regime}`}</Text>
    </Column>
  );
}
```

ζ below 1 overshoots. ζ = 1 is the boundary between the two behaviours. Above 1 the response is slow with no overshoot.