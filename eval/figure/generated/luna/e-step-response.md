A second-order system’s **step response** shows how its output changes after its input suddenly jumps from 0 to 1. The damping ratio $\zeta$ controls the shape: low damping causes overshoot and ringing, while greater damping reduces oscillation.

For a standard system with natural frequency set to 1, the output $y$ follows

$$
y'' + 2\zeta y' + y = u(t)
$$

Here $u(t)$ is the unit step input, and $\zeta$ is the damping ratio. For $0 < \zeta < 1$, the response is

$$
y(t)=1-e^{-\zeta t}\left(\cos(\omega_d t)+\frac{\zeta}{\omega_d}\sin(\omega_d t)\right),
\qquad
\omega_d=\sqrt{1-\zeta^2}
$$

For example, at $\zeta=0.3$, the output rises past 1, oscillates, and settles toward 1. Try changing the slider to see how the response changes. The figure also handles critical and higher damping, where the output does not oscillate.

```figure
export const params = {
  zeta: { label: 'Damping ratio ζ', min: 0.1, max: 2, step: 0.05, value: 0.3 }
};

export default function ({ zeta }) {
  const response = t => {
    if (Math.abs(zeta - 1) < 1e-8) {
      return 1 - Math.exp(-t) * (1 + t);
    }
    if (zeta < 1) {
      const wd = Math.sqrt(1 - zeta * zeta);
      return 1 - Math.exp(-zeta * t) *
        (Math.cos(wd * t) + (zeta / wd) * Math.sin(wd * t));
    }
    const root = Math.sqrt(zeta * zeta - 1);
    const r1 = -zeta + root;
    const r2 = -zeta - root;
    return 1 + (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r1 - r2);
  };

  return (
    <Plot x={[0, 12]} y={[0, 2]} xLabel="Time (1 / natural frequency)" yLabel="Output y(t)">
      <Fn id="response" f={response} label="Step response" />
    </Plot>
  );
}
```

