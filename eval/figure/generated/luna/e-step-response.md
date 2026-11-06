A second-order system’s **step response** shows how its output changes after its input jumps from 0 to 1. The damping ratio $\zeta$ controls the shape: low damping causes more overshoot and ringing; high damping gives a slower, smoother rise.

For a standard system with natural frequency $\omega_n$ and damping ratio $\zeta$:

$$
H(s)=\frac{\omega_n^2}{s^2+2\zeta\omega_n s+\omega_n^2}
$$

Here $H(s)$ is the output-to-input ratio in the Laplace domain. The figure fixes $\omega_n=1$ rad/s and lets you change $\zeta$. At $\zeta=0.5$, the response peaks at about $1.16$ before settling to $1$.

```figure
export const params = {
  zeta: { label: 'Damping ratio ζ', min: 0.05, max: 2, step: 0.05, value: 0.5 }
};

export default function ({ zeta }) {
  function response(t) {
    if (zeta < 1 - 1e-8) {
      const wd = Math.sqrt(1 - zeta * zeta);
      return 1 - Math.exp(-zeta * t) *
        (Math.cos(wd * t) + zeta / wd * Math.sin(wd * t));
    }
    if (zeta <= 1 + 1e-8) return 1 - Math.exp(-t) * (1 + t);

    const root = Math.sqrt(zeta * zeta - 1);
    const r1 = -zeta + root;
    const r2 = -zeta - root;
    const a = -r2 / (r1 - r2);
    const b = r1 / (r1 - r2);
    return 1 - a * Math.exp(r1 * t) - b * Math.exp(r2 * t);
  }

  return (
    <Figure
      title={`Unit-step response, ζ = ${zeta}`}
      render={() => (
        <Plot id="response-plot" x={[0, 12]} y={[0, 2]} xLabel="Time (s)" yLabel="Output">
          <Fn id="step-response" f={response} from={0} to={12} label="Output y(t)" />
          <Fn id="target-level" f={() => 1} from={0} to={12} label="Target = 1" />
        </Plot>
      )}
    />
  );
}
```

