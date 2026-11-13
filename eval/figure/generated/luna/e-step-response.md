A second-order system’s **step response** shows how its output changes after a sudden constant input. The damping ratio $\zeta$ controls how much it overshoots and how quickly it settles. For a unit step, I’ve fixed the natural frequency at $1$ rad/s so you can explore the effect of changing $\zeta$.

$$
G(s)=\frac{1}{s^2+2\zeta s+1}
$$

```figure
export const params = {
  zeta: { label: 'Damping ratio ζ', min: 0.1, max: 2.5, step: 0.1, value: 0.5 }
};

export default function ({ zeta }) {
  const response = t => {
    if (zeta < 1 - 1e-6) {
      const wd = Math.sqrt(1 - zeta * zeta);
      return 1 - Math.exp(-zeta * t) *
        (Math.cos(wd * t) + (zeta / wd) * Math.sin(wd * t));
    }
    if (zeta <= 1 + 1e-6) {
      return 1 - Math.exp(-t) * (1 + t);
    }
    const root = Math.sqrt(zeta * zeta - 1);
    const r1 = -zeta + root;
    const r2 = -zeta - root;
    return 1 + (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r1 - r2);
  };

  return (
    <Plot id="step-response" x={[0, 12]} y={[-0.3, 1.8]} xLabel="Time (s)" yLabel="Output">
      <Fn id="response" f={response} from={0} to={12} label="Output to a unit step" />
    </Plot>
  );
}
```

